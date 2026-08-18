import mongoose from "mongoose";

const rideRatingSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | RIDE
    |--------------------------------------------------------------------------
    */

    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      unique: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | PASSENGER
    |--------------------------------------------------------------------------
    */

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | DRIVER
    |--------------------------------------------------------------------------
    */

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | RATING
    |--------------------------------------------------------------------------
    */

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL COMMENT
    |--------------------------------------------------------------------------
    */

    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

rideRatingSchema.index({
  driver: 1,
  createdAt: -1,
});

rideRatingSchema.index({
  passenger: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const RideRating = mongoose.model("RideRating", rideRatingSchema);

export default RideRating;
