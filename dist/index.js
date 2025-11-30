"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const menuCategory_1 = __importDefault(require("./routes/menuCategory"));
const menuItem_1 = __importDefault(require("./routes/menuItem"));
const foodTypes_1 = __importStar(require("./routes/foodTypes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const address_1 = __importDefault(require("./routes/address"));
const users_1 = __importDefault(require("./routes/users"));
const search_1 = __importDefault(require("./routes/search"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const promoCodes_1 = __importDefault(require("./routes/promoCodes"));
const riders_1 = __importDefault(require("./routes/riders"));
const admin_1 = __importDefault(require("./routes/admin"));
const settings_1 = __importDefault(require("./routes/settings"));
const restaurantDashboard_1 = __importDefault(require("./routes/restaurantDashboard"));
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes (registered after successful DB connection)
app.use("/api/auth", auth_1.default);
app.use("/api/restaurants", restaurants_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/menucategories", menuCategory_1.default);
app.use("/api/menuitems", menuItem_1.default);
app.use("/api/foodtypes", foodTypes_1.default);
app.use("/api/cart", cartRoutes_1.default);
app.use("/api/addresses", address_1.default);
app.use("/api/users", users_1.default);
app.use("/api/search", search_1.default);
app.use("/api/favorites", favorites_1.default);
app.use("/api/reviews", reviews_1.default);
app.use("/api/promos", promoCodes_1.default);
app.use("/api/riders", riders_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/settings", settings_1.default);
app.use("/api/restaurant-dashboard", restaurantDashboard_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
const PORT = Number(process.env.PORT || 5000);
async function startServer() {
    try {
        // Wait for MongoDB connection first
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");
        await (0, foodTypes_1.seedFoodTypes)();
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            console.info(`Received ${signal}. Closing http server and mongoose connection...`);
            try {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err)
                            return reject(err);
                        console.log("HTTP server closed.");
                        resolve();
                    });
                });
                await mongoose_1.default.disconnect();
                console.log("MongoDB connection closed.");
                process.exit(0);
            }
            catch (err) {
                console.error("Error during shutdown:", err);
                process.exit(1);
            }
        };
        process.on("SIGINT", () => void shutdown("SIGINT"));
        process.on("SIGTERM", () => void shutdown("SIGTERM"));
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
