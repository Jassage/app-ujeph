// middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const validateExpense = [
  body("category")
    .notEmpty()
    .withMessage("La catégorie est requise")
    .isLength({ max: 100 })
    .withMessage("La catégorie ne doit pas dépasser 100 caractères"),

  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Le montant doit être un nombre positif"),

  body("date").isISO8601().withMessage("La date doit être au format valide"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Le moyen de paiement est requis"),

  body("createdBy")
    .notEmpty()
    .withMessage("L'utilisateur est requis")
    .isString()
    .withMessage("L'ID utilisateur doit être une chaîne de caractères"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];
