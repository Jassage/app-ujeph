import { Router } from "express";
import { getAllRoomEquipments, getRoomEquipmentById, createRoomEquipment, updateRoomEquipment, deleteRoomEquipment, } from "../controllers/roomEquipmentController";
const router = Router();
router.get("/", getAllRoomEquipments);
router.get("/:id", getRoomEquipmentById);
router.post("/", createRoomEquipment);
router.put("/:id", updateRoomEquipment);
router.delete("/:id", deleteRoomEquipment);
export default router;
//# sourceMappingURL=roomEquipmentRoutes.js.map