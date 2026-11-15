const { pool } = require("../config/database");
const { validDate } = require("../utils/validation");

// ============================================================
// HELPER
// ============================================================

const formatSqlDate = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const endDate = new Date();

  const startDate = new Date();

  startDate.setDate(endDate.getDate() - 29);

  return {
    startDate: formatSqlDate(startDate),

    endDate: formatSqlDate(endDate),
  };
};

// ============================================================
// SALES REPORT
// ADMIN ONLY
// ============================================================

const getSalesReport = async (req, res) => {
  try {
    const defaultRange = getDefaultDateRange();

    const startDate = req.query.start_date || defaultRange.startDate;

    const endDate = req.query.end_date || defaultRange.endDate;

    // ========================================================
    // VALIDATION DATE
    // ========================================================

    if (!validDate(startDate) || !validDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Tanggal harus valid dengan format YYYY-MM-DD",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Tanggal awal tidak boleh melebihi tanggal akhir",
      });
    }

    // ========================================================
    // SUMMARY TRANSACTION
    // ========================================================

    const [transactionSummary] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_transactions,

        COALESCE(
          SUM(total_amount),
          0
        ) AS total_revenue,

        COALESCE(
          AVG(total_amount),
          0
        ) AS average_transaction

      FROM sales

      WHERE status = 'completed'
        AND DATE(created_at)
            BETWEEN ? AND ?
      `,
      [startDate, endDate],
    );

    // ========================================================
    // TOTAL ITEM SOLD
    // ========================================================

    const [itemSummary] = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(si.quantity),
          0
        ) AS total_items

      FROM sale_items si

      INNER JOIN sales s
        ON s.id = si.sale_id

      WHERE s.status = 'completed'
        AND DATE(s.created_at)
            BETWEEN ? AND ?
      `,
      [startDate, endDate],
    );

    // ========================================================
    // DAILY SALES CHART
    // ========================================================

    const [dailySales] = await pool.query(
      `
      SELECT
        DATE(created_at)
          AS sale_date,

        COUNT(*)
          AS total_transactions,

        COALESCE(
          SUM(total_amount),
          0
        ) AS total_revenue

      FROM sales

      WHERE status = 'completed'
        AND DATE(created_at)
            BETWEEN ? AND ?

      GROUP BY
        DATE(created_at)

      ORDER BY
        DATE(created_at) ASC
      `,
      [startDate, endDate],
    );

    // ========================================================
    // TOP PRODUCTS
    // ========================================================

    const [topProducts] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,

        SUM(si.quantity)
          AS quantity_sold,

        SUM(si.subtotal)
          AS revenue

      FROM sale_items si

      INNER JOIN sales s
        ON s.id = si.sale_id

      INNER JOIN products p
        ON p.id = si.product_id

      WHERE s.status = 'completed'
        AND DATE(s.created_at)
            BETWEEN ? AND ?

      GROUP BY
        p.id,
        p.code,
        p.name

      ORDER BY
        quantity_sold DESC,
        revenue DESC

      LIMIT 5
      `,
      [startDate, endDate],
    );

    // ========================================================
    // SALES TABLE
    // ========================================================

    const [sales] = await pool.query(
      `
      SELECT
        s.id,
        s.invoice_number,

        s.user_id,

        u.name
          AS cashier_name,

        u.role
          AS cashier_role,

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

      WHERE s.status = 'completed'
        AND DATE(s.created_at)
            BETWEEN ? AND ?

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
      `,
      [startDate, endDate],
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message: "Laporan penjualan berhasil diambil",

      data: {
        period: {
          start_date: startDate,

          end_date: endDate,
        },

        summary: {
          total_transactions: Number(transactionSummary[0].total_transactions),

          total_revenue: Number(transactionSummary[0].total_revenue),

          total_items: Number(itemSummary[0].total_items),

          average_transaction: Number(
            transactionSummary[0].average_transaction,
          ),
        },

        daily_sales: dailySales.map((row) => ({
          ...row,
          sale_date:
            row.sale_date instanceof Date
              ? formatSqlDate(row.sale_date)
              : String(row.sale_date),
        })),

        top_products: topProducts,

        sales,
      },
    });
  } catch (error) {
    console.error("Sales report error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil laporan penjualan",
    });
  }
};

module.exports = {
  getSalesReport,
};
