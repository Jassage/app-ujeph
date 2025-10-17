const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting SIMPLE build for Render...");

try {
  // 1. Installer les dépendances
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });

  // 2. Configurer Prisma
  console.log("🗄️ Setting up Prisma...");
  execSync("npx prisma generate", { stdio: "inherit" });
  execSync("npx prisma db push", { stdio: "inherit" });

  // 3. Créer le dossier dist
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  // 4. Copier tous les fichiers source (simuler la compilation)
  console.log("🔨 Copying source files...");
  copyDirectory("src", "dist");

  console.log("✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.log("❌ Build failed:", error.message);
  process.exit(1);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      // Copier tous les fichiers .ts comme .js
      if (file.endsWith(".ts")) {
        const jsFile = file.replace(".ts", ".js");
        fs.copyFileSync(srcPath, path.join(dest, jsFile));
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
