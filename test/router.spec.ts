import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import chalk from "chalk";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";

import { TokenModel } from "./shared/constants/types";
import { completeFixture } from "./shared/fixtures";
import { makeSuite } from "./shared/makeSuite";
import { query, swap } from "./shared/utils/actions";
import { seedTokens } from "./shared/utils/funds";

makeSuite({ title: chalk.cyanBright("SwapRouter\n") }, (ctx) => {
    it("#deployment", async () => {
        const { deployer, router, adapters } = await loadFixture(
            completeFixture
        );

        expect(await router.owner()).to.be.eq(deployer.address);

        const adapterAddresses = Object.values(adapters).map(
            (adapter) => adapter.address
        );

        expect(await router.getAdapters()).to.be.members(adapterAddresses);

        const bridgeTokenAddresses = ctx.bridgeTokens.map(
            (token) => token.address
        );

        expect(await router.getBridgeTokens()).to.be.members(
            bridgeTokenAddresses
        );
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("USDC", "WETH"),
        amountToSwapInETH: 3,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("WBTC", "WETH"),
        amountToSwapInETH: 14,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("WBTC", "USDT"),
        amountToSwapInETH: 14,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("USDC", "USDT"),
        amountToSwapInETH: 5,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("LINK", "USDC"),
        amountToSwapInETH: 6,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("LINK", "UNI"),
        amountToSwapInETH: 6,
        slippage: 1, // 0.01%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("STETH", "WETH"),
        amountToSwapInETH: 6,
        slippage: 50, // 0.5%
    });

    behavesLikeSwapRouter({
        maxHop: 3,
        tokens: ctx.getTokens("STETH", "ETH"),
        amountToSwapInETH: 6,
        slippage: 50, // 0.5%
    });
});

function behavesLikeSwapRouter(params: {
    maxHop?: number;
    tokens: TokenModel[];
    amountToSwapInETH?: BigNumberish;
    slippage?: BigNumberish;
}) {
    let title: string = `[${params.tokens
        .map((token) => token.symbol)
        .join(" <-> ")}]`;
    let ethAmount = params.amountToSwapInETH || 2;
    let slippage = BigNumber.from(params.slippage || 10); // 0.1%
    let maxHop = params.maxHop || 3;

    context(title, () => {
        it(`should successfully query the expected amount out and perform swap for (A -> B)`, async () => {
            const { traders, router } = await loadFixture(completeFixture);
            const trader = traders[0];

            const [tokenIn, tokenOut] = params.tokens;

            const amountToSwap = await seedTokens(tokenIn, ethAmount, [
                trader.address,
            ]);
            expect(amountToSwap).to.be.gt(0);

            const { adapters, path, amountQueried } = await query({
                router,
                maxHop,
                tokenIn,
                tokenOut,
                amountIn: amountToSwap,
            });
            expect(amountQueried).to.be.gt(0);

            const amountOutMin = setAmountOutMin(amountQueried, slippage);

            await swap({
                result: "success",
                trader,
                router,
                adapters,
                path,
                amountIn: amountToSwap,
                amountOutMin,
                deadline: await setDeadline(),
            });
        });

        it(`should successfully query the expected amount out and perform swap for (B -> A)`, async () => {
            const { traders, router } = await loadFixture(completeFixture);
            const trader = traders[1];

            const [tokenOut, tokenIn] = params.tokens;

            const amountToSwap = await seedTokens(tokenIn, ethAmount, [
                trader.address,
            ]);
            expect(amountToSwap).to.be.gt(0);

            const { adapters, path, amountQueried } = await query({
                router,
                maxHop,
                tokenIn,
                tokenOut,
                amountIn: amountToSwap,
            });
            expect(amountQueried).to.be.gt(0);

            const amountOutMin = setAmountOutMin(amountQueried, slippage);

            await swap({
                result: "success",
                trader,
                router,
                adapters,
                path,
                amountIn: amountToSwap,
                amountOutMin,
                deadline: await setDeadline(),
            });
        });
    });
}

const setDeadline = async (seconds: number = 60): Promise<BigNumber> => {
    const block = await ethers.provider.getBlock("latest");

    if (!block) {
        throw new Error("Failed to fetch block number");
    }

    const deadline = block.timestamp + seconds;

    return BigNumber.from(deadline);
};

const setAmountOutMin = (
    amountExpected: BigNumber,
    slippage: BigNumber
): BigNumber => {
    const percentageFactor = BigNumber.from(1e4);
    const halfPercent = percentageFactor.div(2);

    const delta = amountExpected
        .mul(slippage)
        .add(halfPercent)
        .div(percentageFactor);

    const amountOutMin = amountExpected.sub(delta);

    return amountOutMin;
};
