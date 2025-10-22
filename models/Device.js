import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, "Device ID is required"],
    unique: true,
    trim: true,
  },
  deviceName: {
    type: String,
    required: [true, "Device name is required"],
    trim: true,
  },
  deviceType: {
    type: String,
    enum: ["button", "wearable", "mobile_app", "iot_device"],
    default: "button",
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance", "unassigned"],
    default: "unassigned",
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  lastPing: {
    type: Date,
    default: Date.now,
  },
  firmwareVersion: {
    type: String,
    default: "1.0.0",
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
deviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
deviceSchema.index({ assignedTo: 1, status: 1 });

const Device = mongoose.model("Device", deviceSchema);

export default Device;
