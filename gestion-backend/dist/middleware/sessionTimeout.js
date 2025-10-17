"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredSessions = exports.checkSessionTimeout = exports.trackUserActivity = void 0;
// Stockage des sessions actives
const activeSessions = new Map();
const trackUserActivity = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && req.user) {
        activeSessions.set(token, {
            lastActivity: Date.now(),
            userId: req.user.id,
        });
    }
    next();
};
exports.trackUserActivity = trackUserActivity;
const checkSessionTimeout = (timeoutMinutes = 30) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token || !req.user) {
            return next();
        }
        const session = activeSessions.get(token);
        const now = Date.now();
        const timeoutMs = timeoutMinutes * 60 * 1000;
        if (session && now - session.lastActivity > timeoutMs) {
            // Supprimer la session expirée
            activeSessions.delete(token);
            return res.status(401).json({
                message: "Session expirée due à l'inactivité",
                code: "SESSION_TIMEOUT",
                timestamp: new Date().toISOString(),
            });
        }
        // Mettre à jour le timestamp d'activité
        if (session) {
            session.lastActivity = now;
        }
        next();
    };
};
exports.checkSessionTimeout = checkSessionTimeout;
// Nettoyer les sessions expirées périodiquement
const cleanupExpiredSessions = () => {
    setInterval(() => {
        const now = Date.now();
        const timeoutMs = 30 * 60 * 1000; // 30 minutes
        for (const [token, session] of activeSessions.entries()) {
            if (now - session.lastActivity > timeoutMs) {
                activeSessions.delete(token);
            }
        }
    }, 60 * 1000); // Toutes les minutes
};
exports.cleanupExpiredSessions = cleanupExpiredSessions;
