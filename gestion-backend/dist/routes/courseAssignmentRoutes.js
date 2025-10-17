"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseAssignmentControllers_1 = require("../controllers/courseAssignmentControllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const deanPermissions_1 = require("../middleware/deanPermissions");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticateToken, deanPermissions_1.deanPermissions);
router.post("/", courseAssignmentControllers_1.createCourseAssignment);
router.get("/", courseAssignmentControllers_1.getCourseAssignments);
// router.get("/stats", getAssignmentStats);
// router.get("/:id", getCourseAssignmentById);
router.put("/:id", courseAssignmentControllers_1.updateCourseAssignment);
router.delete("/:id", courseAssignmentControllers_1.deleteCourseAssignment);
router.get("/faculty/:facultyId", courseAssignmentControllers_1.getAssignmentsByFaculty);
exports.default = router;
