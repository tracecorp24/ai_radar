import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const tracedDataDir = path.resolve(process.cwd(), ".next-prod", "standalone", ".data");

if (existsSync(tracedDataDir)) {
  rmSync(tracedDataDir, { recursive: true, force: true });
  process.stdout.write("portable-standalone-data-pruned\n");
}
