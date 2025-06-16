import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [
    tsconfigPaths(),
    mode !== "test" && reactRouter()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ["./setupTests.ts"],
    coverage: {
      provider: 'v8',
      exclude: [
        "react-router.config.ts",
        "vite.config.mts",
        "postcss.config.cjs",
        ".react-router/types",
        "build/",
        "app/data.ts",
        "app/root.tsx",
        "app/routes.ts",
        "app/**/index.ts"
      ]
    }
  }
}));
