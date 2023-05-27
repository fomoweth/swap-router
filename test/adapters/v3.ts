import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import chalk from "chalk";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, utils } from "ethers";

import { FACTORY_ADDRESSES, WETH_ADDRESS } from "../shared/constants/addresses";
import { TokenModel } from "../shared/constants/types";
import { deployV3Adapter, getSigners } from "../shared/fixtures";
import makeSuite from "../shared/makeSuite";
import { sortTokens } from "../shared/utils/addresses";
import { seedTokens } from "../shared/utils/funds";

import { queryThenSwap } from "./actions";

import { IUniswapV3Pool__factory, V3Swap } from "../../typechain-types";

makeSuite({ title: chalk.cyanBright("V3 Swap") }, (ctx) => {
    it("#deployment", async () => {
        const { deployer, adapter } = await loadFixture(fixtures);

        expect(await adapter.owner()).to.be.eq(deployer.address);
        expect(await adapter.factory()).to.be.eq(FACTORY_ADDRESSES.UNI_V3);
        expect(await adapter.WETH()).to.be.eq(WETH_ADDRESS);
        expect(await adapter.getFeeAmounts()).to.be.members([
            100, 500, 3000, 10000,
        ]);
        expect(utils.parseBytes32String(await adapter.id())).to.be.eq("UNI-V3");
    });

    behavesLikeAdapter({
        type: "UNI-V3",
        tokens: ctx.getTokens("USDC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V3",
        tokens: ctx.getTokens("WETH", "USDT"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V3",
        tokens: ctx.getTokens("WBTC", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V3",
        tokens: ctx.getTokens("LINK", "WETH"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        type: "UNI-V3",
        tokens: ctx.getTokens("UNI", "WETH"),
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
            const { traders, adapter } = await loadFixture(fixtures);
            const trader = traders[0];

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
            const { traders, adapter } = await loadFixture(fixtures);
            const trader = traders[1];

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
    const adapter = await deployV3Adapter(deployer);

    return {
        deployer,
        traders,
        adapter,
    };
};

const getQuote = async (
    adapter: V3Swap,
    tokenIn: string,
    tokenOut: string,
    amountIn: BigNumber
): Promise<BigNumber> => {
    const quoterV2Address = "0x0209c4Dc18B2A1439fD2427E34E7cF3c6B91cFB9";
    const quoter = await ethers.getContractAt("IQuoterV2", quoterV2Address);

    const poolAddress = await adapter.getPool(tokenIn, tokenOut);
    const pool = IUniswapV3Pool__factory.connect(poolAddress, ethers.provider);

    const { amountOut } = await quoter.callStatic.quoteExactInputSingle({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: await pool.fee(),
        amountIn,
        sqrtPriceLimitX96: 0,
    });

    return amountOut;
};

const encodePath = (path: string[], fees: number[]): string => {
    const FEE_SIZE = 3;

    if (path.length !== fees.length + 1) {
        throw new Error("Invalid lengths of params");
    }

    let encoded = "0x";
    for (let i = 0; i < fees.length; i++) {
        encoded += path[i].slice(2);
        encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, "0");
    }

    encoded += path[path.length - 1].slice(2);

    return encoded.toLowerCase();
};
