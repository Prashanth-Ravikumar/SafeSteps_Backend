import express from "express";
import { body } from "express-validator";
import {
  acceptTrigger,
  updateResponseStatus,
  addAction,
  getResponsesByTrigger,
  getMyResponses,
  getAllResponses,
  getResponseStats,
} from "../controllers/responseController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const acceptTriggerValidation = [];

const updateStatusValidation = [
  body("status")
    .isIn([
      "notified",
      "accepted",
      "en_route",
      "arrived",
      "completed",
      "declined",
    ])
    .withMessage("Invalid status"),
];

const addActionValidation = [
  body("action")
    .trim()
    .notEmpty()
    .withMessage("Action description is required"),
];

// Responder routes
router.post(
  "/",
  protect,
  authorize("responder"),
  acceptTriggerValidation,
  validate,
  acceptTrigger
);
router.put(
  "/:id/status",
  protect,
  authorize("responder"),
  updateStatusValidation,
  validate,
  updateResponseStatus
);
router.post(
  "/:id/actions",
  protect,
  authorize("responder"),
  addActionValidation,
  validate,
  addAction
);
router.get("/my-responses", protect, authorize("responder"), getMyResponses);

// Admin routes
router.get("/", protect, authorize("admin"), getAllResponses);
router.get("/stats", protect, authorize("admin"), getResponseStats);

// Shared routes
router.get("/trigger/:triggerId", protect, getResponsesByTrigger);

export default router;
