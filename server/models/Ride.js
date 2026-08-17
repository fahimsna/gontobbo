import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  {
    _id: false,
  },
);

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    pickup: {
      type: locationSchema,
      required: true,
    },

    dropoff: {
      type: locationSchema,
      required: true,
    },

    vehicleType: {
      type: String,
      enum: ["car", "bike", "cng"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "searching",
        "accepted",
        "arrived",
        "started",
        "completed",
        "cancelled",
      ],
      default: "searching",
      index: true,
    },

    fare: {
      estimated: {
        type: Number,
        default: 0,
        min: 0,
      },

      final: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    distance: {
      estimated: {
        type: Number,
        default: 0,
        min: 0,
      },

      actual: {
        type: Number,
        default: null,
        min: 0,
      },
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

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Geospatial indexes
|--------------------------------------------------------------------------
*/

rideSchema.index({
  "pickup.location": "2dsphere",
});

rideSchema.index({
  "dropoff.location": "2dsphere",
});

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
