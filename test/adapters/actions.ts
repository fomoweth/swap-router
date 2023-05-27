import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";

import { TokenModel } from "../shared/constants/types";
import { transfer } from "../shared/utils/actions";
import { isNative } from "../shared/utils/addresses";
import { getBalance } from "../shared/utils/funds";

import { IAdapter } from "../../typechain-types";

export const queryThenSwap = async (
    trader: SignerWithAddress,
    adapter: IAdapter,
    tokenIn: TokenModel,
    tokenOut: TokenModel,
    amountToSwap: BigNumber,
    amountExpected: BigNumber,
    slippage: BigNumberish,
    result: "success" | "revert"
): Promise<void> => {
    if (result === "revert") {
        await expect(
            adapter
                .connect(trader)
                .swap(
                    tokenIn.address,
                    tokenOut.address,
                    amountToSwap,
                    trader.address
                )
        ).to.be.reverted;
    } else {
        const percentageFactor = BigNumber.from(1e4);
        const halfPercent = percentageFactor.div(2);

        const delta = amountExpected
            .mul(slippage)
            .add(halfPercent)
            .div(percentageFactor);

        const amountQueried = await adapter.query(
            tokenIn.address,
            tokenOut.address,
            amountToSwap
        );

        expect(amountQueried).to.be.eq(amountExpected);

        const useEth = !!isNative(tokenIn.address);
        const value = !!useEth ? amountToSwap : undefined;

        const initialBalance = await getBalance(
            tokenOut.address,
            trader.address
        );

        if (!useEth) {
            await transfer(
                tokenIn.address,
                amountToSwap,
                adapter.address,
                trader
            );
        }

        const tx = await adapter
            .connect(trader)
            .swap(
                tokenIn.address,
                tokenOut.address,
                amountToSwap,
                trader.address,
                { value }
            );

        const receipt = await tx.wait();

        const amountReceived = await getBalance(
            tokenOut.address,
            trader.address
        );

        const finalBalance = !!isNative(tokenOut.address)
            ? amountReceived.sub(initialBalance).sub(receipt.gasUsed)
            : amountReceived;

        expect(finalBalance).to.be.closeTo(amountQueried, delta);
    }
};
