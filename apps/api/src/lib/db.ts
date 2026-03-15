import { createClient } from "@argus/db";

const connectionString =
    process.env.DATABASE_URL ?? "postgresql://localhost:5432/argus";

export const db = createClient(connectionString);
