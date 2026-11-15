// Read-only diagnostics: never prints credentials or user records.
require("dotenv").config({ quiet: true });
const { pool } = require("../src/config/database");

async function inspect() {
  try {
    const [tables] = await pool.query(
      "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
    );
    console.log(JSON.stringify({ connected: true, tables }));
    for (const table of tables) {
      const [schema] = await pool.query("SHOW CREATE TABLE ??", [table.TABLE_NAME]);
      console.log(JSON.stringify(schema));
    }
    const [counts] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM sales) AS sales,
      (SELECT COUNT(*) FROM sale_items) AS sale_items,
      (SELECT COUNT(*) FROM stock_movements) AS stock_movements,
      (SELECT COUNT(*) FROM products WHERE stock < 0) AS negative_stock,
      (SELECT COUNT(*) FROM sales s WHERE ABS(s.total_amount -
        (SELECT COALESCE(SUM(si.subtotal), 0) FROM sale_items si WHERE si.sale_id = s.id)) > 0.005)
        AS inconsistent_sales_totals`);
    console.log(JSON.stringify({ counts }));
  } catch (error) {
    console.error(JSON.stringify({ connected: false, code: error.code }));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspect();
