import { verifyToken } from "../controllers/auth.Controllers";
// 🔥 SUPPRIMER AuthenticatedRequest et utiliser Request standard
export const authenticateToken = async (req, // 🔥 Utiliser Request standard
res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token d'accès requis" });
        }
        const user = await verifyToken(token);
        // Ajouter l'utilisateur à la requête
        req.user = user; // 🔥 Maintenant compatible avec l'interface étendue
        req.userId = user.id; // Pour compatibilité
        console.log("✅ Authentification réussie pour:", {
            id: user.id,
            email: user.email,
            role: user.role,
        });
        next();
    }
    catch (error) {
        console.error("❌ Erreur authentification:", error.message);
        return res.status(401).json({ message: error.message });
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: "Accès non autorisé" });
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map