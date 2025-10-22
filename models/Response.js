import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  trigger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trigger",
    required: true,
  },
  responder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: [
      "notified",
      "accepted",
      "en_route",
      "arrived",
      "completed",
      "declined",
    ],
    default: "notified",
  },
  responseTime: {
    type: Number, // Time in seconds from notification to acceptance
  },
  arrivalTime: {
    type: Number, // Time in seconds from acceptance to arrival
  },
  estimatedArrival: {
    type: Number, // Estimated time in minutes to arrival
  },
  actualArrival: {
    type: Number, // Actual time in minutes to arrival
  },
  notes: {
    type: String,
    trim: true,
  },
  actionsTaken: [
    {
      action: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  notifiedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
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

// Index for faster queries
responseSchema.index({ trigger: 1, responder: 1 });
responseSchema.index({ responder: 1, status: 1 });
responseSchema.index({ status: 1, createdAt: -1 });

// Update timestamp on save
responseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Response = mongoose.model("Response", responseSchema);

export default Response;
