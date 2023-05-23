import {
    HardhatNetworkUserConfig,
    HDAccountsUserConfig,
    HttpNetworkUserConfig,
} from "hardhat/types";
import { ChainId } from "./constants";
import { envConfig } from "./env";
import { getRpcUrl } from "./rpcUrl";

const getAccounts = (count: number = 20): HDAccountsUserConfig => {
    return {
        mnemonic: envConfig.MNEMONIC,
        initialIndex: 0,
        count: count,
        path: "m/44'/60'/0'/0",
    };
};

export const getHardhatNetworkConfig = (
    chainId: ChainId
): HardhatNetworkUserConfig => {
    return {
        allowUnlimitedContractSize: false,
        chainId: chainId,
        forking: {
            url: getRpcUrl(chainId),
            blockNumber: !!envConfig.FORK_BLOCK_NUMBER
                ? +envConfig.FORK_BLOCK_NUMBER
                : undefined,
        },
        accounts: getAccounts(),
    };
};

export const getNetworkConfig = (chainId: ChainId): HttpNetworkUserConfig => {
    return {
        chainId: chainId,
        url: getRpcUrl(chainId),
        accounts: getAccounts(),
    };
};
