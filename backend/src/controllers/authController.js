const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/tokens");
const { isText, validEmail, validPassword } = require("../utils/validation");

const { pool } = require("../config/database");

// ============================================================
// GENERATE JWT TOKEN
// ============================================================

// ============================================================
// REGISTER
// ============================================================

const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validasi input kosong
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    // Validasi password
    if (!isText(name, 100) || !validEmail(email)) {
      return res.status(400).json({ success: false, message: "Nama atau format email tidak valid" });
    }

    if (!validPassword(password) || typeof confirmPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter dan maksimal 72 byte",
      });
    }

    // Validasi konfirmasi password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password tidak sama",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Cek email sudah digunakan atau belum
    const [existingUsers] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Register publik SELALU sebagai karyawan
    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        role,
        status
      )
      VALUES (?, ?, ?, 'karyawan', 'active')
      `,
      [name.trim(), normalizedEmail, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      data: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "karyawan",
      },
    });
  } catch (error) {
    console.error("Register error:", error.code || error.name);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan" });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validEmail(email) || typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        role,
        status
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif. Hubungi administrator.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================

const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        status,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Get me error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
};

// ============================================================
// CHANGE PASSWORD
// LOGIN USER
// ============================================================

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { current_password, new_password, confirm_password } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (typeof current_password !== "string" || !current_password ||
        typeof confirm_password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password lama, password baru, dan konfirmasi wajib diisi",
      });
    }

    if (!validPassword(new_password)) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter dan maksimal 72 byte",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password baru tidak sama",
      });
    }

    // ========================================================
    // GET CURRENT USER
    // ========================================================

    const [users] = await pool.query(
      `
        SELECT
          id,
          password,
          status
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Akun Anda sedang tidak aktif",
      });
    }

    // ========================================================
    // VERIFY OLD PASSWORD
    // ========================================================

    const passwordValid = await bcrypt.compare(current_password, user.password);

    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        message: "Password lama salah",
      });
    }

    // ========================================================
    // PREVENT SAME PASSWORD
    // ========================================================

    const samePassword = await bcrypt.compare(new_password, user.password);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Password baru tidak boleh sama dengan password lama",
      });
    }

    // ========================================================
    // HASH NEW PASSWORD
    // ========================================================

    const hashedPassword = await bcrypt.hash(new_password, 10);

    // ========================================================
    // UPDATE PASSWORD
    // ========================================================

    await pool.query(
      `
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [hashedPassword, userId],
    );

    return res.status(200).json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Change password error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengubah password",
    });
  }
};

const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!isText(name, 100) || !validEmail(email)) {
    return res.status(400).json({ success: false, message: "Nama atau format email tidak valid" });
  }
  try {
    await pool.query("UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name.trim(), email.trim().toLowerCase(), req.user.id]);
    const [users] = await pool.query(
      "SELECT id, name, email, password, role, status, created_at, updated_at FROM users WHERE id = ?",
      [req.user.id]);
    const token = generateToken(users[0]);
    const { password, ...profile } = users[0];
    return res.json({ success: true, message: "Profil berhasil diperbarui", data: profile, token });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan" });
    }
    console.error("Update profile error:", error.code || error.name);
    return res.status(500).json({ success: false, message: "Gagal memperbarui profil" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  updateProfile,
};
