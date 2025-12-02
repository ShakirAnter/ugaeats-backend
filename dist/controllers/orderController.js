"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliveryStatus = exports.cancelOrder = exports.updateOrderStatus = exports.acceptOrder = exports.getOrderById = exports.getAvailableOrders = exports.getRiderOrders = exports.getUserOrders = exports.createOrder = void 0;
const Order_1 = require("../models/Order");
const Cart_1 = require("../models/Cart");
const Restaurant_1 = require("../models/Restaurant");
const mongoose_1 = __importDefault(require("mongoose"));
const Rider_1 = require("../models/Rider");
// Helper to generate unique order numbers
const generateOrderNumber = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};
// ✅ Create new order from cart
const createOrder = async (req, res) => {
    try {
        const { cart_id, payment_method, delivery_address, customer_phone, notes, delivery_latitude, delivery_longitude, } = req.body;
        const userId = req.user._id; // from auth middleware
        // 1️⃣ Find the cart
        const cart = await Cart_1.Cart.findById(cart_id).populate("items.menu_item_id");
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        // 2️⃣ Get restaurant details for delivery fee
        const restaurant = await Restaurant_1.Restaurant.findById(cart.restaurant_id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        // 3️⃣ Prepare order items
        const orderItems = cart.items.map((item) => ({
            menu_item_id: item.menu_item_id._id,
            name: item.menu_item_id.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
        }));
        // 4️⃣ Calculate totals using restaurant's delivery fee
        const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        const delivery_fee = restaurant.delivery_fee;
        const total_amount = subtotal + delivery_fee;
        // Revenue split (business rule): app takes 10% of the order subtotal, restaurant receives the remainder.
        // Riders keep the delivery_fee in full.
        const app_cut = Number((subtotal * 0.1).toFixed(2));
        const restaurant_earnings = Number((subtotal - app_cut).toFixed(2));
        // 5️⃣ Create new order
        const newOrder = new Order_1.Order({
            order_number: generateOrderNumber(),
            customer_id: userId,
            restaurant_id: cart.restaurant_id,
            items: orderItems,
            subtotal,
            delivery_fee,
            total_amount,
            app_cut,
            restaurant_earnings,
            payment_method,
            payment_status: "pending",
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            customer_phone,
            notes,
        });
        await newOrder.save();
        // Return the order with related data populated so frontend can display richer info
        const populatedOrder = await Order_1.Order.findById(newOrder._id)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone email");
        // 6️⃣ Delete the cart after checkout
        await Cart_1.Cart.findByIdAndDelete(cart_id);
        res.status(201).json({
            message: "Order created successfully",
            order: populatedOrder || newOrder,
        });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res
            .status(500)
            .json({ message: "Failed to create order", error: error.message });
    }
};
exports.createOrder = createOrder;
// ✅ Get all orders for logged-in user
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        // By default return only "open" orders for the user. Pass ?history=true to include completed / cancelled orders.
        const history = String(req.query.history || '').toLowerCase() === 'true' || req.query.history === '1';
        const openStatuses = ["pending", "accepted", "preparing", "ready", "picked_up", "on_the_way"];
        const q = { customer_id: userId };
        if (!history)
            q.status = { $in: openStatuses };
        const orders = await Order_1.Order.find(q)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } })
            .sort({ created_at: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};
exports.getUserOrders = getUserOrders;
// ✅ Get all orders assigned to rider
const getRiderOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        // First, find the rider document for this user
        const rider = await Rider_1.Rider.findOne({ user_id: userId });
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        // Then find all orders assigned to this rider
        const orders = await Order_1.Order.find({ rider_id: rider._id })
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } })
            .sort({ created_at: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching rider orders:", error);
        res.status(500).json({ message: "Failed to fetch rider orders", error: error.message });
    }
};
exports.getRiderOrders = getRiderOrders;
// ✅ Get available orders for riders (status: ready, not yet assigned)
const getAvailableOrders = async (req, res) => {
    try {
        const orders = await Order_1.Order.find({
            status: "ready",
            rider_id: { $exists: false },
        })
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone")
            .sort({ created_at: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching available orders:", error);
        res.status(500).json({ message: "Failed to fetch available orders", error: error.message });
    }
};
exports.getAvailableOrders = getAvailableOrders;
// ✅ Get single order
const getOrderById = async (req, res) => {
    try {
        const order = await Order_1.Order.findById(req.params.id)
            .populate("restaurant_id", "name image_url address phone")
            .populate("customer_id", "full_name avatar_url phone email")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } });
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Failed to fetch order" });
    }
};
exports.getOrderById = getOrderById;
// ✅ Accept order (rider claims the order)
const acceptOrder = async (req, res) => {
    try {
        const order = await Order_1.Order.findById(req.params.id);
        const user = req.user;
        const rider = await Rider_1.Rider.find({ user_id: user._id });
        console.log(rider);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.rider_id) {
            return res.status(400).json({ message: "Order already claimed by another rider" });
        }
        if (order.status !== "ready") {
            return res.status(400).json({ message: "Can only accept orders that are ready for pickup" });
        }
        // Assign rider and update status to accepted (rider has claimed the order)
        order.rider_id = new mongoose_1.default.Types.ObjectId(rider[0]._id);
        order.status = "picked_up";
        order.picked_up_at = new Date();
        await order.save();
        const populatedOrder = await Order_1.Order.findById(order._id)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone email")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } });
        res.status(200).json({
            message: "Order accepted successfully",
            order: populatedOrder || order,
        });
    }
    catch (error) {
        console.error("Error accepting order:", error);
        res.status(500).json({ message: "Failed to accept order", error: error.message });
    }
};
exports.acceptOrder = acceptOrder;
// ✅ Update order status (only restaurant owner or admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = req.user;
        // 1️⃣ Find the order
        const order = await Order_1.Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        // 2️⃣ Find the restaurant to check ownership
        const restaurant = await Restaurant_1.Restaurant.findById(order.restaurant_id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        // 3️⃣ Authorization check
        const isAdmin = user.role === "admin";
        const isOwner = restaurant.owner_id.toString() === user._id.toString();
        if (!isAdmin && !isOwner) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this order" });
        }
        // 4️⃣ Update status timestamps
        order.status = status;
        if (status === "accepted")
            order.accepted_at = new Date();
        if (status === "ready")
            order.ready_at = new Date();
        if (status === "picked_up")
            order.picked_up_at = new Date();
        if (status === "delivered")
            order.delivered_at = new Date();
        if (status === "cancelled")
            order.cancelled_at = new Date();
        await order.save();
        const populatedOrder = await Order_1.Order.findById(order._id)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone email")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } });
        res.status(200).json({ message: "Order status updated successfully", order: populatedOrder || order });
    }
    catch (error) {
        console.error("Error updating order:", error);
        res
            .status(500)
            .json({ message: "Failed to update order status", error: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// ✅ Cancel order (by customer or rider)
const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user._id;
        const order = await Order_1.Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        if (order.status === "delivered")
            return res
                .status(400)
                .json({ message: "Cannot cancel a delivered order" });
        // If a rider is cancelling their pickup, allow them to release the order back to 'ready'
        if (order.rider_id) {
            // Find the rider document for the acting user (rider.user_id === user._id)
            const riderDoc = await Rider_1.Rider.findOne({ user_id: userId });
            // If the acting user is the assigned rider, allow reverting the order to ready
            if (riderDoc && order.rider_id.toString() === riderDoc._id.toString()) {
                order.rider_id = undefined;
                order.status = "ready"; // make it available for other riders
                order.cancellation_reason = reason || "Pickup cancelled by rider";
                await order.save();
                const populatedOrder = await Order_1.Order.findById(order._id)
                    .populate("restaurant_id", "name image_url delivery_fee address")
                    .populate("customer_id", "full_name avatar_url phone email");
                return res.status(200).json({
                    message: "Pickup cancelled by rider. Order is available for other riders.",
                    order: populatedOrder || order,
                });
            }
        }
        // If the customer (owner of the order) is cancelling, mark it cancelled
        if (order.customer_id && order.customer_id.toString() === userId.toString()) {
            order.status = "cancelled";
            order.cancellation_reason = reason || "Cancelled by customer";
            order.cancelled_at = new Date();
        }
        else {
            // Admins are not allowed to cancel orders and only the customer (owner) or an assigned rider can
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }
        await order.save();
        const populatedOrder = await Order_1.Order.findById(order._id)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone email")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } });
        res.status(200).json({ message: "Order cancelled successfully", order: populatedOrder || order });
    }
    catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};
exports.cancelOrder = cancelOrder;
// ✅ Update delivery status (rider updates status during delivery)
const updateDeliveryStatus = async (req, res) => {
    var _a;
    try {
        const { status } = req.body;
        const userId = req.user._id;
        // 1️⃣ Find the order
        const order = await Order_1.Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        // 2️⃣ Find rider document for this user and check assignment
        const rider = await Rider_1.Rider.findOne({ user_id: userId });
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        if (!order.rider_id || order.rider_id.toString() !== rider._id.toString()) {
            return res.status(403).json({ message: "You are not assigned to this order" });
        }
        // 3️⃣ Validate status transitions
        const validTransitions = {
            accepted: ["picked_up"],
            picked_up: ["on_the_way"],
            on_the_way: ["delivered"],
        };
        if (!((_a = validTransitions[order.status]) === null || _a === void 0 ? void 0 : _a.includes(status))) {
            return res.status(400).json({
                message: `Cannot transition from ${order.status} to ${status}`
            });
        }
        // 4️⃣ Update order status and timestamp
        order.status = status;
        if (status === "delivered")
            order.delivered_at = new Date();
        await order.save();
        const populatedOrder = await Order_1.Order.findById(order._id)
            .populate("restaurant_id", "name image_url delivery_fee address")
            .populate("customer_id", "full_name avatar_url phone email")
            .populate({ path: "rider_id", populate: { path: "user_id", select: "full_name avatar_url phone" } });
        res.status(200).json({ message: `Order status updated to ${status}`, order: populatedOrder || order });
    }
    catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ message: "Failed to update delivery status", error: error.message });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
