import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    pickup: {
      address: {
        type: String,
        required: [true, "Pickup address is required"],
        trim: true,
      },

      latitude: {
        type: Number,
        required: [true, "Pickup latitude is required"],
      },

      longitude: {
        type: Number,
        required: [true, "Pickup longitude is required"],
      },
    },

    destination: {
      address: {
        type: String,
        required: [true, "Destination address is required"],
        trim: true,
      },

      latitude: {
        type: Number,
        required: [true, "Destination latitude is required"],
      },

      longitude: {
        type: Number,
        required: [true, "Destination longitude is required"],
      },
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike", "cng"],
      required: true,
    },

    distance: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedDuration: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedFare: {
      type: Number,
      required: true,
      min: 0,
    },

    finalFare: {
      type: Number,
      default: null,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "searching",
        "accepted",
        "driver_arriving",
        "driver_arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    cancelledBy: {
      type: String,
      enum: ["passenger", "driver", "system", null],
      default: null,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
