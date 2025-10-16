import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { createAuditLog } from "./auditController";
// const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre_secret_jwt";
var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "Admin";
    UserRole["Professeur"] = "Professeur";
    UserRole["Secretaire"] = "Secretaire";
    UserRole["Directeur"] = "Directeur";
    UserRole["Doyen"] = "Doyen";
})(UserRole || (UserRole = {}));
const validRoles = [
    "Admin",
    "Professeur",
    "Secretaire",
    "Directeur",
    "Doyen",
];
const validateUserRole = (role) => {
    console.log("🔍 Rôle reçu pour validation:", role);
    if (!role) {
        throw new Error("Le rôle est requis");
    }
    if (validRoles.includes(role)) {
        return role;
    }
    throw new Error(`Rôle invalide: "${role}". Valeurs acceptées: ${validRoles.join(", ")}`);
};
export const registerUser = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone } = req.body;
        console.log("📨 Données reçues:", { email, role, firstName, lastName });
        // Validation des données requises
        if (!email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({
                message: "Tous les champs obligatoires doivent être remplis",
                required: ["email", "password", "role", "firstName", "lastName"],
                received: {
                    email: !!email,
                    password: !!password,
                    role: !!role,
                    firstName: !!firstName,
                    lastName: !!lastName,
                },
            });
        }
        // Valider que le rôle est acceptable
        const validatedRole = validateUserRole(role);
        console.log("✅ Rôle validé:", validatedRole);
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({
                message: "Un utilisateur avec cet email existe déjà",
            });
        }
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);
        // Créer l'utilisateur avec tous les champs requis
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone || null,
                role: validatedRole,
                password: hashedPassword,
                status: "Actif",
                createdAt: new Date(), // Ajout explicite
                updatedAt: new Date(), // Ajout explicite
                // Ajoutez d'autres champs requis par votre schéma si nécessaire
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true, // Inclure updatedAt dans la sélection
            },
        });
        console.log("✅ Utilisateur créé:", user.id);
        res.status(201).json({
            message: "Utilisateur créé avec succès",
            user,
        });
    }
    catch (error) {
        console.error("❌ Registration error:", error);
        console.error("❌ Stack:", error.stack);
        // Log plus détaillé pour comprendre l'erreur Prisma
        if (error.code) {
            console.error("❌ Prisma error code:", error.code);
        }
        if (error.meta) {
            console.error("❌ Prisma error meta:", error.meta);
        }
        res.status(400).json({
            message: error.message,
            error: process.env.NODE_ENV === "development"
                ? {
                    stack: error.stack,
                    receivedRole: req.body?.role,
                    prismaError: error.code || error.meta,
                }
                : undefined,
        });
    }
};
export const loginUser = async (email, password) => {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new Error("Email ou mot de passe incorrect");
    }
    // Vérifier le statut
    if (user.status !== "Actif") {
        throw new Error("Votre compte est désactivé");
    }
    // Vérifier le mot de passe
    if (!user.password) {
        throw new Error("Email ou mot de passe incorrect");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Email ou mot de passe incorrect");
    }
    // Générer le token JWT
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
    }, JWT_SECRET, { expiresIn: "24h" });
    // Mettre à jour la dernière connexion
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
    });
    return {
        token,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
        },
    };
};
// export const getUsers = async (req: Request, res: Response) => {
//   try {
//     const { role, status, search } = req.query;
//     const where: any = {};
//     if (role && role !== "all") {
//       where.role = role;
//     }
//     if (status && status !== "all") {
//       where.status = status;
//     }
//     if (search) {
//       where.OR = [
//         { firstName: { contains: search as string, mode: "insensitive" } },
//         { lastName: { contains: search as string, mode: "insensitive" } },
//         { email: { contains: search as string, mode: "insensitive" } },
//       ];
//     }
//     const users = await prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         role: true,
//         status: true,
//         lastLogin: true,
//         createdAt: true,
//         avatar: true,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });
//     res.json(users);
//   } catch (error) {
//     console.error("Erreur récupération utilisateurs:", error);
//     res.status(500).json({
//       message: "Erreur interne du serveur",
//     });
//   }
// };
export const getUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const user = req.user;
        const facultyId = req.facultyId;
        const where = {};
        // Si c'est un doyen, limiter aux utilisateurs de sa faculté
        if (user?.role === "Doyen" && facultyId) {
            where.OR = [
                {
                    student: {
                        enrollments: {
                            some: {
                                facultyId: facultyId,
                                status: "Active",
                            },
                        },
                    },
                },
                {
                    professeur: {
                        assignments: {
                            some: {
                                facultyId: facultyId,
                            },
                        },
                    },
                },
                // Le doyen lui-même
                { id: user.id },
            ];
        }
        else {
            // Pour les autres rôles, appliquer les filtres normaux
            if (role && role !== "all") {
                where.role = role;
            }
            if (status && status !== "all") {
                where.status = status;
            }
            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ];
            }
        }
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                avatar: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(users);
    }
    catch (error) {
        console.error("Erreur récupération utilisateurs:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                avatar: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé",
            });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Erreur récupération utilisateur:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, role, status } = req.body;
        // Vérifier si l'utilisateur existe
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({
                message: "Utilisateur non trouvé",
            });
        }
        // Vérifier les conflits d'email
        if (email && email !== existingUser.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });
            if (existingEmail) {
                return res.status(400).json({
                    message: "Un utilisateur avec cet email existe déjà",
                });
            }
        }
        // Mettre à jour l'utilisateur
        const user = await prisma.user.update({
            where: { id },
            data: {
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined,
                email: email ?? undefined,
                phone: phone ?? undefined,
                role: role ?? undefined,
                status: status ?? undefined,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                avatar: true,
            },
        });
        res.json({
            message: "Utilisateur modifié avec succès",
            user,
        });
    }
    catch (error) {
        console.error("Erreur modification utilisateur:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé",
            });
        }
        // Empêcher la suppression de son propre compte
        if (req.user?.id === id) {
            return res.status(400).json({
                message: "Vous ne pouvez pas supprimer votre propre compte",
            });
        }
        // Supprimer l'utilisateur
        await prisma.user.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Erreur suppression utilisateur:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Le mot de passe actuel et le nouveau mot de passe sont requis",
            });
        }
        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return res.status(404).json({
                message: "Utilisateur non trouvé",
            });
        }
        // Vérifier le mot de passe actuel
        if (!user.password) {
            return res.status(401).json({
                message: "Mot de passe actuel incorrect",
            });
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Mot de passe actuel incorrect",
            });
        }
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        // Mettre à jour le mot de passe
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        res.json({
            message: "Mot de passe modifié avec succès",
        });
    }
    catch (error) {
        console.error("Erreur modification mot de passe:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
export const getCurrentUser = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true,
            avatar: true,
        },
    });
    if (!user) {
        throw new Error("Utilisateur non trouvé");
    }
    return user;
};
// Dans votre controller userController.ts
export const getPotentialDeans = async (req, res) => {
    const auditData = {
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
        userId: req.user?.id || req.userId || null,
    };
    try {
        // Récupérer tous les utilisateurs avec le rôle "Doyen"
        const deans = await prisma.user.findMany({
            where: {
                role: "Doyen",
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
                status: true,
                deanOf: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        });
        // Formater la réponse
        const formattedDeans = deans.map((dean) => ({
            id: dean.id,
            firstName: dean.firstName,
            lastName: dean.lastName,
            email: dean.email,
            avatar: dean.avatar,
            role: dean.role,
            status: dean.status,
            fullName: `${dean.firstName} ${dean.lastName}`,
            currentFaculty: dean.deanOf
                ? {
                    id: dean.deanOf.id,
                    name: dean.deanOf.name,
                    code: dean.deanOf.code,
                }
                : null,
            isAvailable: !dean.deanOf, // Disponible si pas déjà doyen d'une faculté
        }));
        // Log de consultation
        await createAuditLog({
            ...auditData,
            action: "GET_POTENTIAL_DEANS",
            entity: "User",
            description: `Consultation des utilisateurs pouvant être doyens - ${formattedDeans.length} trouvé(s)`,
            status: "SUCCESS",
        });
        res.json(formattedDeans);
    }
    catch (error) {
        console.error("Erreur récupération des doyens:", error);
        // Log d'erreur
        await createAuditLog({
            ...auditData,
            action: "GET_POTENTIAL_DEANS_ERROR",
            entity: "User",
            description: "Erreur lors de la récupération des utilisateurs pouvant être doyens",
            status: "ERROR",
            errorMessage: error.message,
        });
        res.status(500).json({
            message: "Erreur lors de la récupération des doyens",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
//# sourceMappingURL=userController.js.map