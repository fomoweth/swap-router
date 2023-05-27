import "dotenv/config";
import { HDAccountsUserConfig } from "hardhat/types";

interface EnvConfig {
    readonly INFURA_API_KEY: string;
    readonly CMC_API_KEY: string;
    readonly ETHERSCAN_API_KEY: string;
    readonly MNEMONIC: string;
    readonly FORK_BLOCK_NUMBER: string | undefined;
    readonly REPORT_GAS: boolean;
}

const assertEnvConfig = (
    key: string,
    optional: boolean
): string | undefined => {
    const value = process.env[key];

    if (!value && !optional) {
        throw new TypeError(`Missing environment variable: ${key}`);
    }

    return value;
};

export const ENV: EnvConfig = {
    INFURA_API_KEY: assertEnvConfig("INFURA_API_KEY", false)!,
    CMC_API_KEY: assertEnvConfig("CMC_API_KEY", false)!,
    ETHERSCAN_API_KEY: assertEnvConfig("ETHERSCAN_API_KEY", false)!,
    MNEMONIC:
        assertEnvConfig("MNEMONIC", true) ||
        "test test test test test test test test test test test junk",
    FORK_BLOCK_NUMBER: assertEnvConfig("FORK_BLOCK_NUMBER", true),
    REPORT_GAS: assertEnvConfig("REPORT_GAS", true) === "true",
};

export const RPC_URL = "https://mainnet.infura.io/v3/".concat(
    ENV.INFURA_API_KEY
);

export const ACCOUNTS: HDAccountsUserConfig = {
    mnemonic: ENV.MNEMONIC,
    initialIndex: 0,
    count: 20,
    path: "m/44'/60'/0'/0",
};
