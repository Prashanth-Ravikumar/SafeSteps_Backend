import express from "express";
import {
  getAllUsers,
  getAllResponders,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Routes accessible by authenticated users
router.get("/responders", protect, getAllResponders);

// Admin only routes
router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/stats", protect, authorize("admin"), getUserStats);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
