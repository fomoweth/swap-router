import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import chalk from "chalk";
import { BigNumber, BigNumberish, utils } from "ethers";

import { CURVE_CONTRACTS, WETH_ADDRESS } from "../shared/constants/addresses";
import { TokenModel } from "../shared/constants/types";
import { deployCurveAdapter, getSigners } from "../shared/fixtures";
import makeSuite from "../shared/makeSuite";
import { getContract } from "../shared/utils/contracts";
import { seedTokens } from "../shared/utils/funds";

import { queryThenSwap } from "./actions";

import { CurveSwap, ICryptoPool, ICurvePool } from "../../typechain-types";

makeSuite({ title: chalk.cyanBright("Curve Swap") }, (ctx) => {
    it("#deployment", async () => {
        const { deployer, adapter } = await loadFixture(fixtures);

        expect(await adapter.owner()).to.be.eq(deployer.address);
        expect(await adapter.stableRegistry()).to.be.eq(
            CURVE_CONTRACTS.REGISTRY
        );
        expect(await adapter.factoryRegistry()).to.be.eq(
            CURVE_CONTRACTS.META_POOL_FACTORY
        );
        expect(await adapter.cryptoRegistry()).to.be.eq(
            CURVE_CONTRACTS.CRYPTO_SWAP_REGISTRY
        );
        expect(await adapter.WETH()).to.be.eq(WETH_ADDRESS);
        expect(utils.parseBytes32String(await adapter.id())).to.be.eq("CURVE");
    });

    behavesLikeAdapter({
        name: "MIM-3POOL",
        type: "MetaPool",
        tokens: ctx.getTokens("MIM", "DAI"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "MIM-3POOL",
        type: "MetaPool",
        tokens: ctx.getTokens("MIM", "USDC"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "MIM-3POOL",
        type: "MetaPool",
        tokens: ctx.getTokens("MIM", "USDT"),
        amountToSwapInETH: 1,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "TriCrypto2",
        type: "CryptoPool",
        tokens: ctx.getTokens("WETH", "WBTC"),
        amountToSwapInETH: 4,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "TriCrypto2",
        type: "CryptoPool",
        tokens: ctx.getTokens("WBTC", "USDT"),
        amountToSwapInETH: 4,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "TriCrypto2",
        type: "CryptoPool",
        tokens: ctx.getTokens("USDT", "WETH"),
        amountToSwapInETH: 4,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "3POOL",
        type: "StablePool",
        tokens: ctx.getTokens("USDC", "USDT"),
        amountToSwapInETH: 3,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "3POOL",
        type: "StablePool",
        tokens: ctx.getTokens("USDT", "DAI"),
        amountToSwapInETH: 3,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "3POOL",
        type: "StablePool",
        tokens: ctx.getTokens("DAI", "USDC"),
        amountToSwapInETH: 3,
        slippage: 1, // 0.01%
    });

    behavesLikeAdapter({
        name: "ETH-stETH",
        type: "StablePool",
        tokens: ctx.getTokens("ETH", "STETH"),
        amountToSwapInETH: 8,
        slippage: 50, // 0.5%
    });
});

function behavesLikeAdapter(params: {
    name: string;
    type: string;
    tokens: TokenModel[];
    amountToSwapInETH?: BigNumberish;
    slippage?: BigNumberish;
}) {
    let title: string = `[${params.type}]: ${params.tokens
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
    const adapter = await deployCurveAdapter(deployer);

    return {
        deployer,
        traders,
        adapter,
    };
};

const getQuote = async (
    adapter: CurveSwap,
    tokenIn: string,
    tokenOut: string,
    amountIn: BigNumber
): Promise<BigNumber> => {
    const {
        isCryptoPool,
        pool: poolAddress,
        i,
        j,
        isUnderlying,
    } = await adapter.getPoolConfig(tokenIn, tokenOut);

    const pool = await getContract<ICurvePool | ICryptoPool>(
        !isCryptoPool ? "ICurvePool" : "ICryptoPool",
        poolAddress
    );

    const amountOut = !isUnderlying
        ? await pool.get_dy(i, j, amountIn)
        : await pool.get_dy_underlying(i, j, amountIn);

    return amountOut;
};
