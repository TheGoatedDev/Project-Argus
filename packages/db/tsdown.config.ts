import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        schema: "src/schema.ts",
        client: "src/client.ts",
        zod: "src/zod.ts",
    },
    format: "esm",
    dts: true,
});
