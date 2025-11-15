import { Request, Response } from "express";
import { Rider } from "../models/Rider";
import { User } from "../models/User";

// ✅ Register as a rider
export const registerRider = async (req: any, res: Response) => {
  try {
    const { vehicle_type, vehicle_number } = req.body;
    const userId = req.user._id;

    // Check if user already has a rider profile
    const existingRider = await Rider.findOne({ user_id: userId });
    if (existingRider) {
      return res.status(400).json({ message: "User already registered as a rider" });
    }

    // Validate vehicle type
    if (!["motorcycle", "bicycle", "car"].includes(vehicle_type)) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    // Update user role to 'rider'
    await User.findByIdAndUpdate(userId, { role: "rider" });

    // Create rider profile
    const rider = new Rider({
      user_id: userId,
      vehicle_type,
      vehicle_number: vehicle_number || "",
      is_available: true,
      is_verified: false, // Admin will verify
    });

    await rider.save();

    // Fetch updated user with new role
    const updatedUser = await User.findById(userId);

    res.status(201).json({
      message: "Rider profile created successfully. Awaiting admin verification.",
      rider,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error registering rider:", error);
    res
      .status(500)
      .json({ message: "Failed to register rider", error: error.message });
  }
};

// ✅ Get rider profile
export const getRiderProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    const rider = await Rider.findOne({ user_id: userId }).populate(
      "user_id",
      "full_name phone avatar_url"
    );

    if (!rider) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    res.status(200).json(rider);
  } catch (error: any) {
    console.error("Error fetching rider profile:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch rider profile", error: error.message });
  }
};

// ✅ Update rider availability
export const updateRiderAvailability = async (req: any, res: Response) => {
  try {
    const { is_available } = req.body;
    const userId = req.user._id;

    const rider = await Rider.findOneAndUpdate(
      { user_id: userId },
      { is_available },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    res.status(200).json({
      message: "Rider availability updated",
      rider,
    });
  } catch (error: any) {
    console.error("Error updating rider availability:", error);
    res.status(500).json({
      message: "Failed to update rider availability",
      error: error.message,
    });
  }
};

// ✅ Update rider location (for live tracking)
export const updateRiderLocation = async (req: any, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res
        .status(400)
        .json({ message: "Invalid latitude or longitude" });
    }

    const rider = await Rider.findOneAndUpdate(
      { user_id: userId },
      {
        current_latitude: latitude,
        current_longitude: longitude,
      },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({ message: "Rider profile not found" });
    }

    res.status(200).json({
      message: "Rider location updated",
      rider,
    });
  } catch (error: any) {
    console.error("Error updating rider location:", error);
    res.status(500).json({
      message: "Failed to update rider location",
      error: error.message,
    });
  }
};

// ✅ Get available riders
export const getAvailableRiders = async (req: Request, res: Response) => {
  try {
    const riders = await Rider.find({
      is_available: true,
      is_verified: true,
    }).populate("user_id", "full_name phone avatar_url");

    res.status(200).json(riders);
  } catch (error: any) {
    console.error("Error fetching available riders:", error);
    res.status(500).json({
      message: "Failed to fetch available riders",
      error: error.message,
    });
  }
};

// ✅ Get rider by ID (for tracking)
export const getRiderById = async (req: Request, res: Response) => {
  try {
    const { riderId } = req.params;

    const rider = await Rider.findById(riderId).populate(
      "user_id",
      "full_name phone avatar_url"
    );

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    res.status(200).json(rider);
  } catch (error: any) {
    console.error("Error fetching rider:", error);
    res.status(500).json({
      message: "Failed to fetch rider",
      error: error.message,
    });
  }
};
