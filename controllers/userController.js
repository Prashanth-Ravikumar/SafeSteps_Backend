import User from "../models/User.js";
import Device from "../models/Device.js";
import Trigger from "../models/Trigger.js";

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching users",
    });
  }
};

// @desc    Get all responders
// @route   GET /api/users/responders
// @access  Private
export const getAllResponders = async (req, res) => {
  try {
    const responders = await User.find({
      role: "responder",
      isActive: true,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: responders.length,
      data: responders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching responders",
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user",
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      isActive,
      emergencyContacts,
      medicalInfo,
      address,
      responderDetails,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (emergencyContacts) user.emergencyContacts = emergencyContacts;
    if (medicalInfo) user.medicalInfo = medicalInfo;
    if (address) user.address = address;
    if (responderDetails && role === "responder")
      user.responderDetails = responderDetails;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating user",
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin user",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting user",
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const endUsers = await User.countDocuments({ role: "enduser" });
    const responders = await User.countDocuments({ role: "responder" });
    const admins = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        endUsers,
        responders,
        admins,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user statistics",
    });
  }
};
