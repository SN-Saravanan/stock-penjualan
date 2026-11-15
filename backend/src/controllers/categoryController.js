const { pool } = require("../config/database");

// ============================================================
// GET ALL CATEGORIES
// ============================================================

const getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT
        id,
        name,
        description,
        created_at,
        updated_at
      FROM categories
      ORDER BY name ASC
    `);

    return res.status(200).json({
      success: true,
      message: "Data kategori berhasil diambil",
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori",
    });
  }
};

module.exports = {
  getAllCategories,
};
