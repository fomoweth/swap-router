import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, constants } from "ethers";

import { TokenModel } from "../constants/types";

import { isNative } from "./addresses";
import { getBalance } from "./funds";

import { IERC20Metadata__factory, SwapRouter } from "../../../typechain-types";

interface QueryParams {
    router: SwapRouter;
    maxHop: number;
    tokenIn: TokenModel;
    tokenOut: TokenModel;
    amountIn: BigNumber;
}

export const query = async (params: QueryParams): Promise<any> => {
    const { router, maxHop, tokenIn, tokenOut, amountIn } = params;

    if (maxHop < 1 || maxHop > 4) {
        throw new Error("Max hop out of range");
    }

    const { adapters, path, amounts } = await router.query(
        maxHop,
        tokenIn.address,
        tokenOut.address,
        amountIn
    );

    return {
        adapters,
        path,
        amounts,
        amountQueried: amounts[amounts.length - 1],
    };
};

interface SwapParams {
    result: "success" | "revert";
    router: SwapRouter;
    trader: SignerWithAddress;
    adapters: string[];
    path: string[];
    amountIn: BigNumber;
    amountOutMin: BigNumberish;
    deadline: BigNumber;
    recipient?: string;
}

export const swap = async (params: SwapParams) => {
    if (!params.recipient) {
        params.recipient = params.trader.address;
    }

    const {
        result,
        router,
        trader,
        adapters,
        path,
        amountIn,
        amountOutMin,
        deadline,
        recipient,
    } = params;

    const [tokenIn] = path;
    const [tokenOut] = path.slice(-1);

    const useEth = !!isNative(tokenIn);
    const value = !!useEth ? amountIn : undefined;

    const route = {
        adapters,
        path,
    };

    if (result === "revert") {
        await expect(
            router
                .connect(trader)
                .swap(route, amountIn, amountOutMin, recipient, deadline, {
                    value,
                })
        ).to.be.reverted;
    } else {
        if (!useEth) {
            await approve(tokenIn, router.address, trader);
        }

        const balanceBefore = await getBalance(tokenOut, recipient);

        const tx = await router
            .connect(trader)
            .swap(route, amountIn, amountOutMin, recipient, deadline, {
                value,
            });

        await tx.wait();

        const balanceAfter = await getBalance(tokenOut, recipient);

        const amountReceived = balanceAfter.sub(balanceBefore);

        expect(amountReceived).to.be.gt(amountOutMin);
    }
};

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
