import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Cart } from "../models/Cart";
import { Restaurant } from "../models/Restaurant";
import mongoose from "mongoose";

// Helper to generate unique order numbers
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// ✅ Create new order from cart
export const createOrder = async (req: any, res: Response) => {
  try {
    const {
      cart_id,
      payment_method,
      delivery_address,
      customer_phone,
      notes,
      delivery_latitude,
      delivery_longitude,
    } = req.body;
    const userId = req.user._id; // from auth middleware

    // 1️⃣ Find the cart
    const cart = await Cart.findById(cart_id).populate("items.menu_item_id");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 2️⃣ Get restaurant details for delivery fee
    const restaurant = await Restaurant.findById(cart.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // 3️⃣ Prepare order items
    const orderItems = cart.items.map((item: any) => ({
      menu_item_id: item.menu_item_id._id,
      name: item.menu_item_id.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));

    // 4️⃣ Calculate totals using restaurant's delivery fee
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    const delivery_fee = restaurant.delivery_fee;
    const total_amount = subtotal + delivery_fee;

    // 5️⃣ Create new order
    const newOrder = new Order({
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

    // 6️⃣ Delete the cart after checkout
    await Cart.findByIdAndDelete(cart_id);

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
};

// ✅ Get all orders for logged-in user
export const getUserOrders = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ customer_id: userId })
      .populate("restaurant_id", "name logo_url")
      .sort({ created_at: -1 });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ✅ Get all orders assigned to rider
export const getRiderOrders = async (req: any, res: Response) => {
  try {
    const riderId = req.user._id;

    const orders = await Order.find({ rider_id: riderId })
      .populate("restaurant_id", "name image_url delivery_fee")
      .sort({ created_at: -1 });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Error fetching rider orders:", error);
    res.status(500).json({ message: "Failed to fetch rider orders", error: error.message });
  }
};

// ✅ Get available orders for riders (status: ready, not yet assigned)
export const getAvailableOrders = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ 
      status: "ready", 
      rider_id: { $exists: false } 
    })
      .populate("restaurant_id", "name image_url delivery_fee")
      .sort({ created_at: -1 });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Error fetching available orders:", error);
    res.status(500).json({ message: "Failed to fetch available orders", error: error.message });
  }
};

// ✅ Get single order
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "restaurant_id",
      "name logo_url"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (error: any) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ✅ Accept order (rider claims the order)
export const acceptOrder = async (req: any, res: Response) => {
  try {
    const riderId = req.user._id; // Rider ID from auth middleware
    const order = await Order.findById(req.params.id);

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
    order.rider_id = new mongoose.Types.ObjectId(riderId);
    order.status = "picked_up";
    order.picked_up_at = new Date();

    await order.save();

    res.status(200).json({
      message: "Order accepted successfully",
      order,
    });
  } catch (error: any) {
    console.error("Error accepting order:", error);
    res.status(500).json({ message: "Failed to accept order", error: error.message });
  }
};

// ✅ Update order status (only restaurant owner or admin)
export const updateOrderStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;
    const user = req.user;

    // 1️⃣ Find the order
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2️⃣ Find the restaurant to check ownership
    const restaurant = await Restaurant.findById(order.restaurant_id);
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

    if (status === "accepted") order.accepted_at = new Date();
    if (status === "ready") order.ready_at = new Date();
    if (status === "picked_up") order.picked_up_at = new Date();
    if (status === "delivered") order.delivered_at = new Date();
    if (status === "cancelled") order.cancelled_at = new Date();

    await order.save();

    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error: any) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Failed to update order status", error: error.message });
  }
};

// ✅ Cancel order (by customer or rider)
export const cancelOrder = async (req: any, res: Response) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "delivered")
      return res
        .status(400)
        .json({ message: "Cannot cancel a delivered order" });

    // If rider is cancelling their pickup (order has rider_id)
    if (order.rider_id && order.rider_id.toString() === userId.toString()) {
      // Revert to ready so another rider can accept it
      order.rider_id = undefined;
      order.status = "ready";
      order.cancellation_reason = reason;

      await order.save();

      return res.status(200).json({ 
        message: "Pickup cancelled. Order is available for other riders.", 
        order 
      });
    }

    // Otherwise, it's a customer cancellation
    order.status = "cancelled";
    order.cancellation_reason = reason;
    order.cancelled_at = new Date();

    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// ✅ Update delivery status (rider updates status during delivery)
export const updateDeliveryStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;
    const riderId = req.user._id;

    // 1️⃣ Find the order
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2️⃣ Check if rider is assigned to this order
    if (!order.rider_id || order.rider_id.toString() !== riderId.toString()) {
      return res.status(403).json({ message: "You are not assigned to this order" });
    }

    // 3️⃣ Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      accepted: ["picked_up"],
      picked_up: ["on_the_way"],
      on_the_way: ["delivered"],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${order.status} to ${status}` 
      });
    }

    // 4️⃣ Update order status and timestamp
    order.status = status;
    
    if (status === "delivered") order.delivered_at = new Date();

    await order.save();

    res.status(200).json({
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error: any) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Failed to update delivery status", error: error.message });
  }
};
