import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";
import { ACCOUNTS, ENV, RPC_URL } from "./config";

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
                version: "0.8.15",
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
        hardhat: {
            allowUnlimitedContractSize: false,
            chainId: 1,
            forking: {
                url: RPC_URL,
                blockNumber: !!ENV.FORK_BLOCK_NUMBER
                    ? +ENV.FORK_BLOCK_NUMBER
                    : undefined,
            },
            accounts: ACCOUNTS,
        },
        mainnet: {
            chainId: 1,
            url: RPC_URL,
            accounts: ACCOUNTS,
        },
    },
    etherscan: {
        apiKey: ENV.ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: ENV.REPORT_GAS,
        coinmarketcap: ENV.CMC_API_KEY,
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
};

export default config;
