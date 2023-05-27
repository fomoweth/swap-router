import { TokenModel } from "./types";

const ETH: TokenModel = {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    slot: 0,
};

const WETH: TokenModel = {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    slot: 3,
};

const STETH: TokenModel = {
    address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    name: "Lido Staked ETH",
    symbol: "stETH",
    decimals: 18,
    slot: 0,
};

const WSTETH: TokenModel = {
    address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    name: "Lido wstETH",
    symbol: "wstETH",
    decimals: 18,
    slot: 0,
};

const WBTC: TokenModel = {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    name: "Wrapped BTC",
    symbol: "WBTC",
    decimals: 8,
    slot: 0,
};

const LINK: TokenModel = {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    name: "Chainlink",
    symbol: "LINK",
    decimals: 18,
    slot: 1,
};

const SUSHI: TokenModel = {
    address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    name: "SushiToken",
    symbol: "SUSHI",
    decimals: 18,
    slot: 0,
};

const UNI: TokenModel = {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    name: "Uniswap",
    symbol: "UNI",
    decimals: 18,
    slot: 4,
};

const DAI: TokenModel = {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    slot: 2,
};

const FEI: TokenModel = {
    address: "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
    name: "Fei USD",
    symbol: "FEI",
    decimals: 18,
    slot: 0,
};

const FRAX: TokenModel = {
    address: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    name: "Frax",
    symbol: "FRAX",
    decimals: 18,
    slot: 0,
};

const MIM: TokenModel = {
    address: "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
    name: "Magic Internet Money",
    symbol: "MIM",
    decimals: 18,
    slot: 0,
};

const USDC: TokenModel = {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    slot: 9,
};

const USDT: TokenModel = {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    slot: 2,
};

export const TOKENS = [
    ETH,
    WETH,
    STETH,
    WSTETH,
    WBTC,
    LINK,
    SUSHI,
    UNI,
    DAI,
    FEI,
    FRAX,
    MIM,
    USDC,
    USDT,
];

export const BRIDGE_TOKENS = [ETH, WETH, USDC, USDT, DAI, FRAX, WBTC];
