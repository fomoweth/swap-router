import { TOKENS, BRIDGE_TOKENS } from "./constants/tokens";
import { TokenModel } from "./constants/types";
import tracer from "./tracer";

interface Config {
    title: string;
    tracer?: boolean;
    delay?: number;
}

interface Context {
    tokens: TokenModel[];
    bridgeTokens: TokenModel[];
    getTokens: (...symbols: string[]) => TokenModel[];
    sleep: (ms: number) => Promise<void>;
}

const ctx: Context = {
    tokens: TOKENS,
    bridgeTokens: BRIDGE_TOKENS,
    getTokens: (...symbols) => {
        return symbols.reduce<TokenModel[]>((acc, target) => {
            const token = TOKENS.find(
                (token) => token.symbol.toLowerCase() === target.toLowerCase()
            );

            if (!token) {
                throw new Error("token not found");
            }

            acc.push(token);

            return acc;
        }, []);
    },
    sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function makeSuite(
    config: Config,
    tests: (ctx: Context) => void
): void {
    if (!!config.tracer) {
        tracer.enable();
    }

    describe(config.title, () => {
        after(async () => {
            await sleep(config.delay || 2000);
        });

        tests(ctx);
    });
}
