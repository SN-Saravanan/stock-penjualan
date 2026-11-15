const express = require("express");

const {
  getAdminDashboard,
  getEmployeeDashboard,
} = require("../controllers/dashboardController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
  "/admin",
  authenticateToken,
  authorizeRole("admin"),
  getAdminDashboard,
);

// ============================================================
// EMPLOYEE DASHBOARD
// ============================================================

router.get(
  "/employee",
  authenticateToken,
  authorizeRole("karyawan"),
  getEmployeeDashboard,
);

module.exports = router;
