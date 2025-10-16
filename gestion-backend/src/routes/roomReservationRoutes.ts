import { Router } from "express";
import {
  getAllRoomReservations,
  getRoomReservationById,
  createRoomReservation,
  updateRoomReservation,
  deleteRoomReservation,
} from "../controllers/roomReservationController";

const router = Router();

router.get("/", getAllRoomReservations);
router.get("/:id", getRoomReservationById);
router.post("/", createRoomReservation);
router.put("/:id", updateRoomReservation);
router.delete("/:id", deleteRoomReservation);

export default router;