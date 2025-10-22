import Device from "../models/Device.js";
import User from "../models/User.js";

// @desc    Create new device (Admin only)
// @route   POST /api/devices
// @access  Private/Admin
export const createDevice = async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, serialNumber, notes } = req.body;

    // Check if device ID already exists
    const deviceExists = await Device.findOne({ deviceId });

    if (deviceExists) {
      return res.status(400).json({
        success: false,
        message: "Device with this ID already exists",
      });
    }

    const device = await Device.create({
      deviceId,
      deviceName,
      deviceType,
      serialNumber,
      notes,
      createdBy: req.user.id,
      status: "unassigned",
    });

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error creating device",
    });
  }
};

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private/Admin
export const getAllDevices = async (req, res) => {
  try {
    const { status, deviceType, assignedTo } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (deviceType) {
      query.deviceType = deviceType;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const devices = await Device.find(query)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching devices",
    });
  }
};

// @desc    Get device by ID
// @route   GET /api/devices/:id
// @access  Private
export const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate("assignedTo", "name email phone emergencyContacts medicalInfo")
      .populate("createdBy", "name email");

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    res.status(200).json({
      success: true,
      data: device,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching device",
    });
  }
};

// @desc    Get devices assigned to current user
// @route   GET /api/devices/my-devices
// @access  Private/EndUser
export const getMyDevices = async (req, res) => {
  try {
    const devices = await Device.find({ assignedTo: req.user.id })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching devices",
    });
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private/Admin
export const updateDevice = async (req, res) => {
  try {
    const {
      deviceName,
      deviceType,
      serialNumber,
      status,
      batteryLevel,
      firmwareVersion,
      notes,
    } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update fields
    if (deviceName) device.deviceName = deviceName;
    if (deviceType) device.deviceType = deviceType;
    if (serialNumber) device.serialNumber = serialNumber;
    if (status) device.status = status;
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (firmwareVersion) device.firmwareVersion = firmwareVersion;
    if (notes !== undefined) device.notes = notes;

    device.lastPing = Date.now();

    await device.save();

    const updatedDevice = await Device.findById(device._id)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      data: updatedDevice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating device",
    });
  }
};

// @desc    Assign device to user
// @route   PUT /api/devices/:id/assign
// @access  Private/Admin
export const assignDevice = async (req, res) => {
  try {
    const { userId } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Verify user exists and is an end user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "enduser") {
      return res.status(400).json({
        success: false,
        message: "Devices can only be assigned to end users",
      });
    }

    device.assignedTo = userId;
    device.status = "active";
    await device.save();

    const updatedDevice = await Device.findById(device._id)
      .populate("assignedTo", "name email phone")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Device assigned successfully",
      data: updatedDevice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error assigning device",
    });
  }
};

// @desc    Unassign device from user
// @route   PUT /api/devices/:id/unassign
// @access  Private/Admin
export const unassignDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    device.assignedTo = null;
    device.status = "unassigned";
    await device.save();

    res.status(200).json({
      success: true,
      message: "Device unassigned successfully",
      data: device,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error unassigning device",
    });
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private/Admin
export const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Check if device is currently assigned
    if (device.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete assigned device. Please unassign first.",
      });
    }

    await device.deleteOne();

    res.status(200).json({
      success: true,
      message: "Device deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting device",
    });
  }
};

// @desc    Get device statistics
// @route   GET /api/devices/stats
// @access  Private/Admin
export const getDeviceStats = async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: "active" });
    const unassignedDevices = await Device.countDocuments({
      status: "unassigned",
    });
    const maintenanceDevices = await Device.countDocuments({
      status: "maintenance",
    });
    const inactiveDevices = await Device.countDocuments({ status: "inactive" });

    res.status(200).json({
      success: true,
      data: {
        totalDevices,
        activeDevices,
        unassignedDevices,
        maintenanceDevices,
        inactiveDevices,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching device statistics",
    });
  }
};
