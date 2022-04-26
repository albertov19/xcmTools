import yargs from 'yargs';
import CoinGecko from 'coingecko-api';

const args = yargs.options({
  decimals: { type: 'string', demandOption: true, alias: 'd' },
  'xcm-op-cost': { type: 'string', demandOption: true, alias: 'xoc' },
  price: { type: 'string', demandOption: false, alias: 'p' }, // overwrite price
  asset: { type: 'string', demandOption: false, alias: 'a' },
}).argv;

// Target Price in USD
const targetPrice = BigInt(10 ** args['decimals'] * 0.02); // 2 CENTS USD
const xcmTotalCost = BigInt(4 * args['xcm-op-cost']);
const decimalsFactor = 10 ** args['decimals'];

// Start CoinGecko API Client
const CoinGeckoClient = new CoinGecko();

async function main() {
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

    tokenPrice = BigInt(decimalsFactor * tokenData.data[args['asset']].usd);
  } else {
    // Use given price
    tokenPrice = BigInt(decimalsFactor * args['price']);
    tokenData.success = true;
  }

  if (tokenData.success) {
    //Calculate Units Per Second
    const unitsPerSecond =
      (targetPrice * BigInt(10 ** 12) * BigInt(decimalsFactor)) / (xcmTotalCost * tokenPrice);
    console.log(`The UnitsPerSecond need to be set ${unitsPerSecond.toString()}`);
  } else {
    console.error('Token name not supported, note that is token name and not ticker!');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
