"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollmentController_1 = require("../controllers/enrollmentController");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.get("/", enrollmentController_1.getAllEnrollments);
// router.get("/:id", getEnrollmentById);
router.post("/", enrollmentController_1.createEnrollment);
router.put("/:id", enrollmentController_1.updateEnrollment);
router.delete("/:id", enrollmentController_1.deleteEnrollment);
// Nouvelles routes pour corriger les statuts
router.post("/fix-statuses/all", enrollmentController_1.fixEnrollmentStatuses); // Pour tous les étudiants
router.post("/fix-statuses/student/:studentId", enrollmentController_1.fixStudentEnrollmentStatus); // Pour un étudiant spécifique
exports.default = router;
