const jwt = require("jsonwebtoken");
const { credentialVersion } = require("../utils/tokens");
const { validId } = require("../utils/validation");

const { pool } = require("../config/database");

// ============================================================
// AUTHENTICATE TOKEN
// Verifikasi JWT, lalu cek ulang status & role user di database
// supaya akun yang dinonaktifkan / dihapus / diubah role-nya
// langsung kehilangan akses (tidak menunggu token kedaluwarsa).
// ============================================================

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({
        success: false,
        message: "Format token tidak valid",
      });
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!validId(decoded.id)) {
      return res.status(401).json({ success: false, message: "Token tidak valid" });
    }

    const [users] = await pool.query(
      `
      SELECT id, email, password, role, status, UNIX_TIMESTAMP(updated_at) AS updated_at_unix
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id],
    );

    if (users.length === 0 || users[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Akun tidak aktif atau tidak ditemukan",
      });
    }

    if (
      decoded.credentialVersion !== credentialVersion(users[0].password) ||
      (decoded.iat && users[0].updated_at_unix &&
       decoded.iat < Number(users[0].updated_at_unix))
    ) {
      return res.status(401).json({
        success: false,
        message: "Sesi sudah tidak berlaku. Silakan login kembali.",
      });
    }

    // Pakai data dari database, bukan dari isi token
    req.user = {
      id: users[0].id,
      email: users[0].email,
      role: users[0].role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token sudah kedaluwarsa",
      });
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    console.error("Authenticate token error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal memverifikasi sesi",
    });
  }
};

// ============================================================
// AUTHORIZE ROLE
// ============================================================

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Belum terautentikasi",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki izin mengakses resource ini",
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
