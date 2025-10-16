"use strict";
// import express from "express";
// import {
//   createEvent,
//   getEvents,
//   getEventById,
//   updateEvent,
//   deleteEvent,
//   getUpcomingEvents,
//   registerForEvent,
// } from "../controllers/eventController";
// import { authenticateToken, requireRole } from "../middleware/auth.middleware";
// // import { authenticateToken, requireRole } from "../middleware/auth.middleware";
// const router = express.Router();
// // Public routes
// router.get("/public/upcoming", getUpcomingEvents);
// router.get("/public/:id", getEventById);
// // Protected routes
// router.get("/", authenticateToken, getEvents);
// router.get("/:id", authenticateToken, getEventById);
// router.post(
//   "/",
//   authenticateToken,
//   requireRole(["Admin", "Directeur", "Secrétaire"]),
//   createEvent
// );
// router.put(
//   "/:id",
//   authenticateToken,
//   requireRole(["Admin", "Directeur", "Secrétaire"]),
//   updateEvent
// );
// router.delete(
//   "/:id",
//   authenticateToken,
//   requireRole(["Admin", "Directeur"]),
//   deleteEvent
// );
// router.post("/:id/register", registerForEvent);
// export default router;
//# sourceMappingURL=eventRoutes.js.map