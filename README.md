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

`calculateAddressStorageKey --w <"ws_endpoint"> --a <"address">` calculates the storage key element of a specific EVM address. Need to provide the address (`--a`) and the ws provider (`--w`)

`calculateMultilocationInfo --w <"ws_endpoint"> --a <"asset">` calculates the storage key element, XC-20 address and Asset ID of a given asset. Need to provide the ws provider (`--w`) and the asset multilocation (`--a`)  

`calculateSovereignAddress --r <"polkadot/kusama/moonbase"> --paraid <"para-id">` prints the sovereign account of a given parachain Id for the relay chain, and for other parachains. Need to provide the relay to use (`--r` either polkadot, kusama or moonbase) and the parachain id

`calculateUnitsPerSeconds --a <"asset name kusama/karura/kintsugi"> --d <"decimals"> --xoc <"WeighUnitsPerXCMInstruction"> --price <"asset-price">` simple tool to calculate the units per second to be charged for a given target price (0.02$ per XCM transfer). It uses the CoinGecko API to fetch the token price, although it can be overwritten with `--price` flag. You need to provide the asset name as supported by CoinGecko (flag `--aset` or `--a`), the decimals (flag --decimals or `-d`) and the cost of each XCM instruction (`--xcm-op-cost` or `--xoc`)

`fetchAssets --w <"ws_endpoint">` gets a list of XC-20 assets in the given network. Returns the name, symbol, decimals and token's precompile address. Need to provide the ws provider (`--w`)


