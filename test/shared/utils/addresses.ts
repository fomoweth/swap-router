import { utils } from "ethers";

import { NATIVE_ADDRESS, WETH_ADDRESS } from "../constants/addresses";
import { TokenModel } from "../constants/types";

export const { getAddress, isAddress } = utils;

export const isSameAddress = (x: string, y: string): boolean => {
    return getAddress(x) === getAddress(y);
};

export const isNative = (tokenAddress: string): boolean => {
    return !!isSameAddress(tokenAddress, NATIVE_ADDRESS);
};

export const isWrappedNative = (tokenAddress: string): boolean => {
    return !!isSameAddress(tokenAddress, WETH_ADDRESS);
};

export const sortTokens = <T extends string | TokenModel>(
    ...tokens: T[]
): T[] => {
    return tokens.sort((tokenA, tokenB) =>
        getAddress(typeof tokenA === "string" ? tokenA : tokenA.address) <
        getAddress(typeof tokenB === "string" ? tokenB : tokenB.address)
            ? -1
            : 1
    );
};
