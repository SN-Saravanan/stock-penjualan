const { pool } = require("../config/database");
const { validId, validCount, validMoney } = require("../utils/validation");

// ============================================================
// GENERATE INVOICE NUMBER
// Format: TRX-20261113-0001
// ============================================================

const generateInvoiceNumber = async (connection) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const datePart = `${year}${month}${day}`;
  const prefix = `TRX-${datePart}-`;

  const [rows] = await connection.query(
    `
    SELECT invoice_number
    FROM sales
    WHERE invoice_number LIKE ?
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
    `,
    [`${prefix}%`],
  );

  let nextNumber = 1;

  if (rows.length > 0) {
    const lastInvoice = rows[0].invoice_number;

    const lastSequence = Number(lastInvoice.split("-").pop());

    nextNumber = lastSequence + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// ============================================================
// ERROR BISNIS (status HTTP ikut dibawa)
// ============================================================

class SaleError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = "SaleError";
    this.status = status;
  }
}

// Error DB yang aman untuk diulang (nomor invoice bentrok / deadlock)
const isRetryableError = (error) =>
  error.code === "ER_DUP_ENTRY" || error.code === "ER_LOCK_DEADLOCK";

const MAX_SALE_ATTEMPTS = 3;

// ============================================================
// SATU PERCOBAAN TRANSAKSI PENJUALAN
// ============================================================

const runSaleTransaction = async (user, normalizedItems) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const invoiceNumber = await generateInvoiceNumber(connection);

    const [saleResult] = await connection.query(
      `
      INSERT INTO sales
      (
        invoice_number,
        user_id,
        total_amount,
        status
      )
      VALUES (?, ?, 0, 'completed')
      `,
      [invoiceNumber, user.id],
    );

    const saleId = saleResult.insertId;

    let totalCents = 0;

    const saleItemsResponse = [];

    for (const item of normalizedItems) {
      const { product_id, quantity } = item;

      // Lock baris produk
      const [products] = await connection.query(
        `
        SELECT
          id,
          code,
          name,
          selling_price,
          stock,
          minimum_stock
        FROM products
        WHERE id = ?
        FOR UPDATE
        `,
        [product_id],
      );

      if (products.length === 0) {
        throw new SaleError(`Produk dengan ID ${product_id} tidak ditemukan`);
      }

      const product = products[0];

      const stockBefore = Number(product.stock);

      if (quantity > stockBefore) {
        throw new SaleError(
          `Stok ${product.name} tidak mencukupi. Stok tersedia: ${stockBefore}`,
        );
      }

      const price = Number(product.selling_price);

      const subtotalCents = Math.round(price * 100) * quantity;
      const subtotal = subtotalCents / 100;

      const stockAfter = stockBefore - quantity;

      totalCents += subtotalCents;
      if (!Number.isSafeInteger(totalCents) || !validMoney(subtotal) ||
          totalCents > 999999999999999) {
        throw new SaleError("Total transaksi melampaui batas nominal");
      }

      await connection.query(
        `
        INSERT INTO sale_items
        (
          sale_id,
          product_id,
          quantity,
          price,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [saleId, product_id, quantity, price, subtotal],
      );

      await connection.query(
        `
        UPDATE products
        SET stock = ?
        WHERE id = ?
        `,
        [stockAfter, product_id],
      );

      await connection.query(
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
        VALUES (?, ?, 'sale', ?, ?, ?, ?)
        `,
        [
          product_id,
          user.id,
          quantity,
          stockBefore,
          stockAfter,
          `Penjualan ${invoiceNumber}`,
        ],
      );

      saleItemsResponse.push({
        product_id: product.id,
        code: product.code,
        name: product.name,
        quantity,
        price,
        subtotal,
        stock_before: stockBefore,
        stock_after: stockAfter,
      });
    }

    await connection.query(
      `
      UPDATE sales
      SET total_amount = ?
      WHERE id = ?
      `,
      [totalCents / 100, saleId],
    );

    await connection.commit();

    return {
      sale_id: saleId,
      invoice_number: invoiceNumber,
      cashier: {
        id: user.id,
        role: user.role,
      },
      items: saleItemsResponse,
      total_amount: totalCents / 100,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Rollback sale error:", rollbackError.code || rollbackError.name);
    }

    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// CREATE SALE
// Admin + Karyawan
// ============================================================

const createSale = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal satu produk harus dipilih",
      });
    }

    // Gabungkan jika product_id yang sama dikirim beberapa kali
    const normalizedItemsMap = new Map();

    for (const item of items) {
      const productId = Number(item?.product_id);
      const quantity = Number(item?.quantity);

      if (
        !validId(item?.product_id) ||
        !validCount(item?.quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID dan quantity harus berupa angka bulat lebih dari 0",
        });
      }

      normalizedItemsMap.set(
        productId,
        (normalizedItemsMap.get(productId) || 0) + quantity,
      );
      if (!validCount(normalizedItemsMap.get(productId))) {
        return res.status(400).json({ success: false, message: "Jumlah produk melampaui batas" });
      }
    }

    // Urutkan product ID untuk mengurangi risiko deadlock
    const normalizedItems = Array.from(normalizedItemsMap.entries())
      .map(([product_id, quantity]) => ({ product_id, quantity }))
      .sort((a, b) => a.product_id - b.product_id);

    let lastError;

    for (let attempt = 1; attempt <= MAX_SALE_ATTEMPTS; attempt++) {
      try {
        const data = await runSaleTransaction(req.user, normalizedItems);

        return res.status(201).json({
          success: true,
          message: "Transaksi penjualan berhasil",
          data,
        });
      } catch (error) {
        lastError = error;

        if (isRetryableError(error) && attempt < MAX_SALE_ATTEMPTS) {
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  } catch (error) {
    if (error instanceof SaleError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create sale error:", error.code || error.name);

    if (isRetryableError(error)) {
      return res.status(409).json({
        success: false,
        message: "Server sedang sibuk memproses transaksi. Silakan ulangi.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memproses transaksi",
    });
  }
};

// ============================================================
// GET SALES
// Admin = semua transaksi
// Karyawan = transaksi sendiri
// ============================================================

const getSales = async (req, res) => {
  try {
    let query = `
      SELECT
        s.id,
        s.invoice_number,

        s.user_id,
        u.name AS cashier_name,
        u.role AS cashier_role,

        s.total_amount,
        s.status,

        COALESCE(
          SUM(si.quantity),
          0
        ) AS total_items,

        s.created_at,
        s.updated_at

      FROM sales s

      INNER JOIN users u
        ON u.id = s.user_id

      LEFT JOIN sale_items si
        ON si.sale_id = s.id
    `;

    const params = [];

    if (req.user.role === "karyawan") {
      query += `
        WHERE s.user_id = ?
      `;

      params.push(req.user.id);
    }

    query += `
      GROUP BY
        s.id,
        s.invoice_number,
        s.user_id,
        u.name,
        u.role,
        s.total_amount,
        s.status,
        s.created_at,
        s.updated_at

      ORDER BY s.id DESC
    `;

    const [sales] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: "Riwayat penjualan berhasil diambil",
      total: sales.length,
      data: sales,
    });
  } catch (error) {
    console.error("Get sales error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat penjualan",
    });
  }
};

// ============================================================
// GET SALE DETAIL
// ============================================================

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    // ========================================================
    // SALES HEADER
    // ========================================================

    const [sales] = await pool.query(
      `
      SELECT
        s.id,
        s.invoice_number,

        s.user_id,
        u.name AS cashier_name,
        u.email AS cashier_email,
        u.role AS cashier_role,

        s.total_amount,
        s.status,

        s.created_at,
        s.updated_at

      FROM sales s

      INNER JOIN users u
        ON u.id = s.user_id

      WHERE s.id = ?

      LIMIT 1
      `,
      [id],
    );

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    const sale = sales[0];

    // Karyawan hanya boleh melihat transaksi miliknya
    if (
      req.user.role === "karyawan" &&
      Number(sale.user_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki izin melihat transaksi ini",
      });
    }

    // ========================================================
    // SALE ITEMS
    // ========================================================

    const [items] = await pool.query(
      `
      SELECT
        si.id,
        si.product_id,

        p.code AS product_code,
        p.name AS product_name,

        si.quantity,
        si.price,
        si.subtotal

      FROM sale_items si

      INNER JOIN products p
        ON p.id = si.product_id

      WHERE si.sale_id = ?

      ORDER BY si.id ASC
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      data: {
        ...sale,
        items,
      },
    });
  } catch (error) {
    console.error("Get sale detail error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail transaksi",
    });
  }
};

// ============================================================
// GET MY SALES
// KARYAWAN
// ============================================================

const getMySales = async (req, res) => {
  try {
    const userId = req.user.id;

    const [sales] = await pool.query(
      `
      SELECT
        s.id,
        s.invoice_number,
        s.user_id,

        u.name AS cashier_name,
        u.role AS cashier_role,

        COALESCE(
          SUM(si.quantity),
          0
        ) AS total_items,

        s.total_amount,
        s.status,
        s.created_at

      FROM sales s

      INNER JOIN users u
        ON u.id = s.user_id

      LEFT JOIN sale_items si
        ON si.sale_id = s.id

      WHERE s.user_id = ?

      GROUP BY
        s.id,
        s.invoice_number,
        s.user_id,
        u.name,
        u.role,
        s.total_amount,
        s.status,
        s.created_at

      ORDER BY
        s.created_at DESC

      LIMIT 100
      `,
      [userId],
    );

    return res.status(200).json({
      success: true,

      message: "Riwayat transaksi Anda berhasil diambil",

      total: sales.length,

      data: sales,
    });
  } catch (error) {
    console.error("Get my sales error:", error.code || error.name);

    return res.status(500).json({
      success: false,

      message: "Gagal mengambil riwayat transaksi Anda",
    });
  }
};

// ============================================================
// GET MY SALE DETAIL
// KARYAWAN
// ============================================================

const getMySaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user.id;

    // ========================================================
    // TRANSACTION HEADER
    // ========================================================

    const [sales] = await pool.query(
      `
      SELECT
        s.id,
        s.invoice_number,
        s.user_id,

        u.name AS cashier_name,
        u.role AS cashier_role,

        s.total_amount,
        s.status,
        s.created_at

      FROM sales s

      INNER JOIN users u
        ON u.id = s.user_id

      WHERE s.id = ?
        AND s.user_id = ?

      LIMIT 1
      `,
      [id, userId],
    );

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,

        message: "Transaksi tidak ditemukan atau bukan milik akun Anda",
      });
    }

    // ========================================================
    // ITEMS
    // ========================================================

    const [items] = await pool.query(
      `
      SELECT
        si.id,
        si.product_id,

        p.code AS product_code,
        p.name AS product_name,

        si.quantity,
        si.price,
        si.subtotal

      FROM sale_items si

      INNER JOIN products p
        ON p.id = si.product_id

      WHERE si.sale_id = ?

      ORDER BY
        si.id ASC
      `,
      [id],
    );

    return res.status(200).json({
      success: true,

      message: "Detail transaksi berhasil diambil",

      data: {
        ...sales[0],
        items,
      },
    });
  } catch (error) {
    console.error("Get my sale detail error:", error.code || error.name);

    return res.status(500).json({
      success: false,

      message: "Gagal mengambil detail transaksi",
    });
  }
};

module.exports = {
  createSale,
  getAllSales: getSales,
  getSaleById,
  getMySales,
  getMySaleById,
};
