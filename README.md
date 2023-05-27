# SwapRouter

A single swap-router contract that can perform trades across multiple DEX protocols.

## Installation

```bash
git clone https://github.com/fomoweth/swap-router

cd swap-router

npm install
```

## Usage

Create an environment file `.env` with the following content:

```text
INFURA_API_KEY=YOUR_INFURA_API_KEY
CMC_API_KEY=YOUR_COIN_MARKET_CAP_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
MNEMONIC=YOUR_MNEMONIC (Optional)
FORK_BLOCK_NUMBER=17328712 (Optional)
ENABLE_GAS_REPORT=(true || false) (Optional)
```

Then you can compile the contracts:

```bash
# compile contracts to generate artifacts and typechain-types
npm run compile

# remove the generated artifacts and typechain-types
npm run clean

# clean and compile
npm run build
```

## Test

```bash
# to run all tests
npm test

# to run tests for the router
npm run test:router

# to run tests for the adapters
npm run test:adapters
```
