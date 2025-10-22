import Trigger from "../models/Trigger.js";
import Device from "../models/Device.js";
import User from "../models/User.js";
import Response from "../models/Response.js";

// @desc    Create emergency trigger
// @route   POST /api/triggers
// @access  Private/EndUser
export const createTrigger = async (req, res) => {
  try {
    const { deviceId, location, description, priority } = req.body;

    // Verify device exists and is assigned to user
    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    if (device.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to use this device",
      });
    }

    // Create trigger
    const trigger = await Trigger.create({
      triggeredBy: req.user.id,
      device: deviceId,
      location: {
        type: "Point",
        coordinates: location.coordinates, // [longitude, latitude]
        address: location.address,
      },
      description,
      priority: priority || "high",
      status: "active",
      triggerType: "manual",
      batteryLevel: device.batteryLevel,
    });

    // Get all active responders
    const responders = await User.find({
      role: "responder",
      isActive: true,
    });

    // Create response records for all responders
    const responsePromises = responders.map((responder) =>
      Response.create({
        trigger: trigger._id,
        responder: responder._id,
        status: "notified",
      })
    );

    await Promise.all(responsePromises);

    // Update trigger with notified responders
    trigger.respondersNotified = responders.map((r) => r._id);
    await trigger.save();

    // Populate trigger data
    const populatedTrigger = await Trigger.findById(trigger._id)
      .populate("triggeredBy", "name email phone emergencyContacts medicalInfo")
      .populate("device", "deviceId deviceName deviceType")
      .populate("respondersNotified", "name phone");

    // Emit socket event to all responders
    const io = req.app.get("io");
    io.to("responders").emit("emergency-alert", {
      trigger: populatedTrigger,
      message: "New emergency alert!",
    });

    res.status(201).json({
      success: true,
      message: "Emergency alert triggered successfully",
      data: populatedTrigger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating trigger",
    });
  }
};

// @desc    Get all triggers
// @route   GET /api/triggers
// @access  Private/Admin
export const getAllTriggers = async (req, res) => {
  try {
    const { status, priority, startDate, endDate } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const triggers = await Trigger.find(query)
      .populate("triggeredBy", "name email phone emergencyContacts medicalInfo")
      .populate("device", "deviceId deviceName deviceType")
      .populate("respondersNotified", "name phone")
      .populate("activeResponders.responder", "name phone responderDetails")
      .populate("resolvedBy", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: triggers.length,
      data: triggers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching triggers",
    });
  }
};

// @desc    Get trigger by ID
// @route   GET /api/triggers/:id
// @access  Private
export const getTriggerById = async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id)
      .populate(
        "triggeredBy",
        "name email phone emergencyContacts medicalInfo address"
      )
      .populate("device", "deviceId deviceName deviceType")
      .populate("respondersNotified", "name phone responderDetails")
      .populate("activeResponders.responder", "name phone responderDetails")
      .populate("resolvedBy", "name phone");

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: "Trigger not found",
      });
    }

    // Check authorization
    if (
      req.user.role === "enduser" &&
      trigger.triggeredBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this trigger",
      });
    }

    res.status(200).json({
      success: true,
      data: trigger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching trigger",
    });
  }
};

// @desc    Get user's own triggers
// @route   GET /api/triggers/my-triggers
// @access  Private/EndUser
export const getMyTriggers = async (req, res) => {
  try {
    const triggers = await Trigger.find({ triggeredBy: req.user.id })
      .populate("device", "deviceId deviceName deviceType")
      .populate("activeResponders.responder", "name phone")
      .populate("resolvedBy", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: triggers.length,
      data: triggers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching triggers",
    });
  }
};

// @desc    Get active triggers (for responders)
// @route   GET /api/triggers/active
// @access  Private/Responder
export const getActiveTriggers = async (req, res) => {
  try {
    const triggers = await Trigger.find({
      status: { $in: ["active"] },
    })
      .populate(
        "triggeredBy",
        "name email phone emergencyContacts medicalInfo address"
      )
      .populate("device", "deviceId deviceName deviceType")
      .populate("activeResponders.responder", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: triggers.length,
      data: triggers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching active triggers",
    });
  }
};

// @desc    Update trigger status
// @route   PUT /api/triggers/:id/status
// @access  Private
export const updateTriggerStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;

    const trigger = await Trigger.findById(req.params.id);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: "Trigger not found",
      });
    }

    // Check authorization
    if (
      req.user.role === "enduser" &&
      trigger.triggeredBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trigger",
      });
    }

    trigger.status = status;

    if (status === "resolved" || status === "cancelled") {
      trigger.resolvedBy = req.user.id;
      trigger.resolvedAt = Date.now();
      if (resolutionNotes) {
        trigger.resolutionNotes = resolutionNotes;
      }
    }

    await trigger.save();

    const updatedTrigger = await Trigger.findById(trigger._id)
      .populate("triggeredBy", "name email phone")
      .populate("device", "deviceId deviceName")
      .populate("activeResponders.responder", "name phone")
      .populate("resolvedBy", "name phone");

    // Emit socket event
    const io = req.app.get("io");
    io.to("responders").emit("trigger-updated", {
      trigger: updatedTrigger,
    });

    // Notify the victim
    io.to(`user-${trigger.triggeredBy}`).emit("trigger-updated", {
      trigger: updatedTrigger,
    });

    res.status(200).json({
      success: true,
      data: updatedTrigger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating trigger",
    });
  }
};

// @desc    Cancel trigger (End User only)
// @route   PUT /api/triggers/:id/cancel
// @access  Private/EndUser
export const cancelTrigger = async (req, res) => {
  try {
    const trigger = await Trigger.findById(req.params.id);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: "Trigger not found",
      });
    }

    if (trigger.triggeredBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this trigger",
      });
    }

    if (trigger.status === "resolved") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel already resolved trigger",
      });
    }

    trigger.status = "cancelled";
    trigger.resolvedBy = req.user.id;
    trigger.resolvedAt = Date.now();
    trigger.resolutionNotes = "Cancelled by user";

    await trigger.save();

    // Emit socket event
    const io = req.app.get("io");
    io.to("responders").emit("trigger-cancelled", {
      triggerId: trigger._id,
      message: "Emergency alert cancelled by user",
    });

    res.status(200).json({
      success: true,
      message: "Trigger cancelled successfully",
      data: trigger,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error cancelling trigger",
    });
  }
};

// @desc    Get trigger statistics
// @route   GET /api/triggers/stats
// @access  Private/Admin
export const getTriggerStats = async (req, res) => {
  try {
    const totalTriggers = await Trigger.countDocuments();
    const activeTriggers = await Trigger.countDocuments({ status: "active" });
    const respondedTriggers = await Trigger.countDocuments({
      status: "responded",
    });
    const resolvedTriggers = await Trigger.countDocuments({
      status: "resolved",
    });
    const falseAlarms = await Trigger.countDocuments({ status: "false_alarm" });
    const cancelledTriggers = await Trigger.countDocuments({
      status: "cancelled",
    });

    // Get triggers by priority
    const criticalTriggers = await Trigger.countDocuments({
      priority: "critical",
      status: { $in: ["active", "responded"] },
    });
    const highTriggers = await Trigger.countDocuments({
      priority: "high",
      status: { $in: ["active", "responded"] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalTriggers,
        activeTriggers,
        respondedTriggers,
        resolvedTriggers,
        falseAlarms,
        cancelledTriggers,
        criticalTriggers,
        highTriggers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching trigger statistics",
    });
  }
};
