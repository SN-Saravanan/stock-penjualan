const { pool } = require("../config/database");
const { validId, validMoney, validCount, isText, optionalText } = require("../utils/validation");

// Harga beli = data modal/margin, hanya untuk admin
const hideCostForNonAdmin = (user, product) => {
  if (user?.role === "admin") {
    return product;
  }

  const { purchase_price, ...safeProduct } = product;

  return safeProduct;
};

// ============================================================
// GET ALL PRODUCTS
// ============================================================

const getAllProducts = async (req, res) => {
  try {
    const { search = "", category = "", stock_status = "" } = req.query;
    if ((category && !validId(category)) ||
        (stock_status && !["tersedia", "menipis", "habis"].includes(stock_status))) {
      return res.status(400).json({ success: false, message: "Filter produk tidak valid" });
    }

    let query = `
      SELECT
        p.id,
        p.code,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.purchase_price,
        p.selling_price,
        p.stock,
        p.minimum_stock,
        p.description,
        CASE
          WHEN p.stock = 0 THEN 'Habis'
          WHEN p.stock <= p.minimum_stock THEN 'Menipis'
          ELSE 'Tersedia'
        END AS stock_status,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE 1 = 1
    `;

    const params = [];

    if (search) {
      query += `
        AND (
          p.code LIKE ?
          OR p.name LIKE ?
        )
      `;

      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND p.category_id = ? `;
      params.push(category);
    }

    if (stock_status === "tersedia") {
      query += `
        AND p.stock > p.minimum_stock
      `;
    }

    if (stock_status === "menipis") {
      query += `
        AND p.stock > 0
        AND p.stock <= p.minimum_stock
      `;
    }

    if (stock_status === "habis") {
      query += `
        AND p.stock = 0
      `;
    }

    query += ` ORDER BY p.id DESC `;

    const [products] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diambil",
      total: products.length,
      data: products.map((product) => hideCostForNonAdmin(req.user, product)),
    });
  } catch (error) {
    console.error("Get products error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data produk",
    });
  }
};

// ============================================================
// GET PRODUCT BY ID
// ============================================================

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.purchase_price,
        p.selling_price,
        p.stock,
        p.minimum_stock,
        p.description,
        CASE
          WHEN p.stock = 0 THEN 'Habis'
          WHEN p.stock <= p.minimum_stock THEN 'Menipis'
          ELSE 'Tersedia'
        END AS stock_status,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: hideCostForNonAdmin(req.user, products[0]),
    });
  } catch (error) {
    console.error("Get product detail error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail produk",
    });
  }
};

// ============================================================
// CREATE PRODUCT
// ADMIN ONLY
// ============================================================

const createProduct = async (req, res) => {
  try {
    const {
      code,
      name,
      category_id,
      purchase_price,
      selling_price,
      stock = 0,
      minimum_stock = 5,
      description = null,
    } = req.body;

    if (
      !code ||
      !name ||
      category_id === undefined ||
      purchase_price === undefined ||
      selling_price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Kode, nama, kategori, harga beli, dan harga jual wajib diisi",
      });
    }

    if (
      !isText(code, 30) || !isText(name, 150) ||
      !validId(category_id) || !optionalText(description, 65535)
    ) {
      return res.status(400).json({
        success: false,
        message: "Kode dan nama produk harus berupa teks yang valid",
      });
    }

    if (!validMoney(purchase_price) || !validMoney(selling_price)) {
      return res.status(400).json({
        success: false,
        message: "Harga beli dan harga jual harus berupa angka tidak negatif",
      });
    }

    if (!validCount(stock) || !validCount(minimum_stock)) {
      return res.status(400).json({
        success: false,
        message:
          "Stok dan stok minimum harus berupa bilangan bulat tidak negatif",
      });
    }

    // Cek kode produk
    const [existingProduct] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE code = ?
      LIMIT 1
      `,
      [code.trim().toUpperCase()],
    );

    if (existingProduct.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan",
      });
    }

    // Cek kategori
    const [categories] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE id = ?
      LIMIT 1
      `,
      [category_id],
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO products
      (
        code,
        name,
        category_id,
        purchase_price,
        selling_price,
        stock,
        minimum_stock,
        description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code.trim().toUpperCase(),
        name.trim(),
        category_id,
        purchase_price,
        selling_price,
        stock,
        minimum_stock,
        description,
      ],
    );

    const [createdProduct] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.purchase_price,
        p.selling_price,
        p.stock,
        p.minimum_stock,
        p.description
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
      `,
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: createdProduct[0],
    });
  } catch (error) {
    console.error("Create product error:", error.code || error.name);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Produk gagal ditambahkan",
    });
  }
};

// ============================================================
// UPDATE PRODUCT
// ADMIN ONLY
// ============================================================

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      name,
      category_id,
      purchase_price,
      selling_price,
      minimum_stock,
      description,
    } = req.body;

    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    const currentProduct = products[0];

    if (
      (code !== undefined && !isText(code, 30)) ||
      (name !== undefined && !isText(name, 150)) ||
      (category_id !== undefined && !validId(category_id)) ||
      !optionalText(description, 65535)
    ) {
      return res.status(400).json({
        success: false,
        message: "Kode dan nama produk harus berupa teks yang valid",
      });
    }

    const newCode =
      code !== undefined ? code.trim().toUpperCase() : currentProduct.code;

    const newName = name !== undefined ? name.trim() : currentProduct.name;

    const newCategoryId =
      category_id !== undefined ? category_id : currentProduct.category_id;

    const newPurchasePrice =
      purchase_price !== undefined
        ? purchase_price
        : currentProduct.purchase_price;

    const newSellingPrice =
      selling_price !== undefined
        ? selling_price
        : currentProduct.selling_price;

    const newMinimumStock =
      minimum_stock !== undefined
        ? minimum_stock
        : currentProduct.minimum_stock;

    const newDescription =
      description !== undefined ? description : currentProduct.description;

    if (!validMoney(newPurchasePrice) || !validMoney(newSellingPrice)) {
      return res.status(400).json({
        success: false,
        message: "Harga beli dan harga jual harus berupa angka tidak negatif",
      });
    }

    if (
      !validCount(newMinimumStock)
    ) {
      return res.status(400).json({
        success: false,
        message: "Stok minimum harus berupa bilangan bulat tidak negatif",
      });
    }

    // Cek duplicate code
    const [duplicateCode] = await pool.query(
      `
      SELECT id
      FROM products
      WHERE code = ?
        AND id != ?
      LIMIT 1
      `,
      [newCode, id],
    );

    if (duplicateCode.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan produk lain",
      });
    }

    // Cek kategori
    const [categories] = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE id = ?
      LIMIT 1
      `,
      [newCategoryId],
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    await pool.query(
      `
      UPDATE products
      SET
        code = ?,
        name = ?,
        category_id = ?,
        purchase_price = ?,
        selling_price = ?,
        minimum_stock = ?,
        description = ?
      WHERE id = ?
      `,
      [
        newCode,
        newName,
        newCategoryId,
        newPurchasePrice,
        newSellingPrice,
        newMinimumStock,
        newDescription,
        id,
      ],
    );

    const [updatedProduct] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.purchase_price,
        p.selling_price,
        p.stock,
        p.minimum_stock,
        p.description
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = ?
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Produk berhasil diubah",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error("Update product error:", error.code || error.name);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Produk gagal diubah",
    });
  }
};

// ============================================================
// DELETE PRODUCT
// ADMIN ONLY
// ============================================================

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `
      SELECT id, code, name
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    await pool.query(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus",
      data: products[0],
    });
  } catch (error) {
    console.error("Delete product error:", error.code || error.name);

    // Produk sudah dipakai transaksi / stock movement
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message:
          "Produk tidak dapat dihapus karena sudah digunakan pada transaksi atau riwayat stok",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Produk gagal dihapus",
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
