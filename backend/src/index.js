// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import morgan from "morgan";
// import { connectDB } from "./config/db.js";

// import authRoutes from "./routes/auth.js";
// import propertyRoutes from "./routes/properties.js";
// import unitRoutes from "./routes/units.js";
// import tenantRoutes from "./routes/tenants.js";
// import leaseRoutes from "./routes/leases.js";
// import invoiceRoutes from "./routes/invoices.js";
// import expenseRoutes from "./routes/expenses.js";
// import maintenanceRoutes from "./routes/maintenance.js";
// import messageRoutes from "./routes/messages.js";
// import ownerRoutes from "./routes/owners.js";
// import vendorRoutes from "./routes/vendors.js";
// import documentRoutes from "./routes/documents.js";
// import paymentRoutes from "./routes/payments.js";
// import notificationRoutes from "./routes/notifications.js";
// import announcementRoutes from "./routes/announcements.js";
// import auditRoutes from "./routes/audit.js";
// import storeRoutes from "./routes/store.js";

// const PORT = process.env.PORT || 5000;
// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/housing_system";

// if (!process.env.JWT_SECRET) {
//   console.warn("⚠  JWT_SECRET not set – using insecure default. Set it in .env for production.");
//   process.env.JWT_SECRET = "dev-only-insecure-secret-change-me";
// }

// await connectDB(MONGODB_URI);

// const app = express();

// app.use(cors({ origin: true, credentials: true }));
// app.use(express.json({ limit: "15mb" })); // photoDataUrls can be large
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// app.get("/api/health", (_req, res) => {
//   res.json({ ok: true, service: "housing-system-api", time: new Date().toISOString() });
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/properties", propertyRoutes);
// app.use("/api/units", unitRoutes);
// app.use("/api/tenants", tenantRoutes);
// app.use("/api/leases", leaseRoutes);
// app.use("/api/invoices", invoiceRoutes);
// app.use("/api/expenses", expenseRoutes);
// app.use("/api/maintenance", maintenanceRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/owners", ownerRoutes);
// app.use("/api/vendors", vendorRoutes);
// app.use("/api/documents", documentRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/announcements", announcementRoutes);
// app.use("/api/audit", auditRoutes);
// app.use("/api/store", storeRoutes);

// // 404
// app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// // Error handler
// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(err.status || 500).json({ error: err.message || "Internal server error" });
// });

// app.listen(PORT, () => {
//   console.log(`Housing System API listening on http://localhost:${PORT}`);
// });




















import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

// ... keep all your route imports ...

import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import unitRoutes from "./routes/units.js";
import tenantRoutes from "./routes/tenants.js";
import leaseRoutes from "./routes/leases.js";
import invoiceRoutes from "./routes/invoices.js";
import expenseRoutes from "./routes/expenses.js";
import maintenanceRoutes from "./routes/maintenance.js";
import messageRoutes from "./routes/messages.js";
import ownerRoutes from "./routes/owners.js";
import vendorRoutes from "./routes/vendors.js";
import documentRoutes from "./routes/documents.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import announcementRoutes from "./routes/announcements.js";
import auditRoutes from "./routes/audit.js";
import storeRoutes from "./routes/store.js";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/housing_system";

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET not set – using insecure default.");
  process.env.JWT_SECRET = "dev-only-insecure-secret-change-me";
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "housing-system-api", time: new Date().toISOString() });
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/store", storeRoutes);

// 404 & Error handlers
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// Boot sequence: start server first, or log DB error explicitly
const startServer = async () => {
  try {
    await connectDB(MONGODB_URI);
    console.log("✅ MongoDB Connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Housing System API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();