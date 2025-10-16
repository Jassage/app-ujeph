import { Router } from "express";
import {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../controllers/certificateController";

const router = Router();

router.get("/", getAllCertificates);
router.get("/:id", getCertificateById);
router.post("/", createCertificate);
router.put("/:id", updateCertificate);
router.delete("/:id", deleteCertificate);

export default router;