// middleware/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
// Configuration de Multer pour les photos de profil
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Utiliser un chemin ABSOLU
        const uploadDir = path.resolve(process.cwd(), "uploads", "profiles");
        console.log("📁 Destination profile:", uploadDir);
        // Créer le dossier récursivement s'il n'existe pas
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("✅ Dossier profiles créé:", uploadDir);
            }
            cb(null, uploadDir);
        }
        catch (error) {
            console.error("❌ Erreur création dossier profiles:", error);
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = "profile-" + uniqueSuffix + path.extname(file.originalname);
        console.log("📸 Fichier profile généré:", filename);
        cb(null, filename);
    },
});
// Configuration pour les fichiers d'importation
const importStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Utiliser un chemin ABSOLU
        const uploadDir = path.resolve(process.cwd(), "uploads", "imports");
        console.log("📁 Destination import:", uploadDir);
        // Créer le dossier récursivement s'il n'existe pas
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("✅ Dossier imports créé:", uploadDir);
            }
            cb(null, uploadDir);
        }
        catch (error) {
            console.error("❌ Erreur création dossier imports:", error);
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Corriger le problème de double extension
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = baseName + "-" + uniqueSuffix + extension;
        console.log("📄 Fichier import généré:", filename);
        cb(null, filename);
    },
});
// Filtres de fichiers
const fileFilter = (req, file, cb) => {
    console.log("🔍 Fichier reçu:", file.originalname, "Type:", file.mimetype);
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/json",
        "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) {
        console.log("✅ Type accepté");
        cb(null, true);
    }
    else {
        console.log("❌ Type refusé:", file.mimetype);
        cb(new Error("Type de fichier non supporté: " + file.mimetype));
    }
};
export const uploadProfile = multer({
    storage: profileStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});
export const uploadImport = multer({
    storage: importStorage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});
// Middleware de debug pour voir les fichiers uploadés
export const logUpload = (req, res, next) => {
    console.log("=== UPLOAD DEBUG ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Files:", req.files);
    console.log("====================");
    next();
};
//# sourceMappingURL=upload.js.map