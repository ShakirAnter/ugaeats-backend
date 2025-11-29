"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRiderById = exports.getAvailableRiders = exports.updateRiderLocation = exports.updateRiderAvailability = exports.getRiderProfile = exports.registerRider = void 0;
const Rider_1 = require("../models/Rider");
const User_1 = require("../models/User");
// ✅ Register as a rider
const registerRider = async (req, res) => {
    try {
        const { vehicle_type, vehicle_number } = req.body;
        const userId = req.user._id;
        // Check if user already has a rider profile
        const existingRider = await Rider_1.Rider.findOne({ user_id: userId });
        if (existingRider) {
            return res.status(400).json({ message: "User already registered as a rider" });
        }
        // Validate vehicle type
        if (!["motorcycle", "bicycle", "car"].includes(vehicle_type)) {
            return res.status(400).json({ message: "Invalid vehicle type" });
        }
        // Update user role to 'rider'
        await User_1.User.findByIdAndUpdate(userId, { role: "rider" });
        // Create rider profile
        const rider = new Rider_1.Rider({
            user_id: userId,
            vehicle_type,
            vehicle_number: vehicle_number || "",
            is_available: true,
            is_verified: false, // Admin will verify
        });
        await rider.save();
        // Fetch updated user with new role
        const updatedUser = await User_1.User.findById(userId);
        res.status(201).json({
            message: "Rider profile created successfully. Awaiting admin verification.",
            rider,
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error registering rider:", error);
        res
            .status(500)
            .json({ message: "Failed to register rider", error: error.message });
    }
};
exports.registerRider = registerRider;
// ✅ Get rider profile
const getRiderProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const rider = await Rider_1.Rider.findOne({ user_id: userId }).populate("user_id", "full_name phone avatar_url");
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        res.status(200).json(rider);
    }
    catch (error) {
        console.error("Error fetching rider profile:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch rider profile", error: error.message });
    }
};
exports.getRiderProfile = getRiderProfile;
// ✅ Update rider availability
const updateRiderAvailability = async (req, res) => {
    try {
        const { is_available } = req.body;
        const userId = req.user._id;
        const rider = await Rider_1.Rider.findOneAndUpdate({ user_id: userId }, { is_available }, { new: true });
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        res.status(200).json({
            message: "Rider availability updated",
            rider,
        });
    }
    catch (error) {
        console.error("Error updating rider availability:", error);
        res.status(500).json({
            message: "Failed to update rider availability",
            error: error.message,
        });
    }
};
exports.updateRiderAvailability = updateRiderAvailability;
// ✅ Update rider location (for live tracking)
const updateRiderLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user._id;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return res
                .status(400)
                .json({ message: "Invalid latitude or longitude" });
        }
        const rider = await Rider_1.Rider.findOneAndUpdate({ user_id: userId }, {
            current_latitude: latitude,
            current_longitude: longitude,
        }, { new: true });
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        res.status(200).json({
            message: "Rider location updated",
            rider,
        });
    }
    catch (error) {
        console.error("Error updating rider location:", error);
        res.status(500).json({
            message: "Failed to update rider location",
            error: error.message,
        });
    }
};
exports.updateRiderLocation = updateRiderLocation;
// ✅ Get available riders
const getAvailableRiders = async (req, res) => {
    try {
        const riders = await Rider_1.Rider.find({
            is_available: true,
            is_verified: true,
        }).populate("user_id", "full_name phone avatar_url");
        res.status(200).json(riders);
    }
    catch (error) {
        console.error("Error fetching available riders:", error);
        res.status(500).json({
            message: "Failed to fetch available riders",
            error: error.message,
        });
    }
};
exports.getAvailableRiders = getAvailableRiders;
// ✅ Get rider by ID (for tracking)
const getRiderById = async (req, res) => {
    try {
        const { riderId } = req.params;
        const rider = await Rider_1.Rider.findById(riderId).populate("user_id", "full_name phone avatar_url");
        if (!rider) {
            return res.status(404).json({ message: "Rider not found" });
        }
        res.status(200).json(rider);
    }
    catch (error) {
        console.error("Error fetching rider:", error);
        res.status(500).json({
            message: "Failed to fetch rider",
            error: error.message,
        });
    }
};
exports.getRiderById = getRiderById;
