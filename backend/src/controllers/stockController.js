const { pool } = require("../config/database");
const { validId, validCount, optionalText } = require("../utils/validation");

// ============================================================
// UPDATE STOCK
// Admin + Karyawan
// ============================================================

const updateStock = async (req, res) => {
  let connection;

  try {
    const { product_id, type, quantity, notes = null } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!validId(product_id) || !optionalText(notes, 255)) {
      return res.status(400).json({
        success: false,
        message: "Product ID, jenis update, dan jumlah wajib diisi",
      });
    }

    const allowedTypes = ["in", "out"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Jenis update harus 'in' untuk tambah stok atau 'out' untuk kurangi stok",
      });
    }

    const numericQuantity = Number(quantity);

    if (!validCount(quantity) || numericQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Jumlah stok harus berupa angka bulat lebih dari 0",
      });
    }

    // ========================================================
    // GET CONNECTION
    // ========================================================

    connection = await pool.getConnection();

    // Mulai transaction
    await connection.beginTransaction();

    // ========================================================
    // GET PRODUCT + LOCK ROW
    // ========================================================

    const [products] = await connection.query(
      `
      SELECT
        id,
        code,
        name,
        stock,
        minimum_stock
      FROM products
      WHERE id = ?
      FOR UPDATE
      `,
      [product_id],
    );

    if (products.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    const product = products[0];

    const stockBefore = Number(product.stock);

    let stockAfter;

    // ========================================================
    // TAMBAH STOK
    // ========================================================

    if (type === "in") {
      stockAfter = stockBefore + numericQuantity;
    }

    // ========================================================
    // KURANGI STOK
    // ========================================================

    if (type === "out") {
      if (numericQuantity > stockBefore) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi. Stok tersedia: ${stockBefore}`,
        });
      }

      stockAfter = stockBefore - numericQuantity;
    }

    // ========================================================
    // UPDATE PRODUCTS
    // ========================================================

    if (!validCount(stockAfter)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Jumlah stok melampaui batas" });
    }

    await connection.query(
      `
      UPDATE products
      SET stock = ?
      WHERE id = ?
      `,
      [stockAfter, product_id],
    );

    // ========================================================
    // INSERT STOCK MOVEMENT
    // ========================================================

    const [movementResult] = await connection.query(
      `
        INSERT INTO stock_movements
        (
          product_id,
          user_id,
          type,
          quantity,
          stock_before,
          stock_after,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      [
        product_id,
        req.user.id,
        type,
        numericQuantity,
        stockBefore,
        stockAfter,
        notes,
      ],
    );

    // Commit
    await connection.commit();

    // ========================================================
    // STOCK STATUS
    // ========================================================

    let stockStatus = "Tersedia";

    if (stockAfter === 0) {
      stockStatus = "Habis";
    } else if (stockAfter <= Number(product.minimum_stock)) {
      stockStatus = "Menipis";
    }

    return res.status(200).json({
      success: true,
      message:
        type === "in" ? "Stok berhasil ditambahkan" : "Stok berhasil dikurangi",

      data: {
        movement_id: movementResult.insertId,

        product: {
          id: product.id,
          code: product.code,
          name: product.name,
        },

        type,
        quantity: numericQuantity,

        stock_before: stockBefore,
        stock_after: stockAfter,

        stock_status: stockStatus,

        notes,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError.code || rollbackError.name);
      }
    }

    console.error("Update stock error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui stok",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ============================================================
// STOCK HISTORY
// ============================================================

const getStockHistory = async (req, res) => {
  try {
    const { product_id, type, limit = 100 } = req.query;
    if (product_id && !validId(product_id)) {
      return res.status(400).json({ success: false, message: "Product ID tidak valid" });
    }

    let query = `
      SELECT
        sm.id,
        sm.product_id,

        p.code AS product_code,
        p.name AS product_name,

        sm.user_id,
        u.name AS user_name,
        u.role AS user_role,

        sm.type,
        sm.quantity,
        sm.stock_before,
        sm.stock_after,
        sm.notes,
        sm.created_at

      FROM stock_movements sm

      INNER JOIN products p
        ON p.id = sm.product_id

      INNER JOIN users u
        ON u.id = sm.user_id

      WHERE 1 = 1
    `;

    const params = [];

    if (product_id) {
      query += `
        AND sm.product_id = ?
      `;

      params.push(product_id);
    }

    if (type) {
      if (!["in", "out", "sale", "adjustment"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Jenis stock movement tidak valid",
        });
      }

      query += `
        AND sm.type = ?
      `;

      params.push(type);
    }

    let numericLimit = Number(limit);

    if (!Number.isInteger(numericLimit) || numericLimit < 1) {
      numericLimit = 100;
    }

    if (numericLimit > 500) {
      numericLimit = 500;
    }

    query += `
      ORDER BY sm.id DESC
      LIMIT ?
    `;

    params.push(numericLimit);

    const [history] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: "Riwayat stok berhasil diambil",
      total: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get stock history error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat stok",
    });
  }
};

// ============================================================
// GET MY STOCK HISTORY
// ADMIN / KARYAWAN
// ============================================================

const getMyStockHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const { product_id, type } = req.query;
    if ((product_id && !validId(product_id)) ||
        (type && !["in", "out", "sale", "adjustment"].includes(type))) {
      return res.status(400).json({ success: false, message: "Filter riwayat stok tidak valid" });
    }

    let sql = `
      SELECT
        sm.id,
        sm.product_id,

        p.code AS product_code,
        p.name AS product_name,

        sm.user_id,

        u.name AS user_name,
        u.role AS user_role,

        sm.type,
        sm.quantity,
        sm.stock_before,
        sm.stock_after,
        sm.notes,
        sm.created_at

      FROM stock_movements sm

      INNER JOIN products p
        ON p.id = sm.product_id

      INNER JOIN users u
        ON u.id = sm.user_id

      WHERE sm.user_id = ?
    `;

    const params = [userId];

    if (product_id) {
      sql += `
        AND sm.product_id = ?
      `;

      params.push(product_id);
    }

    if (type) {
      sql += `
        AND sm.type = ?
      `;

      params.push(type);
    }

    sql += `
      ORDER BY
        sm.created_at DESC

      LIMIT 100
    `;

    const [history] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,

      message: "Riwayat stok Anda berhasil diambil",

      total: history.length,

      data: history,
    });
  } catch (error) {
    console.error("Get my stock history error:", error.code || error.name);

    return res.status(500).json({
      success: false,

      message: "Gagal mengambil riwayat stok Anda",
    });
  }
};

module.exports = {
  updateStock,
  getStockHistory,
  getMyStockHistory,
};
