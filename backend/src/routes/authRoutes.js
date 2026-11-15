const express = require("express");

const {
  register,
  login,
  getMe,
  changePassword,
  updateProfile,
} = require("../controllers/authController");

const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Route
router.get("/me", authenticateToken, getMe);
router.patch("/change-password", authenticateToken, changePassword);
router.patch("/profile", authenticateToken, updateProfile);
module.exports = router;
