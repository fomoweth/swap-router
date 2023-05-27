import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils } from "ethers";
import { ethers } from "hardhat";

import {
    CURVE_CONTRACTS,
    FACTORY_ADDRESSES,
    WETH_ADDRESS,
} from "./constants/addresses";
import { BRIDGE_TOKENS } from "./constants/tokens";
import { deployContract } from "./utils/contracts";
import { setNameTag } from "./tracer";

import { CurveSwap, SwapRouter, V2Swap, V3Swap } from "../../typechain-types";

export const getSigners = async (tradersCount?: number) => {
    const [deployer, ...signers] = await ethers.getSigners();
    const traders = !!tradersCount ? signers.slice(0, tradersCount) : signers;

    setNameTag("Deployer", deployer.address);
    traders.map((trader, idx) => setNameTag(`Trader#${idx}`, trader.address));

    return { deployer, traders };
};

export const deployV3Adapter = async (deployer: SignerWithAddress) => {
    const adapter = await deployContract<V3Swap>("V3Swap", deployer, [
        utils.formatBytes32String("UNI-V3"),
        WETH_ADDRESS,
        FACTORY_ADDRESSES.UNI_V3,
    ]);

    return adapter;
};

export const deployV2Adapters = async (deployer: SignerWithAddress) => {
    const v2 = await deployContract<V2Swap>(
        "V2Swap",
        deployer,
        [
            utils.formatBytes32String("UNI-V2"),
            WETH_ADDRESS,
            FACTORY_ADDRESSES.UNI_V2,
        ],
        "UNI-V2"
    );

    const sushi = await deployContract<V2Swap>(
        "V2Swap",
        deployer,
        [
            utils.formatBytes32String("SUSHI"),
            WETH_ADDRESS,
            FACTORY_ADDRESSES.SUSHI,
        ],
        "SUSHI"
    );

    return { v2, sushi };
};

export const deployCurveAdapter = async (
    deployer: SignerWithAddress
): Promise<CurveSwap> => {
    const adapter = await deployContract<CurveSwap>("CurveSwap", deployer, [
        utils.formatBytes32String("CURVE"),
        WETH_ADDRESS,
        CURVE_CONTRACTS.ADDRESS_PROVIDER,
    ]);

    return adapter;
};

const deployAdapters = async (deployer: SignerWithAddress) => {
    const v3 = await deployV3Adapter(deployer);

    const { v2, sushi } = await deployV2Adapters(deployer);

    const curve = await deployCurveAdapter(deployer);

    return { v3, v2, sushi, curve };
};

export const completeFixture = async (): Promise<CompleteFixture> => {
    const { deployer, traders } = await getSigners();

    const router = await deployContract<SwapRouter>("SwapRouter", deployer, [
        WETH_ADDRESS,
    ]);

    const adapters = await deployAdapters(deployer);

    const adapterAddresses = Object.values(adapters).map(
        (adapter) => adapter.address
    );

    const bridgeTokenAddresses = BRIDGE_TOKENS.map((token) => token.address);

    await Promise.all([
        router.setAdapters(adapterAddresses),
        router.setBridgeTokens(bridgeTokenAddresses),
    ]);

    return {
        deployer,
        traders,
        router,
        adapters,
    };
};

interface CompleteFixture {
    deployer: SignerWithAddress;
    traders: SignerWithAddress[];
    router: SwapRouter;
    adapters: {
        v3: V3Swap;
        v2: V2Swap;
        sushi: V2Swap;
        curve: CurveSwap;
    };
}
