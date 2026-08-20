import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build use relative asset paths, so it works whether
// this is served at username.github.io/ or username.github.io/repo-name/
// with no changes needed.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
