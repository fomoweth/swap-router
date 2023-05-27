import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, constants } from "ethers";

import { isNative } from "../utils/addresses";

import { IERC20Metadata__factory } from "../../../typechain-types";

export const approve = async (
    tokenAddress: string,
    spenderAddress: string,
    signer: SignerWithAddress,
    amount?: BigNumber
): Promise<void> => {
    if (!!isNative(tokenAddress)) return;

    if (!amount) amount = constants.MaxUint256;

    const token = IERC20Metadata__factory.connect(tokenAddress, signer);

    const tx = await token.approve(spenderAddress, amount);
    await tx.wait();

    const allowance = await token.allowance(signer.address, spenderAddress);

    if (!allowance.gt(0)) {
        throw new Error("Failed to approve tokens");
    }
};

export const transfer = async (
    tokenAddress: string,
    amount: BigNumber,
    recipientAddress: string,
    signer: SignerWithAddress
): Promise<void> => {
    if (!!isNative(tokenAddress)) return;

    const token = IERC20Metadata__factory.connect(tokenAddress, signer);

    const balanceBefore = await token.balanceOf(recipientAddress);

    const tx = await token.transfer(recipientAddress, amount);
    await tx.wait();

    const balanceAfter = await token.balanceOf(recipientAddress);

    if (!balanceAfter.gt(balanceBefore)) {
        throw new Error("Failed to transfer tokens");
    }
};
