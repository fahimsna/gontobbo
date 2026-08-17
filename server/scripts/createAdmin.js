import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@gontobbo.com";

    const existingAdmin = await User.findOne({
      email,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@12345", 12);

    await User.create({
      name: "Gontobbo Admin",
      email,
      password: hashedPassword,
      phone: "01700000000",
      role: "admin",
    });

    console.log("Admin created successfully.");
    console.log(`Email: ${email}`);
    console.log("Password: Admin@12345");

    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }
};

createAdmin();
