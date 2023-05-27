import {
    getStorageAt,
    setStorageAt,
} from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, constants, utils } from "ethers";

import { ZERO_ADDRESS } from "../constants/addresses";
import { TokenModel } from "../constants/types";

import { isNative } from "./addresses";
import { getLatestAnswerETH } from "./chainlink";
import { parseUnits } from "./units";

import { IERC20Metadata__factory } from "../../../typechain-types";

export const seedTokens = async (
    token: TokenModel,
    ethAmount: BigNumberish,
    accounts: string[]
): Promise<BigNumber> => {
    if (!BigNumber.isBigNumber(ethAmount)) {
        ethAmount = parseUnits(ethAmount);
    }

    if (!!isNative(token.address)) return ethAmount;

    const tokenPrice = await getLatestAnswerETH(token.address);
    const unit = parseUnits(1, token.decimals);
    const seedAmount = ethAmount.mul(unit).div(tokenPrice);

    const value = encode(["uint256"], [seedAmount]);

    for (const account of accounts) {
        const balanceSlot = utils.keccak256(
            encode(["address", "uint256"], [account, token.slot])
        );

        await setStorageAt(token.address, balanceSlot, value);
    }

    return seedAmount;
};

export const getBalanceSlot = async (tokenAddress: string): Promise<number> => {
    const token = IERC20Metadata__factory.connect(
        tokenAddress,
        ethers.provider
    );

    for (let i = 0; i < 100; i++) {
        let balanceSlot = utils.keccak256(
            encode(["address", "uint256"], [ZERO_ADDRESS, i])
        );

        while (balanceSlot.startsWith("0x0"))
            balanceSlot = "0x" + balanceSlot.slice(3);

        const valuePrior = await getStorageAt(token.address, balanceSlot);
        const balanceToTest =
            valuePrior === encode(["uint256"], [10])
                ? encode(["uint256"], [2])
                : encode(["uint256"], [10]);

        await setStorageAt(token.address, balanceSlot, balanceToTest);

        const balance = await token.balanceOf(ZERO_ADDRESS);

        if (!balance.eq(BigNumber.from(balanceToTest)))
            await setStorageAt(token.address, balanceSlot, valuePrior);

        if (balance.eq(BigNumber.from(balanceToTest))) return i;
    }

    throw new Error("Failed to fetch balance slot");
};

export const getAllowance = async (
    tokenAddress: string,
    spenderAddress: string,
    ownerAddress: string
): Promise<BigNumber> => {
    if (!!isNative(tokenAddress)) return constants.MaxUint256;

    const token = IERC20Metadata__factory.connect(
        tokenAddress,
        ethers.provider
    );

    return await token.allowance(ownerAddress, spenderAddress);
};

export const getBalance = async (
    tokenAddress: string,
    accountAddress: string
): Promise<BigNumber> => {
    if (!!isNative(tokenAddress)) {
        return await ethers.provider.getBalance(accountAddress);
    }

    const token = IERC20Metadata__factory.connect(
        tokenAddress,
        ethers.provider
    );

    return await token.balanceOf(accountAddress);
};

const encode = (types: string[], values: any[]) => {
    return utils.defaultAbiCoder.encode(types, values);
};
