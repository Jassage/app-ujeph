"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/academicYear.routes.ts
const express_1 = require("express");
const academicYearController_1 = require("../controllers/academicYearController");
const router = (0, express_1.Router)();
router.get("/", academicYearController_1.getAcademicYears);
router.get("/current", academicYearController_1.getCurrentYear);
router.get("/check", academicYearController_1.checkAcademicYear);
router.post("/", academicYearController_1.createAcademicYear);
exports.default = router;
