// src/routes/userRoutes.ts
import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
  getCurrentUser,
  getPotentialDeans,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  deanPermissions,
  checkDeanAccess,
} from "../middleware/deanPermissions";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
// router.post("/login", loginUser);

// Appliquer l'authentification et les permissions doyen aux routes protégées
router.use(authenticateToken, deanPermissions);

// Routes protégées avec permissions
router.get("/me", getCurrentUser);
router.get("/", getUsers);
router.get("/:id", checkDeanAccess("user"), getUserById);
router.put("/:id", checkDeanAccess("user"), updateUser);
router.delete("/:id", checkDeanAccess("user"), deleteUser);
router.patch("/:id/password", checkDeanAccess("user"), changePassword);
router.get("/potential/deans", checkDeanAccess("user"), getPotentialDeans);
export default router;
