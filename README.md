# xcmTools

Different set of tools with the Polkadot API.

**Use at your own risk!**

## Getting Started

Install packages:

```
yarn
```

Then, run script with `ts-node` depending on the file


## Scripts

`calculateLocalAssetInfo --w <"ws_endpoint"> --a <"asset">` calculates the storage key element, XC-20 address and Asset ID of a given asset. Need to provide the ws provider (`--w`) and the local asset counter (`--a`)  

`calculateMultilocationDerivative --w <"ws_endpoint"> --a <"address"> --p <"para-id">` calculates the multilocaiton-derived address for remote calls through XCM. Need to provide the ws provider (`--w`) of the target parachain, the address (`--a`) of the origin account, and the parachain id (`--p`) of the origin parachain 

`calculateMultilocationInfo --n <"network"> --a <"asset">` calculates the storage key element, XC-20 address and Asset ID of a given asset. Need to provide the network (Moonbeam, Moonriver, Moonbase) (`--n`) and the asset multilocation (`--a`)  

`calculateSovereignAddress --r <"polkadot/kusama/moonbase"> --paraid <"para-id">` prints the sovereign account of a given parachain Id for the relay chain, and for other parachains. Need to provide the relay to use (`--r` either polkadot, kusama or moonbase) and the parachain id

`calculateUnitsPerSeconds --a <"asset name kusama/karura/kintsugi"> --d <"decimals"> --xwc <"TotalXCMWeightCost"> --price <"asset-price"> --t <"TargetPrioce">` simple tool to calculate the units per second to be charged for a given target price (0.02$ per XCM transfer). Target price can also be configured with `--t`. It uses the CoinGecko API to fetch the token price, although it can be overwritten with `--price` flag. You need to provide the asset name as supported by CoinGecko (flag `--aset` or `--a`), the decimals (flag --decimals or `-d`), there are other inputs that are optional like the cost of each XCM instruction (`--xcm-op-cost` or `--xoc`), by default set to 200M weight units per instruction (Moonbeam & Moonriver)

`calculateBatchUnitsPerSeconds --n <"network moonbeam/moonriver">` script to calculate the batched encoded call data to set the units per second for XCM msgs for all supported types. It wil read the asset information from the `assets.json` file that needs to be manually updated. It uses the CoinGecko API to fetch the token price, although it can be overwritten with a price key and value in the `.json` file. Check `calculateUnitsPerSeconds` for more help.

`fetchAssets --w <"ws_endpoint">` gets a list of XC-20 assets in the given network. Returns the name, symbol, decimals and token's precompile address. Need to provide the ws provider (`--w`)


