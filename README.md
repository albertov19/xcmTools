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

`fetchAssets` gets a list of XC-20 assets in the given network. Returns the name, symbol, decimals and token's precompile address

`calculateSovereignAddress --paraid ID` prints the sovereign account of a given parachain Id for the relay chain, and for other parachains

`checkStorageKey` calculates the storage key for a given asset, useful to check the revert code
