import type { AppType } from "@argus/api/app-type";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const client = hc<AppType>(apiUrl);
