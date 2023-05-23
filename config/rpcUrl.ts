import { ChainId } from "./constants";
import { envConfig } from "./env";

export const getRpcUrl = (chainId: ChainId) => {
    const rpcUrl =
        chainId === ChainId.MAINNET
            ? "https://mainnet.infura.io/v3/"
            : `https://${ChainId[chainId].toLowerCase()}-mainnet.infura.io/v3/`;

    return rpcUrl.concat(envConfig.INFURA_API_KEY);
};
