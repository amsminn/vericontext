import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
  },
  format: ["esm"],
  sourcemap: true,
  clean: true,
  target: "node20",
  dts: false,
});
