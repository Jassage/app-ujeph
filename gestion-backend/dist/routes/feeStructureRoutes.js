"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/feeStructureRoutes.ts
const express_1 = require("express");
const feeStructureController_1 = require("../controllers/feeStructureController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.get("/", feeStructureController_1.getAllFeeStructures);
router.get("/:id", feeStructureController_1.getFeeStructureById);
router.post("/", feeStructureController_1.createFeeStructure);
router.put("/:id", feeStructureController_1.updateFeeStructure);
router.delete("/:id", feeStructureController_1.deleteFeeStructure);
exports.default = router;
