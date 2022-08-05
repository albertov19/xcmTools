import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import yargs from 'yargs';
import { MultiLocation } from '@polkadot/types/interfaces';

const args = yargs.options({
  'parachain-ws-provider': { type: 'string', demandOption: true, alias: 'w' }, //Target WS Provider
  address: { type: 'string', demandOption: true, alias: 'a' },
  'para-id': { type: 'string', demandOption: true, alias: 'p' }, //Origin Parachain ID
}).argv;

// Construct
const wsProvider = new WsProvider(args['parachain-ws-provider']);

async function main() {
  // Create Provider and Type
  const api = await ApiPromise.create({ provider: wsProvider });

  // Check Ethereum Address and/or Decode
  let address = args['address'];
  let account;
  const ethAddress = address.length === 42;

  if (!ethAddress) {
    address = decodeAddress(address);
    account = { AccountId32: { network: 'Any', id: address } };
  } else {
    account = { AccountKey20: { network: 'Any', key: address } };
  }

  const multilocation: MultiLocation = api.createType(
    'MultiLocation',
    JSON.parse(
      JSON.stringify({
        parents: 1,
        interior: {
          X2: [{ Parachain: JSON.parse(args['para-id']) }, account],
        },
      })
    )
  );

  console.log(multilocation.toString());

  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);

  const DescendOriginAddress32 = u8aToHex(api.registry.hash(toHash).slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(api.registry.hash(toHash).slice(0, 20));

  console.log('32 byte address is %s', DescendOriginAddress32);
  console.log('20 byte address is %s', DescendOriginAddress20);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
