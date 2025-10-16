import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

// export default defineConfig({
//   plugins: [react()],
//   base: "/academie-reprise-generator-gestion-frontend/", // IMPORTANT pour GitHub Pages
//   resolve: {
//     alias: {
//       "@": fileURLToPath(new URL("./src", import.meta.url)),
//     },
//   },
//   build: {
//     outDir: "dist",
//     sourcemap: false,
//     rollupOptions: {
//       external: [], // Laissez vide ou ajoutez les modules externes si nécessaire
//     },
//   },
// });
