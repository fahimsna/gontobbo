import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import RideRating from "../models/RideRating.js";

/*
|--------------------------------------------------------------------------
| PASSENGER - RATE COMPLETED RIDE
|--------------------------------------------------------------------------
*/

export const rateRide = async (req, res) => {
  try {
    const rideId = req.params.id;

    const ratingNumber = Number(req.body.rating);

    const comment =
      typeof req.body.comment === "string" ? req.body.comment.trim() : "";

    /*
    |--------------------------------------------------------------------------
    | VALIDATE RATING
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isFinite(ratingNumber) ||
      !Number.isInteger(ratingNumber) ||
      ratingNumber < 1 ||
      ratingNumber > 5
    ) {
      return res.status(400).json({
        success: false,

        message: "Rating must be a whole number between 1 and 5.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE COMMENT
    |--------------------------------------------------------------------------
    */

    if (comment.length > 500) {
      return res.status(400).json({
        success: false,

        message: "Comment cannot be longer than 500 characters.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND RIDE
    |--------------------------------------------------------------------------
    |
    | The passenger can only rate:
    |
    | 1. Their own ride
    | 2. A completed ride
    |
    */

    const ride = await Ride.findOne({
      _id: rideId,

      passenger: req.user._id,

      status: "completed",
    });

    if (!ride) {
      return res.status(404).json({
        success: false,

        message: "Completed ride not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | DRIVER REQUIRED
    |--------------------------------------------------------------------------
    */

    if (!ride.driver) {
      return res.status(400).json({
        success: false,

        message: "This ride does not have an assigned driver.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE RATING
    |--------------------------------------------------------------------------
    */

    const existingRating = await RideRating.findOne({
      ride: ride._id,
    });

    if (existingRating) {
      return res.status(409).json({
        success: false,

        message: "You have already rated this ride.",

        rating: existingRating,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE RATING
    |--------------------------------------------------------------------------
    */

    const rating = await RideRating.create({
      ride: ride._id,

      passenger: req.user._id,

      driver: ride.driver,

      rating: ratingNumber,

      comment,
    });

    /*
    |--------------------------------------------------------------------------
    | RECALCULATE DRIVER RATING
    |--------------------------------------------------------------------------
    |
    | We calculate the average from all ratings
    | instead of trying to update it manually.
    |
    | This keeps the value correct even if more
    | ratings are added later.
    |
    */

    const ratingStats = await RideRating.aggregate([
      {
        $match: {
          driver: ride.driver,
        },
      },

      {
        $group: {
          _id: "$driver",

          averageRating: {
            $avg: "$rating",
          },

          totalRatings: {
            $sum: 1,
          },
        },
      },
    ]);

    const statistics = ratingStats[0];

    const averageRating = statistics
      ? Number(Number(statistics.averageRating).toFixed(2))
      : 0;

    /*
    |--------------------------------------------------------------------------
    | UPDATE DRIVER
    |--------------------------------------------------------------------------
    */

    await Driver.updateOne(
      {
        user: ride.driver,
      },
      {
        $set: {
          rating: averageRating,
        },
      },
    );

    /*
    |--------------------------------------------------------------------------
    | POPULATE RATING
    |--------------------------------------------------------------------------
    */

    const populatedRating = await RideRating.findById(rating._id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone")
      .populate("ride");

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message: "Thank you. Your rating has been submitted.",

      rating: populatedRating,

      driverRating: averageRating,

      totalRatings: statistics?.totalRatings || 1,
    });
  } catch (error) {
    console.error("Rate ride error:", error);

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE KEY
    |--------------------------------------------------------------------------
    |
    | The ride field is unique, so MongoDB can
    | protect us from two simultaneous ratings.
    |
    */

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,

        message: "You have already rated this ride.",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Failed to submit ride rating.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| PASSENGER - GET RATING FOR RIDE
|--------------------------------------------------------------------------
*/

export const getRideRating = async (req, res) => {
  try {
    /*
      |--------------------------------------------------------------------------
      | VERIFY RIDE BELONGS TO PASSENGER
      |--------------------------------------------------------------------------
      */

    const ride = await Ride.findOne({
      _id: req.params.id,

      passenger: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,

        message: "Ride not found.",
      });
    }

    /*
      |--------------------------------------------------------------------------
      | FIND RATING
      |--------------------------------------------------------------------------
      */

    const rating = await RideRating.findOne({
      ride: ride._id,
    })
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone");

    return res.status(200).json({
      success: true,

      rating: rating || null,
    });
  } catch (error) {
    console.error("Get ride rating error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch ride rating.",
    });
  }
};
