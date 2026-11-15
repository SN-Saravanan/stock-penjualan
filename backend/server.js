const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { rateLimit } = require("express-rate-limit");

dotenv.config({ path: require("node:path").join(__dirname, ".env"), quiet: true });

const { pool, testDatabaseConnection } = require("./src/config/database");

const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const authRoutes = require("./src/routes/authRoutes");
const stockRoutes = require("./src/routes/stockRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const reportsRoutes = require("./src/routes/reportsRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();
app.disable("x-powered-by");

const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== "production";
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    ...(isDevelopment
      ? ["http://localhost:5173", "http://127.0.0.1:5173"]
      : []),
  ].filter(Boolean),
);
const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (variable) => !process.env[variable],
);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin tidak diizinkan oleh kebijakan CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express 5: req.body = undefined jika request tanpa body.
// Beri default {} agar controller tidak crash (500) saat destructuring.
app.use((req, res, next) => {
  if (req.body === undefined) {
    req.body = {};
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
      Object.values(req.query).some((value) => typeof value !== "string")) {
    return res.status(400).json({ success: false, message: "Format input tidak valid" });
  }

  next();
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Terlalu banyak percobaan. Coba kembali nanti." },
}), authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/users", userRoutes);
// ============================================================
// ROOT ROUTE
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Selamat datang di API Sistem Stok Penjualan",
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "API Sistem Stok Penjualan berjalan",
      server: "running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check database error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server berjalan tetapi database tidak terhubung",
      server: "running",
      database: "disconnected",
    });
  }
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// (JSON rusak, body terlalu besar, error tak terduga)
// ============================================================

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.status === 403) {
    return res.status(403).json({ success: false, message: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Format JSON tidak valid",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Data yang dikirim terlalu besar",
    });
  }

  console.error("Unhandled error:", err.code || err.name);

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server",
  });
});

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  if (missingEnvironmentVariables.length > 0) {
    console.error(
      `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`,
    );
    process.exit(1);
  }
  if (!isDevelopment && (
    process.env.JWT_SECRET.length < 32 ||
    /replace|generate-a-long|your[_-]?secret/i.test(process.env.JWT_SECRET) ||
    !process.env.CLIENT_URL
  )) {
    console.error("Production requires a random JWT_SECRET (at least 32 characters) and CLIENT_URL");
    await pool.end();
    process.exitCode = 1;
    return;
  }

  console.log("======================================");
  console.log(" SISTEM STOK PENJUALAN - BACKEND API");
  console.log("======================================");

  const databaseConnected = await testDatabaseConnection();

  if (!databaseConnected) {
    console.error("--------------------------------------");
    console.error("Server tidak dijalankan.");
    console.error("Periksa konfigurasi database di .env");
    console.error("--------------------------------------");

    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log("--------------------------------------");
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log("======================================");
  });
  server.on("error", (error) => {
    console.error("Server gagal dijalankan:", error.code);
    process.exitCode = 1;
    pool.end();
  });
  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Startup gagal:", error.code || error.name);
    process.exitCode = 1;
    pool.end();
  });
}

module.exports = { app, startServer };
