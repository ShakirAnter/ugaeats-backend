"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.updateOrderStatus = exports.getOrderById = exports.getUserOrders = exports.createOrder = void 0;
const Order_1 = require("../models/Order");
const Cart_1 = require("../models/Cart");
const Restaurant_1 = require("../models/Restaurant");
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
        // 2️⃣ Prepare order items
        const orderItems = cart.items.map((item) => ({
            menu_item_id: item.menu_item_id._id,
            name: item.menu_item_id.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
        }));
        // 3️⃣ Calculate totals
        const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        const delivery_fee = 3000; // Example delivery fee
        const total_amount = subtotal + delivery_fee;
        // 4️⃣ Create new order
        const newOrder = new Order_1.Order({
            order_number: generateOrderNumber(),
            customer_id: userId,
            restaurant_id: cart.restaurant_id,
            items: orderItems,
            subtotal,
            delivery_fee,
            total_amount,
            payment_method,
            payment_status: "pending",
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            customer_phone,
            notes,
        });
        await newOrder.save();
        // 5️⃣ Delete the cart after checkout
        await Cart_1.Cart.findByIdAndDelete(cart_id);
        res.status(201).json({
            message: "Order created successfully",
            order: newOrder,
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
        const orders = await Order_1.Order.find({ customer_id: userId })
            .populate("restaurant_id", "name logo_url")
            .sort({ created_at: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};
exports.getUserOrders = getUserOrders;
// ✅ Get single order
const getOrderById = async (req, res) => {
    try {
        const order = await Order_1.Order.findById(req.params.id).populate("restaurant_id", "name logo_url");
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
        res
            .status(200)
            .json({ message: "Order status updated successfully", order });
    }
    catch (error) {
        console.error("Error updating order:", error);
        res
            .status(500)
            .json({ message: "Failed to update order status", error: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// ✅ Cancel order (by customer)
const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order_1.Order.findById(req.params.id);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        if (order.status === "delivered")
            return res
                .status(400)
                .json({ message: "Cannot cancel a delivered order" });
        order.status = "cancelled";
        order.cancellation_reason = reason;
        order.cancelled_at = new Date();
        await order.save();
        res.status(200).json({ message: "Order cancelled successfully", order });
    }
    catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: "Failed to cancel order" });
    }
};
exports.cancelOrder = cancelOrder;
