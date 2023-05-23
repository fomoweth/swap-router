import "dotenv/config";

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
    value: string | undefined,
    optional: boolean
): string | undefined => {
    if (!optional && !value) {
        throw new TypeError(`Missing environment variable: ${key}`);
    }

    return value;
};

export const envConfig: EnvConfig = {
    INFURA_API_KEY: assertEnvConfig(
        "INFURA_API_KEY",
        process.env.INFURA_API_KEY,
        false
    )!,
    CMC_API_KEY: assertEnvConfig(
        "CMC_API_KEY",
        process.env.CMC_API_KEY,
        false
    )!,
    ETHERSCAN_API_KEY: assertEnvConfig(
        "ETHERSCAN_API_KEY",
        process.env.ETHERSCAN_API_KEY,
        false
    )!,
    MNEMONIC:
        assertEnvConfig("MNEMONIC", process.env.MNEMONIC, true) ||
        "test test test test test test test test test test test junk",
    FORK_BLOCK_NUMBER: assertEnvConfig(
        "FORK_BLOCK_NUMBER",
        process.env.FORK_BLOCK_NUMBER,
        true
    ),
    REPORT_GAS:
        assertEnvConfig("REPORT_GAS", process.env.REPORT_GAS, true) === "true",
};
