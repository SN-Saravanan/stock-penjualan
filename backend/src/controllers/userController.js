const bcrypt = require("bcryptjs");
const { isText, validEmail, validPassword } = require("../utils/validation");

const { pool } = require("../config/database");

// ============================================================
// GET ALL USERS
// ADMIN ONLY
// ============================================================

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        u.updated_at,

        (
          SELECT COUNT(*)
          FROM sales s
          WHERE s.user_id = u.id
        ) AS sales_count,

        (
          SELECT COUNT(*)
          FROM stock_movements sm
          WHERE sm.user_id = u.id
        ) AS stock_activity_count

      FROM users u

      ORDER BY
        CASE
          WHEN u.role = 'admin'
          THEN 0
          ELSE 1
        END,
        u.name ASC
    `);

    return res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      total: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
    });
  }
};

// ============================================================
// CREATE USER
// ADMIN ONLY
// ============================================================

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role = "karyawan",
      status = "active",
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!isText(name, 100) || !validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password tidak sama",
      });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter dan maksimal 72 byte",
      });
    }

    if (!["admin", "karyawan"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ========================================================
    // CHECK EMAIL
    // ========================================================

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

    // ========================================================
    // HASH PASSWORD
    // ========================================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ========================================================
    // INSERT
    // ========================================================

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
      VALUES (?, ?, ?, ?, ?)
      `,
      [name.trim(), normalizedEmail, hashedPassword, role, status],
    );

    const [createdUsers] = await pool.query(
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
      `,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: "User berhasil ditambahkan",
      data: createdUsers[0],
    });
  } catch (error) {
    console.error("Create user error:", error.code || error.name);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan" });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan user",
    });
  }
};

// ============================================================
// UPDATE USER
// ADMIN ONLY
// ============================================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        status
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const currentUser = users[0];

    const { name, email, role, status } = req.body;

    if ((name !== undefined && !isText(name, 100)) ||
        (email !== undefined && !validEmail(email))) {
      return res.status(400).json({ success: false, message: "Nama atau format email tidak valid" });
    }

    const newName = name !== undefined ? name.trim() : currentUser.name;

    const newEmail =
      email !== undefined ? email.trim().toLowerCase() : currentUser.email;

    const newRole = role !== undefined ? role : currentUser.role;

    const newStatus = status !== undefined ? status : currentUser.status;

    if (!newName || !newEmail) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi",
      });
    }

    if (!["admin", "karyawan"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid",
      });
    }

    if (!["active", "inactive"].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
    }

    const isSelf = Number(id) === Number(req.user.id);

    // ========================================================
    // SELF PROTECTION
    // ========================================================

    if (isSelf && newRole !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat mengubah role akun sendiri dari Admin",
      });
    }

    if (isSelf && newStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menonaktifkan akun sendiri",
      });
    }

    // ========================================================
    // CHECK DUPLICATE EMAIL
    // ========================================================

    const [duplicateUsers] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
        AND id != ?
      LIMIT 1
      `,
      [newEmail, id],
    );

    if (duplicateUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan user lain",
      });
    }

    // ========================================================
    // UPDATE
    // ========================================================

    await pool.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        role = ?,
        status = ?
      WHERE id = ?
      `,
      [newName, newEmail, newRole, newStatus, id],
    );

    const [updatedUsers] = await pool.query(
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
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil diperbarui",
      data: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update user error:", error.code || error.name);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan" });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui user",
    });
  }
};

// ============================================================
// UPDATE STATUS
// ============================================================

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
    }

    const [users] = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          role,
          status
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    if (Number(id) === Number(req.user.id) && status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menonaktifkan akun sendiri",
      });
    }

    await pool.query(
      `
        UPDATE users
        SET status = ?
        WHERE id = ?
        `,
      [status, id],
    );

    return res.status(200).json({
      success: true,
      message:
        status === "active"
          ? "User berhasil diaktifkan"
          : "User berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("Update status error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengubah status user",
    });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password baru dan konfirmasi wajib diisi",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password tidak sama",
      });
    }

    if (!validPassword(new_password)) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter dan maksimal 72 byte",
      });
    }

    const [users] = await pool.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      `
        UPDATE users
        SET password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
      [hashedPassword, id],
    );

    return res.status(200).json({
      success: true,
      message: "Password berhasil direset",
    });
  } catch (error) {
    console.error("Reset password error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mereset password",
    });
  }
};

// ============================================================
// DELETE USER
// ============================================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menghapus akun sendiri",
      });
    }

    const [users] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    await pool.query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
      data: users[0],
    });
  } catch (error) {
    console.error("Delete user error:", error.code || error.name);

    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message:
          "User tidak dapat dihapus karena sudah memiliki transaksi atau riwayat stok. Nonaktifkan akun sebagai gantinya.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal menghapus user",
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
};
