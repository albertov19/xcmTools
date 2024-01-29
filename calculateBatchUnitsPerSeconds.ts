import { ApiPromise, WsProvider } from '@polkadot/api';
import { MultiLocation } from '@polkadot/types/interfaces';
import axios from 'axios';
import assetsJSON from './assets.json';
import yargs from 'yargs';
import 'dotenv/config';

let args = yargs.options({
  network: { type: 'string', demandOption: true, alias: 'n' },
  'xcm-weight-cost': {
    type: 'string',
    demandOption: true,
    alias: 'xwc',
    default: 1000000000,
  },
  target: { type: 'string', demandOption: true, alias: 't', default: '0.02' },
}).argv;

let wsEndpoint;
switch (args['network'].toLowerCase()) {
  case 'moonbeam':
    wsEndpoint = 'wss://wss.api.moonbeam.network';
    break;
  case 'moonriver':
    wsEndpoint = 'wss://wss.api.moonriver.moonbeam.network';
    break;
  case 'moonbase':
    wsEndpoint = 'wss://wss.api.moonbase.moonbeam.network';
    break;
  default:
    console.error('Supported network are Moonbeam and Moonriver');
}

let networkAssets = assetsJSON[args['network']];

// Create Provider
const wsProvider = new WsProvider(wsEndpoint);

// Variables
const batchTxs = [];

async function main() {
  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  await api.isReady;

  // Get Length of assets
  let numSupportedAssets = (
    (await api.query.assetManager.supportedFeePaymentAssets()) as any
  ).length;

  // For Loop Through Assets
  for (let asset in networkAssets) {
    // Get MultiLocation
    let assetML: MultiLocation = api.createType(
      'MultiLocation',
      (
        await api.query.assetManager.assetIdType(networkAssets[asset].assetID)
      ).toJSON()['xcm']
    );

    // Check The Asset is a Fee Asset
    let checkAsset = await api.query.assetManager.assetTypeUnitsPerSecond({
      XCM: assetML,
    });

    if (checkAsset.toHuman() !== 'null') {
      // Get Assets Decimals
      let decimals = (
        await api.query.assets.metadata(networkAssets[asset].assetID)
      )
        .toJSON()
        ['decimals'].toString();

      //Build Args for Function
      args = {
        decimals: decimals,
        asset: networkAssets[asset]['api-name'],
        target: args['target'],
        xwc: args['xwc'],
      };
      if (networkAssets[asset]['price']) {
        args.price = networkAssets[asset]['price'];
      }

      // Calcualte Units Per Second
      let unitsPerSeconds = await calculateUnitsPerSecond(args);

      // Batch Tx
      batchTxs.push(
        await api.tx.assetManager.setAssetUnitsPerSecond(
          { XCM: assetML },
          unitsPerSeconds,
          numSupportedAssets + 10
        )
      );
    }
  }

  // Batch Tx
  const batchCall = api.tx.utility.batchAll(batchTxs);

  console.log(
    'Encoded proposal for batchCall is %s',
    batchCall.method.toHex() || ''
  );
}

async function calculateUnitsPerSecond(args) {
  // Target Price in USD
  const targetPrice = BigInt(10 ** args['decimals'] * args['target']); // 2 CENTS USD

  const decimalsFactor = 10 ** args['decimals'];

  // XCM Weight Cost
  const xcmTotalCost = BigInt(args['xwc']);

  let tokenPrice;
  let tokenData = {} as any;

  // Get Token Price - If not provided it will use CoinGecko API to get it
  if (!args['price']) {
    if (args['asset']) {
      console.log(`Fetching Price for ${args['asset']}`);
      try {
        tokenData = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price',
          {
            params: {
              ids: args['asset'],
              vs_currencies: 'usd',
              x_cg_demo_api_key: process.env.COINGECKO_API,
            },
            headers: {
              Accept: 'application/json',
            },
          }
        );
      } catch (error) {
        throw new Error(
          `Something was not right for ${args['asset']} \n ${error}`
        );
      }
    } else {
      console.error(
        'You need to provide either an asset name with <--a> or a fixed price with <--p>'
      );
    }

    if (tokenData.status === 200 && tokenData.data[args['asset']].usd) {
      tokenPrice = BigInt(
        Math.round(decimalsFactor * tokenData.data[args['asset']].usd)
      );
    } else {
      throw new Error(
        `Something was not right for ${args['asset']} \n ${tokenData.status} - ${tokenData.statusText}`
      );
    }
  } else {
    // Use given price
    tokenPrice = BigInt(Math.trunc(decimalsFactor * args['price']));
    tokenData.status = 200;
  }

  if (tokenData.status === 200) {
    //Calculate Units Per Second
    const unitsPerSecond =
      (targetPrice * BigInt(10 ** 12) * BigInt(decimalsFactor)) /
      (xcmTotalCost * tokenPrice);

    return unitsPerSecond;
  } else {
    console.error(
      'Token name not supported, note that is token name and not ticker!'
    );
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
