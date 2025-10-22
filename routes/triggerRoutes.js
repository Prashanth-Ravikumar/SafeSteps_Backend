import express from "express";
import { body } from "express-validator";
import {
  createTrigger,
  getAllTriggers,
  getTriggerById,
  getMyTriggers,
  getActiveTriggers,
  updateTriggerStatus,
  cancelTrigger,
  getTriggerStats,
} from "../controllers/triggerController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const createTriggerValidation = [
  body("deviceId").trim().notEmpty().withMessage("Device ID is required"),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage(
      "Location coordinates must be an array of [longitude, latitude]"
    ),
  body("location.coordinates.*")
    .isFloat()
    .withMessage("Coordinates must be valid numbers"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority level"),
];

const updateStatusValidation = [
  body("status")
    .isIn(["active", "responded", "resolved", "false_alarm", "cancelled"])
    .withMessage("Invalid status"),
];

// End user routes
router.post(
  "/",
  protect,
  authorize("enduser"),
  createTriggerValidation,
  validate,
  createTrigger
);
router.get("/my-triggers", protect, authorize("enduser"), getMyTriggers);
router.put("/:id/cancel", protect, authorize("enduser"), cancelTrigger);

// Responder routes
router.get(
  "/active",
  protect,
  authorize("responder", "admin"),
  getActiveTriggers
);

// Admin routes
router.get("/", protect, authorize("admin"), getAllTriggers);
router.get("/stats", protect, authorize("admin"), getTriggerStats);

// Shared routes
router.get("/:id", protect, getTriggerById);
router.put(
  "/:id/status",
  protect,
  updateStatusValidation,
  validate,
  updateTriggerStatus
);

export default router;
