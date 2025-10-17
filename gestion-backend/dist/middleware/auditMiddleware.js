"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
const auditService_1 = require("../services/auditService");
const auditMiddleware = (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    // Capturer le corps de la requête (pour les créations/modifications)
    let requestBody = null;
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        requestBody = { ...req.body };
    }
    res.send = function (body) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Journaliser seulement les actions importantes
        if (shouldLogRequest(req, statusCode)) {
            const user = req.user;
            auditService_1.AuditService.log({
                action: getActionFromMethod(req.method),
                entity: getEntityFromUrl(req.url),
                entityId: getEntityIdFromUrl(req.url),
                description: `${req.method} ${req.url} - ${statusCode} (${duration}ms)`,
                userId: user?.id,
                userAgent: req.get("User-Agent"),
                ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
                status: statusCode >= 400 ? "ERROR" : "SUCCESS",
                duration,
                newData: statusCode < 400 ? requestBody : undefined,
                oldData: statusCode >= 400
                    ? {
                        requestBody,
                        error: typeof body === "string" ? body : body?.message,
                    }
                    : undefined,
            }).catch(console.error);
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.auditMiddleware = auditMiddleware;
// Configuration des exclusions
const EXCLUDED_PATHS = [
    "/health",
    "/favicon.ico",
    "/audit-logs",
    "/backup",
    "/export",
    "/static",
    "/uploads",
];
const EXCLUDED_METHODS = ["OPTIONS"];
function shouldLogRequest(req, statusCode) {
    // Ne pas logger les requêtes exclues
    if (EXCLUDED_METHODS.includes(req.method))
        return false;
    // Ne pas logger les paths exclus
    if (EXCLUDED_PATHS.some((path) => req.url.startsWith(path)))
        return false;
    // Logger seulement les erreurs importantes et les actions de modification
    return (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || statusCode >= 400);
}
function getActionFromMethod(method) {
    const actions = {
        POST: "CREATE",
        PUT: "UPDATE",
        PATCH: "UPDATE",
        DELETE: "DELETE",
        GET: "VIEW",
    };
    return actions[method] || method;
}
function getEntityFromUrl(url) {
    // Extraire l'entité de l'URL
    const segments = url.split("/").filter((segment) => segment);
    if (segments.length > 0 && segments[0] === "api") {
        return segments[1] || "System";
    }
    return segments[0] || "System";
}
function getEntityIdFromUrl(url) {
    const segments = url.split("/").filter((segment) => segment);
    if (segments.length > 0 && segments[0] === "api") {
        return segments[2] || undefined;
    }
    return segments[1] || undefined;
}
