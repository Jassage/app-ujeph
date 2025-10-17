"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoutes.ts
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = express_1.default.Router();
// Public routes
router.post("/register", userController_1.registerUser);
// router.post("/login", loginUser);
// Appliquer l'authentification et les permissions doyen aux routes protégées
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
// Routes protégées avec permissions
router.get("/me", userController_1.getCurrentUser);
router.get("/", userController_1.getUsers);
router.get("/:id", (0, deanPermissions_1.checkDeanAccess)("user"), userController_1.getUserById);
router.put("/:id", (0, deanPermissions_1.checkDeanAccess)("user"), userController_1.updateUser);
router.delete("/:id", (0, deanPermissions_1.checkDeanAccess)("user"), userController_1.deleteUser);
router.patch("/:id/password", (0, deanPermissions_1.checkDeanAccess)("user"), userController_1.changePassword);
router.get("/potential/deans", (0, deanPermissions_1.checkDeanAccess)("user"), userController_1.getPotentialDeans);
exports.default = router;
