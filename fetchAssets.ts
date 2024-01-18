/*
  Simple code snippet to fetch the list of assets created and calculated
  their corresponding XC-20 address

  // XC-20 Interface: https://github.com/PureStake/moonbeam/blob/master/precompiles/assets-erc20/ERC20.sol
*/
import { ApiPromise, WsProvider } from '@polkadot/api';
import { bnToHex, stringToHex } from '@polkadot/util';
import yargs from 'yargs';

const args = yargs.options({
  'ws-provider': { type: 'string', demandOption: false, alias: 'w' },
}).argv;

/*
Moonbeam wss://wss.api.moonbeam.network
Moonriver wss://wss.moonriver.moonbeam.network
Moonbase wss://wss.api.moonbase.moonbeam.network
*/

// Create Provider
const wsProvider = new WsProvider(args['ws-provider']);

// Variables
let assetsList = Array();
let assetMetadata;
let assetID = BigInt(0);
let hexID;

const main = async () => {
  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  await api.isReady;

  // Get all the XC-20 Assets
  const assets = await api.query.assets.asset.keys();

  for (let i in assets) {
    let assetTemp = assets[i];

    // Get the Asset ID
    assetID = BigInt(assetTemp.toHuman()[0].replace(/,/g, ''));

    // Transform it to Hex and calculate precompile address by appending FFs
    let tempHex = bnToHex(assetID);
    hexID = '0xffffffff' + tempHex.slice(2, tempHex.length);

    // Get XC-20 Asset Metadata
    assetMetadata = (
      await api.query.assets.metadata(assetID.toString())
    ).toHuman();

    // Build result (remove isFrozen and deposit)
    assetMetadata['address'] = hexID;
    delete assetMetadata['isFrozen'];
    delete assetMetadata['deposit'];
    assetsList.push(assetMetadata);
  }

  console.log(assetsList);

  await api.disconnect();
};

main();
