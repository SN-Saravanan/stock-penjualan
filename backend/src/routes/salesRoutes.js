const express = require("express");

const {
  createSale,
  getAllSales: getSales,
  getSaleById,
  getMySales,
  getMySaleById,
} = require("../controllers/salesController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", require("../middleware/inputMiddleware").validateIdParam);

// ============================================================
// SALES HISTORY
// Admin + Karyawan
// ============================================================

router.get(
  "/",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getSales,
);

router.get("/my", authenticateToken, authorizeRole("karyawan"), getMySales);

router.get(
  "/my/:id",
  authenticateToken,
  authorizeRole("karyawan"),
  getMySaleById,
);

// ============================================================
// SALES DETAIL
// ============================================================

router.get(
  "/:id",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getSaleById,
);

// ============================================================
// CREATE SALE
// ============================================================

router.post(
  "/",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  createSale,
);

module.exports = router;
