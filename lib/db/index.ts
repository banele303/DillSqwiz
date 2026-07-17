// Neon HTTP connection — uses Neon REST API (HTTPS, no WebSocket)
// Works on Vercel, any network, any firewall
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Neon HTTP API URL format: https://ep-...us-east-1.aws.neon.tech/sql
// Differs from the pooled URL — uses /sql endpoint over plain HTTPS
const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error("DATABASE_URL is not set")

const sql = neon(dbUrl)

export const db = drizzle({ client: sql, schema, casing: "snake_case" })
export { schema }
