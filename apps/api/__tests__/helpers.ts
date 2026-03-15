import { type Database, seed } from "@argus/db";
import { createTestDb } from "@argus/db/test-utils";
import { createApp } from "../src/app.js";

export async function createTestApp() {
    const { db, client } = await createTestDb();
    await seed(db as unknown as Database);
    const app = createApp(db as unknown as Database);
    return { app, db: db as unknown as Database, client };
}
