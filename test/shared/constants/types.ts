export type Mapping<T> = Record<string, T>;

export type Strict<Type> = {
    [Property in keyof Type]-?: Type[Property];
};

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
type RequiredKeys<T> = Exclude<
    KeysOfType<T, Exclude<T[keyof T], undefined>>,
    undefined
>;
export type ExcludeOptional<T> = Pick<T, RequiredKeys<T>>;

export interface TokenModel {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    slot: number;
}

export interface CurveConfig {
    ADDRESS_PROVIDER: string;
    REGISTRY: string;
    EXCHANGE: string;
    META_POOL_FACTORY: string;
    CRYPTO_SWAP_REGISTRY: string;
    CRYPTO_SWAP_FACTORY: string;
}
