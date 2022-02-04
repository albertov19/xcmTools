import { ApiPromise, WsProvider } from '@polkadot/api';
import { xxhashAsU8a, blake2AsU8a } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { MultiLocation } from '@polkadot/types/interfaces';

const assetML = {
  parents: 1,
  interior: {
    X1: {
      Parachain: 2024,
    },
  },
};

// Create Provider
const wsProvider = new WsProvider('wss://wss.moonriver.moonbeam.network');

const main = async () => {
  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
  });
  await api.isReady;

  const asset: MultiLocation = api.createType('MultiLocation', assetML);

  const assetId = u8aToHex(api.registry.hash(asset.toU8a()).slice(0, 16).reverse());

  let palletEncoder = new TextEncoder().encode('EVM');
  let palletHash = xxhashAsU8a(palletEncoder, 128);
  let storageEncoder = new TextEncoder().encode('AccountCodes');
  let storageHash = xxhashAsU8a(storageEncoder, 128);
  let assetAddress = new Uint8Array([...hexToU8a('0xFFFFFFFF'), ...hexToU8a(assetId)]);
  let addressHash = blake2AsU8a(assetAddress, 128);
  let concatKey = new Uint8Array([...palletHash, ...storageHash, ...addressHash, ...assetAddress]);

  console.log(`Storage Key ${u8aToHex(concatKey)}`);
  console.log(`Asset Address Precompile: ${u8aToHex(assetAddress)}\n\n`);

  await api.disconnect();
};

main();
