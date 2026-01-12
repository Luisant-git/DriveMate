import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mapsRoutes from "./routes/maps.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'drivemate-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
  }
}));

app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);

export default app;
