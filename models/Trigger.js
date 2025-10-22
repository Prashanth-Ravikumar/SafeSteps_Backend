import mongoose from "mongoose";

const triggerSchema = new mongoose.Schema({
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  status: {
    type: String,
    enum: ["active", "responded", "resolved", "false_alarm", "cancelled"],
    default: "active",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "high",
  },
  description: {
    type: String,
    trim: true,
  },
  // Response tracking
  respondersNotified: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  activeResponders: [
    {
      responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      acceptedAt: Date,
    },
  ],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: {
    type: Date,
  },
  resolutionNotes: {
    type: String,
    trim: true,
  },
  // Metadata
  triggerType: {
    type: String,
    enum: ["manual", "automatic", "scheduled_test"],
    default: "manual",
  },
  audioRecording: {
    type: String, // URL or path to audio file
    trim: true,
  },
  images: [
    {
      type: String, // URLs or paths to images
    },
  ],
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
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

// Create geospatial index for location-based queries
triggerSchema.index({ location: "2dsphere" });

// Index for faster queries
triggerSchema.index({ triggeredBy: 1, createdAt: -1 });
triggerSchema.index({ status: 1, createdAt: -1 });

// Update timestamp on save
triggerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Trigger = mongoose.model("Trigger", triggerSchema);

export default Trigger;
