import { ApiPromise, WsProvider } from '@polkadot/api';
import type { XcmVersionedXcm } from '@polkadot/types/lookup';
import '@moonbeam-network/api-augment';

//https://github.com/polkadot-fellows/runtimes/blob/main/system-parachains/constants/src/polkadot.rs
const UNITS = BigInt(10000000000);
const DOLLARS = UNITS;
const GRAND = DOLLARS * BigInt(1000);
const CENTS = DOLLARS / BigInt(100);
const MILLICENTS = CENTS / BigInt(1000);

// AssetHub Constants
// https://github.com/polkadot-fellows/runtimes/blob/v1.1.0/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs#L577
const dotAHToSiblingBaseDeliveryFee = BigInt(3) * CENTS;
// https://github.com/polkadot-fellows/runtimes/blob/v1.1.0/system-parachains/asset-hubs/asset-hub-polkadot/src/lib.rs#L247
const dotAHTxByteFee = MILLICENTS;

// Config:
const wsEndpoint = 'wss://statemint-rpc.dwellir.com';
// Asset MultiLocation - This is the asset with the longest index possible
const assetML = {
  parents: 1,
  interior: {
    x3: [{ parachain: 1000 }, { palletInstance: 50 }, { generalIndex: '1337' }],
  },
};
const amount = '1000000';
const paraID = 2004; //ParaID

// Provider
const provider = new WsProvider(wsEndpoint);

// XCM Message
const message = {
  V3: [
    {
      ReserveAssetDeposited: [
        {
          id: {
            Concrete: assetML,
          },
          fun: { Fungible: BigInt(amount) },
        },
      ],
    },
    {
      ClearOrigin: [],
    },
    {
      BuyExecution: [
        {
          id: {
            Concrete: assetML,
          },
          fun: { Fungible: BigInt(amount) },
        },
        { Unlimited: null },
      ],
    },
    {
      DepositAsset: {
        assets: {
          Wild: {
            AllCounted: 1,
          },
        },
        beneficiary: {
          parents: 0,
          interior: {
            X1: {
              AccountKey20: {
                network: null,
                key: '0x0000000000000000000000000000000000000000',
              },
            },
          },
        },
      },
    },
    {
      SetTopic:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
  ],
};

const main = async () => {
  // Provider
  const api = await ApiPromise.create({
    provider: provider,
    noInitWarn: true,
  });
  await api.isReady;

  const xcm: XcmVersionedXcm = api.createType(
    'XcmVersionedXcm',
    message
  ) as any;

  const xcmBytes = xcm.toU8a();

  // Calculate XCM Delivery Fee
  // https://github.com/paritytech/polkadot-sdk/pull/1234
  // https://github.com/paritytech/polkadot-sdk/blob/b57e53dc139cc398318d42107e915e5883a77734/polkadot/runtime/common/src/xcm_sender.rs#L67-L93
  // delivery_fee_factor * (base_fee + encoded_msg_len * per_byte_fee)

  // Get Delivery Fee Factor
  // https://github.com/paritytech/polkadot-sdk/blob/acd043bc5fc9acfa384b69c33e341f925ef250a7/cumulus/pallets/xcmp-queue/src/lib.rs#L960-L965
  const deliveryFeeFactor = await api.query.xcmpQueue.deliveryFeeFactor(
    BigInt(paraID)
  );
  await api.disconnect();

  // Delivery Fee Factor is returned as a U128 but we need it as a F128
  const convDeliveryFeeFactor =
    BigInt(deliveryFeeFactor.toString()) / BigInt(10 ** 18);

  const fee =
    convDeliveryFeeFactor *
    (dotAHToSiblingBaseDeliveryFee + BigInt(xcmBytes.length) * dotAHTxByteFee);

  console.log(
    `The Max AH Delivery Fee in DOT is ${Number(fee) / Number(UNITS)}`
  );
};
main();
