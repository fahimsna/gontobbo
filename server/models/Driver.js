import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /*
    |--------------------------------------------------------------------------
    | LICENSE
    |--------------------------------------------------------------------------
    */

    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    licenseExpiry: {
      type: Date,
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | VEHICLE
    |--------------------------------------------------------------------------
    */

    vehicle: {
      type: {
        type: String,
        enum: ["car", "bike", "cng"],
        required: true,
      },

      /*
       * Optional because the current frontend only asks
       * for Vehicle Model.
       */
      brand: {
        type: String,
        default: "Not specified",
        trim: true,
      },

      model: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * Optional.
       */
      year: {
        type: Number,
        default: new Date().getFullYear(),
      },

      /*
       * Optional.
       */
      color: {
        type: String,
        default: "Not specified",
        trim: true,
      },

      registrationNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | APPLICATION STATUS
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    isAvailable: {
      type: Boolean,
      default: false,
    },

    /*
    |--------------------------------------------------------------------------
    | CURRENT LOCATION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Do NOT create an empty GeoJSON Point.
    |
    | A driver gets a location only after GPS/location update.
    |
    */

    currentLocation: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    /*
    |--------------------------------------------------------------------------
    | DRIVER STATISTICS
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| GEO INDEX
|--------------------------------------------------------------------------
|
| Used later for finding nearby available drivers.
|
*/

driverSchema.index({
  currentLocation: "2dsphere",
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
