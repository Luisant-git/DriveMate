import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import driverAuthRoutes from "./routes/driver.auth.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mapsRoutes from "./routes/maps.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import bookingWorkflowRoutes from "./routes/booking.workflow.routes.js";
import downloadRoutes from "./routes/download.routes.js";
import packageRoutes from "./routes/package.routes.js";
import pricingPackageRoutes from "./routes/pricingPackage.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import serviceAreaRoutes from "./routes/serviceArea.routes.js";
import monthlyPricingRoutes from "./routes/monthly.pricing.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import leadSubscriptionRoutes from "./routes/leadSubscription.routes.js";
import leadPackageRoutes from "./routes/leadPackage.routes.js";
import distanceRoutes from "./routes/distance.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PgSession = connectPgSimple(session);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'drivemate-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000
  }
}));

app.get("/api", (req, res) => res.json({ status: "ok", message: "DriveMate API is running" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "DriveMate API Documentation"
}));

app.use("/api/auth", authRoutes);
app.use("/api/driver/auth", driverAuthRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/booking-workflow", bookingWorkflowRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/pricing-packages", pricingPackageRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/service-areas", serviceAreaRoutes);
app.use("/api/monthly-pricing", monthlyPricingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/lead-subscriptions", leadSubscriptionRoutes);
app.use("/api/lead-packages", leadPackageRoutes);
app.use("/api/distance", distanceRoutes);

export default app;
