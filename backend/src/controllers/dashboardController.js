const { pool } = require("../config/database");

// ============================================================
// HELPER FORMAT DATE YYYY-MM-DD
// ============================================================

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// BUILD 7 DAY SALES CHART
// ============================================================

const buildSevenDayChart = (rows) => {
  const salesMap = new Map();

  rows.forEach((row) => {
    const key =
      row.sale_date instanceof Date
        ? formatDateKey(row.sale_date)
        : String(row.sale_date);

    salesMap.set(key, Number(row.total_sales || 0));
  });

  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = formatDateKey(date);

    result.push({
      date: key,
      total_sales: salesMap.get(key) || 0,
    });
  }

  return result;
};

// ============================================================
// ADMIN DASHBOARD
// ADMIN ONLY
// ============================================================

const getAdminDashboard = async (req, res) => {
  try {
    // ========================================================
    // TOTAL PRODUCTS
    // ========================================================

    const [productResult] = await pool.query(
      `
      SELECT COUNT(*) AS total_products
      FROM products
      `,
    );

    // ========================================================
    // LOW STOCK
    // stock > 0 dan stock <= minimum_stock
    // ========================================================

    const [lowStockResult] = await pool.query(
      `
      SELECT COUNT(*) AS low_stock
      FROM products
      WHERE stock > 0
        AND stock <= minimum_stock
      `,
    );

    // ========================================================
    // OUT OF STOCK
    // ========================================================

    const [outOfStockResult] = await pool.query(
      `
      SELECT COUNT(*) AS out_of_stock
      FROM products
      WHERE stock = 0
      `,
    );

    // ========================================================
    // TODAY SALES
    // ========================================================

    const [todaySalesResult] = await pool.query(
      `
      SELECT
        COUNT(*) AS today_transactions,
        COALESCE(
          SUM(total_amount),
          0
        ) AS today_revenue
      FROM sales
      WHERE status = 'completed'
        AND DATE(created_at) = CURDATE()
      `,
    );

    // ========================================================
    // TOTAL EMPLOYEES
    // ========================================================

    const [employeeResult] = await pool.query(
      `
      SELECT COUNT(*) AS total_employees
      FROM users
      WHERE role = 'karyawan'
        AND status = 'active'
      `,
    );

    // ========================================================
    // TOTAL TRANSACTIONS + ALL REVENUE
    // ========================================================

    const [transactionResult] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_transactions,
        COALESCE(
          SUM(total_amount),
          0
        ) AS total_revenue
      FROM sales
      WHERE status = 'completed'
      `,
    );

    // ========================================================
    // SALES LAST 7 DAYS
    // ========================================================

    const [sevenDayRows] = await pool.query(
      `
      SELECT
        DATE(created_at) AS sale_date,
        COALESCE(
          SUM(total_amount),
          0
        ) AS total_sales
      FROM sales
      WHERE status = 'completed'
        AND created_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
      `,
    );

    const sevenDayChart = buildSevenDayChart(sevenDayRows);

    // ========================================================
    // SEVEN DAY TOTAL
    // ========================================================

    const sevenDayRevenue = sevenDayChart.reduce(
      (total, item) => total + Number(item.total_sales),
      0,
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

        SUM(si.quantity) AS quantity_sold,

        SUM(si.subtotal) AS revenue

      FROM sale_items si

      INNER JOIN sales s
        ON s.id = si.sale_id

      INNER JOIN products p
        ON p.id = si.product_id

      WHERE s.status = 'completed'

      GROUP BY
        p.id,
        p.code,
        p.name

      ORDER BY quantity_sold DESC

      LIMIT 5
      `,
    );

    // ========================================================
    // LOW STOCK PRODUCT LIST
    // ========================================================

    const [lowStockProducts] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,
        p.stock,
        p.minimum_stock,

        c.name AS category_name,

        CASE
          WHEN p.stock = 0
            THEN 'Habis'

          WHEN p.stock <= p.minimum_stock
            THEN 'Menipis'

          ELSE 'Tersedia'
        END AS stock_status

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      WHERE p.stock <= p.minimum_stock

      ORDER BY
        p.stock ASC,
        p.name ASC

      LIMIT 10
      `,
    );

    // ========================================================
    // RECENT STOCK ACTIVITY
    // ========================================================

    const [recentStockActivities] = await pool.query(
      `
        SELECT
          sm.id,

          p.code AS product_code,
          p.name AS product_name,

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

        ORDER BY sm.id DESC

        LIMIT 10
        `,
    );

    // ========================================================
    // RECENT SALES
    // ========================================================

    const [recentSales] = await pool.query(
      `
      SELECT
        s.id,
        s.invoice_number,

        u.name AS cashier_name,

        s.total_amount,
        s.status,
        s.created_at

      FROM sales s

      INNER JOIN users u
        ON u.id = s.user_id

      ORDER BY s.id DESC

      LIMIT 5
      `,
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Dashboard admin berhasil diambil",

      data: {
        summary: {
          total_products: Number(productResult[0].total_products),

          low_stock: Number(lowStockResult[0].low_stock),

          out_of_stock: Number(outOfStockResult[0].out_of_stock),

          today_transactions: Number(todaySalesResult[0].today_transactions),

          today_revenue: Number(todaySalesResult[0].today_revenue),

          total_employees: Number(employeeResult[0].total_employees),

          total_transactions: Number(transactionResult[0].total_transactions),

          total_revenue: Number(transactionResult[0].total_revenue),

          seven_day_revenue: sevenDayRevenue,
        },

        sales_chart: sevenDayChart,

        top_products: topProducts,

        low_stock_products: lowStockProducts,

        recent_stock_activities: recentStockActivities,

        recent_sales: recentSales,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data dashboard admin",
    });
  }
};

// ============================================================
// EMPLOYEE / KARYAWAN DASHBOARD
// ============================================================

const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // ========================================================
    // TOTAL PRODUCTS
    // ========================================================

    const [productResult] = await pool.query(
      `
      SELECT COUNT(*) AS total_products
      FROM products
      `,
    );

    // ========================================================
    // LOW STOCK
    // ========================================================

    const [lowStockResult] = await pool.query(
      `
      SELECT COUNT(*) AS low_stock
      FROM products
      WHERE stock > 0
        AND stock <= minimum_stock
      `,
    );

    // ========================================================
    // OUT OF STOCK
    // ========================================================

    const [outOfStockResult] = await pool.query(
      `
      SELECT COUNT(*) AS out_of_stock
      FROM products
      WHERE stock = 0
      `,
    );

    // ========================================================
    // KARYAWAN SALES TODAY
    // ========================================================

    const [todaySalesResult] = await pool.query(
      `
        SELECT
          COUNT(*) AS today_transactions,

          COALESCE(
            SUM(total_amount),
            0
          ) AS today_revenue

        FROM sales

        WHERE user_id = ?
          AND status = 'completed'
          AND DATE(created_at) = CURDATE()
        `,
      [userId],
    );

    // ========================================================
    // TOTAL TRANSACTIONS BY KARYAWAN
    // ========================================================

    const [transactionResult] = await pool.query(
      `
        SELECT
          COUNT(*) AS total_transactions,

          COALESCE(
            SUM(total_amount),
            0
          ) AS total_revenue

        FROM sales

        WHERE user_id = ?
          AND status = 'completed'
        `,
      [userId],
    );

    // ========================================================
    // PRODUCT LIST
    // ========================================================

    const [products] = await pool.query(
      `
      SELECT
        p.id,
        p.code,
        p.name,

        c.name AS category_name,

        p.selling_price,
        p.stock,
        p.minimum_stock,

        CASE
          WHEN p.stock = 0
            THEN 'Habis'

          WHEN p.stock <= p.minimum_stock
            THEN 'Menipis'

          ELSE 'Tersedia'
        END AS stock_status

      FROM products p

      LEFT JOIN categories c
        ON c.id = p.category_id

      ORDER BY p.name ASC

      LIMIT 20
      `,
    );

    // ========================================================
    // RECENT OWN SALES
    // ========================================================

    const [recentSales] = await pool.query(
      `
      SELECT
        id,
        invoice_number,
        total_amount,
        status,
        created_at

      FROM sales

      WHERE user_id = ?

      ORDER BY id DESC

      LIMIT 5
      `,
      [userId],
    );

    // ========================================================
    // RECENT STOCK ACTIVITY BY USER
    // ========================================================

    const [recentStockActivities] = await pool.query(
      `
        SELECT
          sm.id,

          p.code AS product_code,
          p.name AS product_name,

          sm.type,
          sm.quantity,
          sm.stock_before,
          sm.stock_after,
          sm.notes,
          sm.created_at

        FROM stock_movements sm

        INNER JOIN products p
          ON p.id = sm.product_id

        WHERE sm.user_id = ?

        ORDER BY sm.id DESC

        LIMIT 5
        `,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard karyawan berhasil diambil",

      data: {
        user: {
          id: req.user.id,
          role: req.user.role,
        },

        summary: {
          total_products: Number(productResult[0].total_products),

          low_stock: Number(lowStockResult[0].low_stock),

          out_of_stock: Number(outOfStockResult[0].out_of_stock),

          today_transactions: Number(todaySalesResult[0].today_transactions),

          today_revenue: Number(todaySalesResult[0].today_revenue),

          total_transactions: Number(transactionResult[0].total_transactions),

          total_revenue: Number(transactionResult[0].total_revenue),
        },

        products,

        recent_sales: recentSales,

        recent_stock_activities: recentStockActivities,
      },
    });
  } catch (error) {
    console.error("Employee dashboard error:", error.code || error.name);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil dashboard karyawan",
    });
  }
};

module.exports = {
  getAdminDashboard,
  getEmployeeDashboard,
};
