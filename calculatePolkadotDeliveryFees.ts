import { ApiPromise, WsProvider } from '@polkadot/api';
import type { XcmVersionedXcm } from '@polkadot/types/lookup';
import '@moonbeam-network/api-augment';

//https://github.com/polkadot-fellows/runtimes/blob/main/system-parachains/constants/src/polkadot.rs
const UNITS = BigInt(10000000000);
const DOLLARS = UNITS;
const GRAND = DOLLARS * BigInt(1000);
const CENTS = DOLLARS / BigInt(100);
const MILLICENTS = CENTS / BigInt(1000);

// CHECK Network

// Polkadot Constants
// https://github.com/polkadot-fellows/runtimes/blob/v1.1.0/relay/polkadot/src/xcm_config.rs#L129-L130
// https://github.com/polkadot-fellows/runtimes/blob/b5ba0e91d5dd3c4020e848b27be5f2b47e16f281/relay/kusama/src/lib.rs#L416
// https://github.com/polkadot-fellows/runtimes/blob/v1.1.0/relay/polkadot/src/xcm_config.rs#L126
// ExponentialPrice<FeeAssetId, BaseDeliveryFee, TransactionByteFee, Dmp>;
// pub const TransactionByteFee: Balance = 10 * MILLICENTS;
// pub const BaseDeliveryFee: u128 = CENTS.saturating_mul(3);

const dotAHTxByteFee = BigInt(10) * MILLICENTS;
const dotAHToSiblingBaseDeliveryFee = BigInt(3) * CENTS;

// Config:
const wsEndpoint = 'wss://polkadot-rpc.dwellir.com';

// Asset MultiLocation
const assetML = {
  parents: 0,
  interior: { here: null },
};
const amount = '100000000000';
const paraID = 2004; //ParaID

/*
	fn price_for_delivery(id: Self::Id, msg: &Xcm<()>) -> Assets {
		let msg_fee = (msg.encoded_size() as u128).saturating_mul(M::get());
		let fee_sum = B::get().saturating_add(msg_fee);
		let amount = F::get_fee_factor(id).saturating_mul_int(fee_sum);
		(A::get(), amount).into()
	}
  */

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
  const deliveryFeeFactor = await api.query.dmp.deliveryFeeFactor(
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
    `The Max Polkadot XCM Delivery Fee in DOT is ${Number(fee) / Number(UNITS)}`
  );
};
main();
