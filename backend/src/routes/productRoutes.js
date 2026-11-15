const express = require("express");

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", require("../middleware/inputMiddleware").validateIdParam);

// ============================================================
// READ
// Admin + Karyawan
// ============================================================

router.get(
  "/",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getAllProducts,
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole("admin", "karyawan"),
  getProductById,
);

// ============================================================
// CREATE
// Admin Only
// ============================================================

router.post("/", authenticateToken, authorizeRole("admin"), createProduct);

// ============================================================
// UPDATE
// Admin Only
// ============================================================

router.put("/:id", authenticateToken, authorizeRole("admin"), updateProduct);

// ============================================================
// DELETE
// Admin Only
// ============================================================

router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteProduct);

module.exports = router;
