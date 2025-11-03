"use strict";
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
const orders_1 = __importDefault(require("./routes/orders"));
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes (registered after successful DB connection)
app.use('/api/auth', auth_1.default);
app.use('/api/restaurants', restaurants_1.default);
app.use('/api/orders', orders_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
const PORT = Number(process.env.PORT || 5000);
async function startServer() {
    try {
        // Wait for MongoDB connection first
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
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
                        console.log('HTTP server closed.');
                        resolve();
                    });
                });
                await mongoose_1.default.disconnect();
                console.log('MongoDB connection closed.');
                process.exit(0);
            }
            catch (err) {
                console.error('Error during shutdown:', err);
                process.exit(1);
            }
        };
        process.on('SIGINT', () => void shutdown('SIGINT'));
        process.on('SIGTERM', () => void shutdown('SIGTERM'));
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
