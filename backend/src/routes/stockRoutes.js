const express = require("express");

const {
  updateStock,
  getStockHistory,
  getMyStockHistory,
} = require("../controllers/stockController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// GET STOCK HISTORY
// Admin
// ============================================================

router.get(
  "/history",
  authenticateToken,
  authorizeRole("admin"),
  getStockHistory,
);

// ============================================================
// GET MY STOCK HISTORY
// Admin + Karyawan
// ============================================================

router.get(
  "/my-history",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getMyStockHistory,
);
// ============================================================
// UPDATE STOCK
// Admin + Karyawan
// ============================================================

router.post(
  "/update",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  updateStock,
);

module.exports = router;
