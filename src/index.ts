import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import restaurantRoutes from "./routes/restaurants";
import orderRoutes from "./routes/orderRoutes";
import menuCategoryRoutes from "./routes/menuCategory";
import menuItemRoutes from "./routes/menuItem";
import foodTypesRoutes, { seedFoodTypes } from "./routes/foodTypes";
import cartRoutes from "./routes/cartRoutes";

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (registered after successful DB connection)
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/menucategories", menuCategoryRoutes);
app.use("/api/menuitems", menuItemRoutes);
app.use("/api/foodtypes", foodTypesRoutes);
app.use("/api/cart", cartRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    // Wait for MongoDB connection first
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");
    await seedFoodTypes();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.info(
        `Received ${signal}. Closing http server and mongoose connection...`
      );
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((err?: Error) => {
            if (err) return reject(err);
            console.log("HTTP server closed.");
            resolve();
          });
        });

        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
