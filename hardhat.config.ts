import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";
import {
    ChainId,
    envConfig,
    getHardhatNetworkConfig,
    getNetworkConfig,
} from "./config";

const config: HardhatUserConfig = {
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./test",
    },
    solidity: {
        compilers: [
            {
                version: "0.8.17",
                settings: {
                    viaIR: true,
                    evmVersion: "istanbul",
                    optimizer: {
                        enabled: true,
                        runs: 1_000_000,
                    },
                    metadata: {
                        bytecodeHash: "none",
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: getHardhatNetworkConfig(ChainId.MAINNET),
        mainnet: getNetworkConfig(ChainId.MAINNET),
        optimism: getNetworkConfig(ChainId.OPTIMISM),
        polygon: getNetworkConfig(ChainId.POLYGON),
        arbitrum: getNetworkConfig(ChainId.ARBITRUM),
    },
    etherscan: {
        apiKey: envConfig.ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: envConfig.REPORT_GAS,
        coinmarketcap: envConfig.CMC_API_KEY,
        currency: "USD",
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
    },
    mocha: {
        timeout: 60000,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    tracer: {
        enabled: true,
        logs: true,
        calls: true,
        sstores: false,
        sloads: false,
        gasCost: false,
    },
};

export default config;
