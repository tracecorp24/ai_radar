import { existsSync, lstatSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const target = path.resolve(root, ".next-prod");
if (path.dirname(target) !== root || path.basename(target) !== ".next-prod") throw new Error(`Unsafe production build path: ${target}`);
if (existsSync(target)) {
  if (lstatSync(target).isSymbolicLink()) throw new Error(`Refusing to clean linked build path: ${target}`);
  rmSync(target, { recursive: true, force: false, maxRetries: 5, retryDelay: 100 });
}
console.log("production-build-clean");
