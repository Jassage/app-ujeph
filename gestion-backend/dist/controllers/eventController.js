"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerForEvent = exports.getUpcomingEvents = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = void 0;
const prisma_1 = require("../../generated/prisma");
const prisma = new prisma_1.PrismaClient();
const createEvent = async (req, res) => {
    try {
        const { title, description, startDate, endDate, location, organizer, category, participants, isPublic, } = req.body;
        // Validation des champs obligatoires
        if (!title || !startDate || !endDate || !category) {
            return res.status(400).json({
                message: "Les champs title, startDate, endDate et category sont obligatoires",
            });
        }
        // Créer l'événement
        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                location: location || null,
                organizer: organizer || null,
                category,
                // participants: participants || [],
                isPublic: isPublic !== undefined ? isPublic : true,
                status: "Programmé",
            },
        });
        res.status(201).json(event);
    }
    catch (error) {
        console.error("Erreur création événement:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.createEvent = createEvent;
const getEvents = async (req, res) => {
    try {
        const { category, status, startDate, endDate, isPublic } = req.query;
        const where = {};
        if (category && category !== "all") {
            where.category = category;
        }
        if (status && status !== "all") {
            where.status = status;
        }
        if (isPublic !== undefined) {
            where.isPublic = isPublic === "true";
        }
        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
                {
                    endDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                },
            ];
        }
        const events = await prisma.event.findMany({
            where,
            orderBy: {
                startDate: "asc",
            },
        });
        res.json(events);
    }
    catch (error) {
        console.error("Erreur récupération événements:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.getEvents = getEvents;
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                organizer: true,
                category: true,
                isPublic: true,
                status: true,
                // participants: true,
            },
        });
        if (!event) {
            return res.status(404).json({
                message: "Événement non trouvé",
            });
        }
        res.json(event);
    }
    catch (error) {
        console.error("Erreur récupération événement:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.getEventById = getEventById;
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, startDate, endDate, location, organizer, category, participants, isPublic, status, } = req.body;
        // Vérifier si l'événement existe
        const existingEvent = await prisma.event.findUnique({
            where: { id },
        });
        if (!existingEvent) {
            return res.status(404).json({
                message: "Événement non trouvé",
            });
        }
        // Mettre à jour l'événement
        const event = await prisma.event.update({
            where: { id },
            data: {
                title: title ?? undefined,
                description: description ?? undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                location: location ?? undefined,
                organizer: organizer ?? undefined,
                category: category ?? undefined,
                // participants: participants ?? undefined,
                isPublic: isPublic ?? undefined,
                status: status ?? undefined,
            },
        });
        res.json(event);
    }
    catch (error) {
        console.error("Erreur modification événement:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier si l'événement existe
        const event = await prisma.event.findUnique({
            where: { id },
            //   select: {
            //     id: true,
            //     participants: true,
            //   },
        });
        if (!event) {
            return res.status(404).json({
                message: "Événement non trouvé",
            });
        }
        // Supprimer l'événement
        await prisma.event.delete({
            where: { id },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Erreur suppression événement:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.deleteEvent = deleteEvent;
const getUpcomingEvents = async (req, res) => {
    try {
        const today = new Date();
        const events = await prisma.event.findMany({
            where: {
                startDate: {
                    gte: today,
                },
                status: "Programmé",
                isPublic: true,
            },
            orderBy: {
                startDate: "asc",
            },
            take: 10,
        });
        res.json(events);
    }
    catch (error) {
        console.error("Erreur récupération événements à venir:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
const registerForEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        // Vérifier si l'événement existe
        const event = await prisma.event.findUnique({
            where: { id },
            //   select: {
            //     id: true,
            //     participants: true,
            //   },
        });
        if (!event) {
            return res.status(404).json({
                message: "Événement non trouvé",
            });
        }
        // Vérifier si l'utilisateur est déjà inscrit
        // if (event.participants.includes(userId)) {
        //   return res.status(400).json({
        //     message: "Utilisateur déjà inscrit à cet événement",
        //   });
        // }
        // Ajouter l'utilisateur aux participants
        // const updatedEvent = await prisma.event.update({
        //   where: { id },
        //   data: {
        //     participants: {
        //       connect: { id: userId },
        //     },
        //   },
        // });
        // res.json(updatedEvent);
    }
    catch (error) {
        console.error("Erreur inscription événement:", error);
        res.status(500).json({
            message: "Erreur interne du serveur",
        });
    }
};
exports.registerForEvent = registerForEvent;
