import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 8080,
//   },
//   plugins: [react(), mode === "development" && componentTagger()].filter(
//     Boolean
//   ),

//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));

export default defineConfig({
  plugins: [react()],
  base: "/gestion-frontend/", // ou '/' si c'est le repo principal
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
