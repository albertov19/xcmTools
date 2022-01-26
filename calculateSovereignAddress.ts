import { u8aToHex } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ParaId } from '@polkadot/types/interfaces';
import yargs from 'yargs';

const args = yargs.options({
  'para-id': { type: 'string', demandOption: true, alias: 'paraid' },
}).argv;

const main = async () => {
  const relayProvider = new WsProvider(
    'wss://frag-moonbase-relay-rpc-ws.g.moonbase.moonbeam.network'
  );

  const relayApi = await ApiPromise.create({
    provider: relayProvider,
  });

  const targetParaId: ParaId = relayApi.createType('ParaId', args['para-id']);

  const sovAddressRelay = u8aToHex(
    new Uint8Array([...new TextEncoder().encode('para'), ...targetParaId.toU8a()])
  ).padEnd(66, '0');

  const sovAddressPara = u8aToHex(
    new Uint8Array([...new TextEncoder().encode('sibl'), ...targetParaId.toU8a()])
  ).padEnd(66, '0');

  console.log(`Sovereign Account Address on Relay: ${sovAddressRelay}`);
  console.log(`Sovereign Account Address on other Parachains: ${sovAddressPara}`);
};

main();
