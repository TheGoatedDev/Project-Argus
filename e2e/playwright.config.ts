import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
    },
    webServer: [
        {
            command: "pnpm --filter @argus/api dev",
            url: "http://localhost:3001/api/health",
            reuseExistingServer: !process.env.CI,
            cwd: "..",
        },
        {
            command: "pnpm --filter @argus/web dev",
            url: "http://localhost:3000",
            reuseExistingServer: !process.env.CI,
            cwd: "..",
        },
    ],
    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" },
        },
    ],
});
