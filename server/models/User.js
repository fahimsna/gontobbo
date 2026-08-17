import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,

      enum: ["passenger", "driver", "admin"],

      default: "passenger",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profileImage: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
