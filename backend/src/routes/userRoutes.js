const express = require("express");

const {
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
} = require("../controllers/userController");

const {
  authenticateToken,
  authorizeRole,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.param("id", require("../middleware/inputMiddleware").validateIdParam);

// Semua endpoint hanya Admin
router.use(authenticateToken, authorizeRole("admin"));

router.get("/", getAllUsers);

router.post("/", createUser);

router.put("/:id", updateUser);

router.patch("/:id/status", updateUserStatus);

router.patch("/:id/reset-password", resetUserPassword);

router.delete("/:id", deleteUser);

module.exports = router;
