require("dotenv").config();

const bcrypt = require("bcryptjs");
const { isText, validEmail, validPassword } = require("./validation");
const { pool } = require("../config/database");

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured",
      );
    }

    if (!isText(name, 100) || !validEmail(email) || !validPassword(password)) {
      throw new Error("Invalid admin input: password must be 8 characters to 72 bytes");
    }

    // Cek apakah admin sudah ada
    const [existingUsers] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email],
    );

    if (existingUsers.length > 0) {
      console.log("Admin sudah tersedia.");
      process.exit(0);
    }

    // Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan admin ke database
    await pool.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        role,
        status
      )
      VALUES (?, ?, ?, 'admin', 'active')
      `,
      [name, email, hashedPassword],
    );

    console.log("======================================");
    console.log("ADMIN BERHASIL DIBUAT");
    console.log("======================================");
    console.log(`Nama  : ${name}`);
    console.log(`Email : ${email}`);
    console.log("Role  : admin");
    console.log("Status: active");
    console.log("======================================");

    process.exit(0);
  } catch (error) {
    console.error("Gagal membuat admin:");
    console.error(error.message);
    process.exit(1);
  }
};

createAdmin();
