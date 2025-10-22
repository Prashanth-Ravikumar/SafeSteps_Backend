import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const initializeAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@safesteps.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

      const admin = await User.create({
        name: "System Administrator",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        phone: "+1234567890",
        isActive: true,
      });

      console.log("✅ Default admin user created successfully");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log("⚠️  Please change the password after first login!");
    }
  } catch (error) {
    console.error("Error initializing admin:", error.message);
  }
};
