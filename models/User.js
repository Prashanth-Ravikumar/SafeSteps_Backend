import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "responder", "enduser"],
    default: "enduser",
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },
  emergencyContacts: [
    {
      name: String,
      phone: String,
      relation: String,
    },
  ],
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    medicalConditions: [String],
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // For responders
  responderDetails: {
    badgeNumber: String,
    department: String,
    specialization: String,
    yearsOfExperience: Number,
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

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
