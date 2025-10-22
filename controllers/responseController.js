import Response from "../models/Response.js";
import Trigger from "../models/Trigger.js";

// @desc    Accept emergency trigger (Responder)
// @route   POST /api/responses/:triggerId/accept
// @access  Private/Responder
export const acceptTrigger = async (req, res) => {
  try {
    const { triggerId } = req.body;
    const { estimatedArrival } = req.body;

    const trigger = await Trigger.findById(triggerId);

    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: "Trigger not found",
      });
    }

    if (trigger.status === "resolved" || trigger.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This emergency has already been resolved or cancelled",
      });
    }

    // Find or create response record
    let response = await Response.findOne({
      trigger: triggerId,
      responder: req.user.id,
    });

    if (!response) {
      response = await Response.create({
        trigger: triggerId,
        responder: req.user.id,
        status: "accepted",
        acceptedAt: Date.now(),
        estimatedArrival,
      });
    } else {
      response.status = "accepted";
      response.acceptedAt = Date.now();
      if (estimatedArrival) {
        response.estimatedArrival = estimatedArrival;
      }
      // Calculate response time
      if (response.notifiedAt) {
        response.responseTime = Math.floor(
          (Date.now() - response.notifiedAt) / 1000
        );
      }
      await response.save();
    }

    // Update trigger status and add responder to active responders
    if (trigger.status === "active") {
      trigger.status = "responded";
    }

    const responderExists = trigger.activeResponders.some(
      (ar) => ar.responder.toString() === req.user.id
    );

    if (!responderExists) {
      trigger.activeResponders.push({
        responder: req.user.id,
        acceptedAt: Date.now(),
      });
    }

    await trigger.save();

    const populatedResponse = await Response.findById(response._id)
      .populate("trigger")
      .populate("responder", "name phone responderDetails");

    const populatedTrigger = await Trigger.findById(triggerId)
      .populate(
        "triggeredBy",
        "name email phone emergencyContacts medicalInfo address"
      )
      .populate("device", "deviceId deviceName")
      .populate("activeResponders.responder", "name phone responderDetails");

    // Emit socket events
    const io = req.app.get("io");

    // Notify all responders
    io.to("responders").emit("trigger-accepted", {
      trigger: populatedTrigger,
      responder: req.user.name,
    });

    // Notify the victim
    io.to(`user-${trigger.triggeredBy}`).emit("responder-assigned", {
      trigger: populatedTrigger,
      responder: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
      },
    });

    res.status(200).json({
      success: true,
      message: "Emergency accepted successfully",
      data: {
        response: populatedResponse,
        trigger: populatedTrigger,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error accepting trigger",
    });
  }
};

// @desc    Update response status
// @route   PUT /api/responses/:id/status
// @access  Private/Responder
export const updateResponseStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const response = await Response.findById(req.params.id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    if (response.responder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this response",
      });
    }

    response.status = status;

    if (notes) {
      response.notes = notes;
    }

    // Set timestamps based on status
    if (status === "arrived" && !response.actualArrival) {
      response.actualArrival = Date.now();

      // Calculate arrival time
      if (response.acceptedAt) {
        response.arrivalTime = Math.floor(
          (Date.now() - response.acceptedAt) / 1000
        );
      }
    }

    if (status === "completed" && !response.completedAt) {
      response.completedAt = Date.now();
    }

    await response.save();

    const populatedResponse = await Response.findById(response._id)
      .populate("trigger")
      .populate("responder", "name phone responderDetails");

    // Emit socket event
    const io = req.app.get("io");
    const trigger = await Trigger.findById(response.trigger);

    io.to(`user-${trigger.triggeredBy}`).emit("response-updated", {
      response: populatedResponse,
    });

    res.status(200).json({
      success: true,
      data: populatedResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating response",
    });
  }
};

// @desc    Add action to response
// @route   POST /api/responses/:id/actions
// @access  Private/Responder
export const addAction = async (req, res) => {
  try {
    const { action } = req.body;

    const response = await Response.findById(req.params.id);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    if (response.responder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this response",
      });
    }

    response.actionsTaken.push({
      action,
      timestamp: Date.now(),
    });

    await response.save();

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding action",
    });
  }
};

// @desc    Get responses for a trigger
// @route   GET /api/responses/trigger/:triggerId
// @access  Private
export const getResponsesByTrigger = async (req, res) => {
  try {
    const responses = await Response.find({ trigger: req.params.triggerId })
      .populate("responder", "name phone responderDetails")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching responses",
    });
  }
};

// @desc    Get responder's response history
// @route   GET /api/responses/my-responses
// @access  Private/Responder
export const getMyResponses = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { responder: req.user.id };

    if (status) {
      query.status = status;
    }

    const responses = await Response.find(query)
      .populate({
        path: "trigger",
        populate: {
          path: "triggeredBy",
          select: "name phone",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching responses",
    });
  }
};

// @desc    Get all responses (Admin only)
// @route   GET /api/responses
// @access  Private/Admin
export const getAllResponses = async (req, res) => {
  try {
    const { status, responder } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (responder) {
      query.responder = responder;
    }

    const responses = await Response.find(query)
      .populate("responder", "name phone responderDetails")
      .populate({
        path: "trigger",
        populate: {
          path: "triggeredBy",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching responses",
    });
  }
};

// @desc    Get response statistics (Admin only)
// @route   GET /api/responses/stats
// @access  Private/Admin
export const getResponseStats = async (req, res) => {
  try {
    const totalResponses = await Response.countDocuments();
    const acceptedResponses = await Response.countDocuments({
      status: { $in: ["accepted", "en_route", "arrived", "completed"] },
    });
    const completedResponses = await Response.countDocuments({
      status: "completed",
    });
    const declinedResponses = await Response.countDocuments({
      status: "declined",
    });

    // Calculate average response time
    const responsesWithTime = await Response.find({
      responseTime: { $exists: true, $ne: null },
    });

    const avgResponseTime =
      responsesWithTime.length > 0
        ? responsesWithTime.reduce((sum, r) => sum + r.responseTime, 0) /
          responsesWithTime.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalResponses,
        acceptedResponses,
        completedResponses,
        declinedResponses,
        averageResponseTime: Math.round(avgResponseTime),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching response statistics",
    });
  }
};
