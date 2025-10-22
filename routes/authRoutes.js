import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("role")
    .optional()
    .isIn(["enduser", "responder"])
    .withMessage("Role must be either enduser or responder"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// Routes
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  validate,
  changePassword
);

export default router;
