import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // <-- your repo name, with leading and trailing slash
  plugins: [react()],
});
