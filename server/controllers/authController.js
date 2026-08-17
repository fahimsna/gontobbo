import bcrypt from "bcryptjs";

import User from "../models/User.js";

import generateToken from "../utils/generateToken.js";

/*
|--------------------------------------------------------------------------
| REGISTER USER
|--------------------------------------------------------------------------
*/

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Role
    |--------------------------------------------------------------------------
    |
    | Public registration only allows:
    |
    | passenger
    | driver
    |
    | Admin accounts are created separately.
    |
    */

    const selectedRole = role || "passenger";

    const allowedRoles = ["passenger", "driver"];

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check existing email
    |--------------------------------------------------------------------------
    */

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash password
    |--------------------------------------------------------------------------
    */

    const hashedPassword = await bcrypt.hash(password, 12);

    /*
    |--------------------------------------------------------------------------
    | Create user
    |--------------------------------------------------------------------------
    */

    const user = await User.create({
      name: name.trim(),

      email: email.toLowerCase().trim(),

      phone: phone?.trim() || "",

      password: hashedPassword,

      role: selectedRole,
    });

    /*
    |--------------------------------------------------------------------------
    | Generate JWT
    |--------------------------------------------------------------------------
    */

    const token = generateToken(user._id);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        selectedRole === "driver"
          ? "Driver account created successfully. Please complete your driver application."
          : "Account created successfully.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN USER
|--------------------------------------------------------------------------
*/

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find user
    |--------------------------------------------------------------------------
    */

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check active status
    |--------------------------------------------------------------------------
    */

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Compare password
    |--------------------------------------------------------------------------
    */

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate token
    |--------------------------------------------------------------------------
    */

    const token = generateToken(user._id);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message: "Login successful.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
