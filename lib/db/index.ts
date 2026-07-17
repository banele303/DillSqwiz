// Neon HTTP connection — uses the unpooled URL for direct HTTP (no WebSockets)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Use unpooled URL — direct HTTP connection, no WebSocket overhead
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set");
}

const sql = neon(dbUrl);

export const db = drizzle({ client: sql, schema, casing: "snake_case" });

export { schema };
