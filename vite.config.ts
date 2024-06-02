import { defineConfig } from "vite";

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: Array.from(
        new Bun.Glob(
          "./src/resources/{js,css}/**/*.{js,ts,jsx,tsx,css,scss,sass,less}"
        ).scanSync()
      ),
    },
    outDir: "./public/build",
  },
});
