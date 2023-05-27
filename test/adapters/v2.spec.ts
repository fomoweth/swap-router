import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import chalk from "chalk";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, utils } from "ethers";

import { FACTORY_ADDRESSES, WETH_ADDRESS } from "../shared/constants/addresses";
import { TokenModel } from "../shared/constants/types";
import { deployV2Adapters, getSigners } from "../shared/fixtures";
import { makeSuite } from "../shared/makeSuite";
import { sortTokens } from "../shared/utils/addresses";
import { seedTokens } from "../shared/utils/funds";

import { queryThenSwap } from "./actions";

import { IUniswapV2Pair__factory, V2Swap } from "../../typechain-types";

makeSuite({ title: chalk.cyanBright("V2-Swap\n") }, (ctx) => {
    it("#deployment", async () => {
        const { deployer, v2, sushi } = await loadFixture(fixtures);

        expect(await v2.owner()).to.be.eq(deployer.address);
        expect(await v2.factory()).to.be.eq(FACTORY_ADDRESSES.UNI_V2);
        expect(await v2.WETH()).to.be.eq(WETH_ADDRESS);
        expect(utils.parseBytes32String(await v2.id())).to.be.eq("UNI-V2");

        expect(await sushi.owner()).to.be.eq(deployer.address);
        expect(await sushi.factory()).to.be.eq(FACTORY_ADDRESSES.SUSHI);
        expect(await sushi.WETH()).to.be.eq(WETH_ADDRESS);
        expect(utils.parseBytes32String(await sushi.id())).to.be.eq("SUSHI");
    });

    behavesLikeAdapter({
        type: "UNI-V2",
        tokens: ctx.getTokens("USDC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V2",
        tokens: ctx.getTokens("WBTC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V2",
        tokens: ctx.getTokens("WETH", "USDT"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "SUSHI",
        tokens: ctx.getTokens("USDC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "SUSHI",
        tokens: ctx.getTokens("WBTC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "SUSHI",
        tokens: ctx.getTokens("SUSHI", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });
});

function behavesLikeAdapter(params: {
    type: string;
    tokens: TokenModel[];
    amountToSwapInETH?: BigNumberish;
    slippage?: BigNumberish;
}) {
    let title: string = `[${params.type}]: ${sortTokens(...params.tokens)
        .map((token) => token.symbol)
        .join(" <-> ")}`;
    let ethAmount = params.amountToSwapInETH || 2;
    let slippage = params.slippage || BigNumber.from("10"); // 0.1%

    context(title, () => {
        it("should query the expected amount out and perform swap (0 -> 1)", async () => {
            const { traders, v2, sushi } = await loadFixture(fixtures);
            const trader = traders[0];
            const adapter = params.type === "UNI-V2" ? v2 : sushi;

            const [tokenIn, tokenOut] = params.tokens;

            const amountToSwap = await seedTokens(tokenIn, ethAmount, [
                trader.address,
            ]);

            expect(amountToSwap).to.be.gt(0);

            const amountExpected = await getQuote(
                adapter,
                tokenIn.address,
                tokenOut.address,
                amountToSwap
            );

            expect(amountExpected).to.be.gt(0);

            await queryThenSwap(
                trader,
                adapter,
                tokenIn,
                tokenOut,
                amountToSwap,
                amountExpected,
                slippage,
                "success"
            );
        });

        it("should query the expected amount out and perform swap (1 -> 0)", async () => {
            const { traders, v2, sushi } = await loadFixture(fixtures);
            const trader = traders[1];
            const adapter = params.type === "UNI-V2" ? v2 : sushi;

            const [tokenOut, tokenIn] = params.tokens;

            const amountToSwap = await seedTokens(tokenIn, ethAmount, [
                trader.address,
            ]);

            expect(amountToSwap).to.be.gt(0);

            const amountExpected = await getQuote(
                adapter,
                tokenIn.address,
                tokenOut.address,
                amountToSwap
            );

            expect(amountExpected).to.be.gt(0);

            await queryThenSwap(
                trader,
                adapter,
                tokenIn,
                tokenOut,
                amountToSwap,
                amountExpected,
                slippage,
                "success"
            );
        });
    });
}

const fixtures = async () => {
    const { deployer, traders } = await getSigners();
    const { v2, sushi } = await deployV2Adapters(deployer);

    return {
        deployer,
        traders,
        v2,
        sushi,
    };
};

const getQuote = async (
    adapter: V2Swap,
    tokenIn: string,
    tokenOut: string,
    amountIn: BigNumber
): Promise<BigNumber> => {
    const pairAddress = await adapter.getPool(tokenIn, tokenOut);
    const pair = IUniswapV2Pair__factory.connect(pairAddress, ethers.provider);

    const { reserve0, reserve1 } = await pair.getReserves();

    const [reserveIn, reserveOut] =
        tokenIn.toLowerCase() < tokenOut.toLowerCase()
            ? [reserve0, reserve1]
            : [reserve1, reserve0];

    const amountInWithFee = amountIn.mul(997);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(1000).add(amountInWithFee);

    const amountOut = numerator.div(denominator);

    return amountOut;
};
