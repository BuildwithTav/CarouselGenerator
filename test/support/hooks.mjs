// Resolves the Next.js "@/..." alias and extensionless relative imports so
// the src/lib modules can be imported directly by node:test.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) spec = pathToFileURL(SRC + spec.slice(2)).href;
  if ((spec.startsWith("file:") || spec.startsWith(".")) && !/\.(m?js|json)$/.test(spec)) {
    const base = spec.startsWith("file:") ? spec : new URL(spec, ctx.parentURL).href;
    if (existsSync(fileURLToPath(base + ".js"))) return next(base + ".js", ctx);
  }
  return next(spec, ctx);
}
