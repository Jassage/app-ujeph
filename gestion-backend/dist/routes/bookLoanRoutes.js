import { Router } from "express";
import { getAllBookLoans, getBookLoanById, createBookLoan, updateBookLoan, deleteBookLoan, } from "../controllers/bookLoanController";
const router = Router();
router.get("/", getAllBookLoans);
router.get("/:id", getBookLoanById);
router.post("/", createBookLoan);
router.put("/:id", updateBookLoan);
router.delete("/:id", deleteBookLoan);
export default router;
//# sourceMappingURL=bookLoanRoutes.js.map