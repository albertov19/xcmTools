import { ApiPromise, WsProvider } from '@polkadot/api';
import { xxhashAsU8a, blake2AsU8a } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a, hexToString } from '@polkadot/util';
import { MultiLocation } from '@polkadot/types/interfaces';
import yargs from 'yargs';

const args = yargs.options({
  asset: { type: 'string', demandOption: true, alias: 'a' },
  'ws-provider': { type: 'string', demandOption: false, alias: 'w' },
}).argv;

/*const assetML = {
  parents: 1,
  interior: {
    X2: [
      {
        Parachain: 1000,
      },
      { PalletInstance: 50 },
      {
        GeneralIndex: 1984,
      },
    ],
  },
};*/

/*
Moonbeam wss://wss.api.moonbeam.network
Moonriver wss://wss.moonriver.moonbeam.network
Moonbase wss://wss.api.moonbase.moonbeam.network
*/

// Create Provider
const wsProvider = new WsProvider(args['ws-provider']);

const main = async () => {
  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
  });
  await api.isReady;

  const asset: MultiLocation = api.createType('MultiLocation', JSON.parse(args['asset']));

  const assetIdHex = u8aToHex(api.registry.hash(asset.toU8a()).slice(0, 16).reverse());

  let palletEncoder = new TextEncoder().encode('EVM');
  let palletHash = xxhashAsU8a(palletEncoder, 128);
  let storageEncoder = new TextEncoder().encode('AccountCodes');
  let storageHash = xxhashAsU8a(storageEncoder, 128);
  let assetAddress = new Uint8Array([...hexToU8a('0xFFFFFFFF'), ...hexToU8a(assetIdHex)]);
  let addressHash = blake2AsU8a(assetAddress, 128);
  let concatKey = new Uint8Array([...palletHash, ...storageHash, ...addressHash, ...assetAddress]);

  console.log(`Storage Key ${u8aToHex(concatKey)}`);
  console.log(`Asset Address Precompile: ${u8aToHex(assetAddress)}`);
  console.log(`Asset ID is ${BigInt(assetIdHex).toString(10)}\n\n`);

  await api.disconnect();
};

main();
