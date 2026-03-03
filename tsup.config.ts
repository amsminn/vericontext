import { defineConfig } from "tsup";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
  },
  format: ["esm"],
  sourcemap: true,
  clean: true,
  target: "node20",
  dts: false,
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
});
