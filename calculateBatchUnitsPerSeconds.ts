import { ApiPromise, WsProvider } from '@polkadot/api';
import CoinGecko from 'coingecko-api';
import { MultiLocation } from '@polkadot/types/interfaces';
import assetsJSON from './assets.json';
import yargs from 'yargs';

let args = yargs.options({
  network: { type: 'string', demandOption: true, alias: 'n' },
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
  });
  await api.isReady;

  // Get Length of assets
  let numSupportedAssets = ((await api.query.assetManager.supportedFeePaymentAssets()) as any)
    .length;

  // For Loop Through Assets
  for (let asset in networkAssets) {
    // Get MultiLocation
    let assetML: MultiLocation = api.createType(
      'MultiLocation',
      (await api.query.assetManager.assetIdType(networkAssets[asset].assetID)).toJSON()['xcm']
    );

    // Check The Asset is a Fee Asset
    let checkAsset = await api.query.assetManager.assetTypeUnitsPerSecond({ XCM: assetML });

    if (checkAsset.toHuman() !== 'null') {
      // Get Assets Decimals
      let decimals = (await api.query.assets.metadata(networkAssets[asset].assetID))
        .toJSON()
        ['decimals'].toString();

      //Build Args for Function
      args = {
        decimals: decimals,
        'xcm-op-cost': '200000000',
        asset: networkAssets[asset]['api-name'],
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

  console.log('Encoded proposal for batchCall is %s', batchCall.method.toHex() || '');
}

async function calculateUnitsPerSecond(args) {
  // Target Price in USD
  const targetPrice = BigInt(10 ** args['decimals'] * 0.02); // 2 CENTS USD
  const xcmTotalCost = BigInt(4 * args['xcm-op-cost']);
  const decimalsFactor = 10 ** args['decimals'];

  // Start CoinGecko API Client
  const CoinGeckoClient = new CoinGecko();
  let tokenPrice;
  let tokenData = {} as any;

  // Get Token Price - If not provided it will use CoinGecko API to get it
  if (!args['price']) {
    if (args['asset']) {
      tokenData = await CoinGeckoClient.simple.price({
        ids: args['asset'],
        vs_currencies: 'usd',
      });
    } else {
      console.error(
        'You need to provide either an asset name with <--a> or a fixed price with <--p>'
      );
    }

    tokenPrice = BigInt(Math.round(decimalsFactor * tokenData.data[args['asset']].usd));
  } else {
    // Use given price
    tokenPrice = BigInt(decimalsFactor * args['price']);
    tokenData.success = true;
  }

  if (tokenData.success) {
    //Calculate Units Per Second
    const unitsPerSecond =
      (targetPrice * BigInt(10 ** 12) * BigInt(decimalsFactor)) / (xcmTotalCost * tokenPrice);

    return unitsPerSecond;
  } else {
    console.error('Token name not supported, note that is token name and not ticker!');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
