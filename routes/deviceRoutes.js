import express from "express";
import { body } from "express-validator";
import {
  createDevice,
  getAllDevices,
  getDeviceById,
  getMyDevices,
  updateDevice,
  assignDevice,
  unassignDevice,
  deleteDevice,
  getDeviceStats,
} from "../controllers/deviceController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = express.Router();

// Validation rules
const createDeviceValidation = [
  body("deviceId").trim().notEmpty().withMessage("Device ID is required"),
  body("deviceName").trim().notEmpty().withMessage("Device name is required"),
  body("deviceType")
    .optional()
    .isIn(["button", "wearable", "mobile_app", "iot_device"])
    .withMessage("Invalid device type"),
];

const assignDeviceValidation = [
  body("userId").trim().notEmpty().withMessage("User ID is required"),
];

// End user routes
router.get("/my-devices", protect, authorize("enduser"), getMyDevices);

// Admin routes
router.post(
  "/",
  protect,
  authorize("admin"),
  createDeviceValidation,
  validate,
  createDevice
);
router.get("/", protect, authorize("admin"), getAllDevices);
router.get("/stats", protect, authorize("admin"), getDeviceStats);
router.get("/:id", protect, getDeviceById);
router.put("/:id", protect, authorize("admin"), updateDevice);
router.put(
  "/:id/assign",
  protect,
  authorize("admin"),
  assignDeviceValidation,
  validate,
  assignDevice
);
router.put("/:id/unassign", protect, authorize("admin"), unassignDevice);
router.delete("/:id", protect, authorize("admin"), deleteDevice);

export default router;
