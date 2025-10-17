"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/studentFeeRoutes.ts
const express_1 = require("express");
const studentFeeController_1 = require("../controllers/studentFeeController");
const router = (0, express_1.Router)();
router.get("/", studentFeeController_1.getAllStudentFees);
router.get("/:id", studentFeeController_1.getStudentFeeById);
// Ajoutez cette nouvelle route
router.get("/student/:studentId/:academicYear", studentFeeController_1.getStudentFeeByStudentAndYear);
router.get("/student/:studentId", studentFeeController_1.getStudentFeesByStudent);
router.post("/", studentFeeController_1.assignFeeToStudent);
router.put("/:id", studentFeeController_1.updateStudentFee);
router.delete("/:id", studentFeeController_1.deleteStudentFee);
exports.default = router;
