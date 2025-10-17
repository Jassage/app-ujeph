"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExpense = void 0;
const express_validator_1 = require("express-validator");
exports.validateExpense = [
    (0, express_validator_1.body)("category")
        .notEmpty()
        .withMessage("La catégorie est requise")
        .isLength({ max: 100 })
        .withMessage("La catégorie ne doit pas dépasser 100 caractères"),
    (0, express_validator_1.body)("amount")
        .isFloat({ min: 0 })
        .withMessage("Le montant doit être un nombre positif"),
    (0, express_validator_1.body)("date").isISO8601().withMessage("La date doit être au format valide"),
    (0, express_validator_1.body)("paymentMethod")
        .notEmpty()
        .withMessage("Le moyen de paiement est requis"),
    (0, express_validator_1.body)("createdBy")
        .notEmpty()
        .withMessage("L'utilisateur est requis")
        .isString()
        .withMessage("L'ID utilisateur doit être une chaîne de caractères"),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }
        next();
    },
];
