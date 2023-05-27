import { BigNumber, BigNumberish, utils } from "ethers";

export const formatUnits = (value: BigNumberish, unit?: number): string => {
    return utils.formatUnits(value, unit);
};

export const parseUnits = (value: BigNumberish, unit?: number): BigNumber => {
    return utils.parseUnits(value.toString(), unit);
};
