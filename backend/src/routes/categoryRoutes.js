const express = require("express");

const { getAllCategories } = require("../controllers/categoryController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getAllCategories,
);

module.exports = router;
