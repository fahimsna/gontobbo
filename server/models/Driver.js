import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: [true, "Driving license number is required"],
      trim: true,
      uppercase: true,
    },

    licenseExpiry: {
      type: Date,
      required: [true, "Driving license expiry date is required"],
    },

    vehicle: {
      type: {
        type: String,
        enum: ["car", "bike", "cng"],
        required: [true, "Vehicle type is required"],
      },

      brand: {
        type: String,
        required: [true, "Vehicle brand is required"],
        trim: true,
      },

      model: {
        type: String,
        required: [true, "Vehicle model is required"],
        trim: true,
      },

      year: {
        type: Number,
        required: [true, "Vehicle year is required"],
      },

      color: {
        type: String,
        required: [true, "Vehicle color is required"],
        trim: true,
      },

      registrationNumber: {
        type: String,
        required: [true, "Vehicle registration number is required"],
        trim: true,
        uppercase: true,
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    currentLocation: {
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },

    totalRides: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
