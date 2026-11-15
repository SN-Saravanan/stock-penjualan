// Temporary QA server: real API + MySQL, all fixture writes rolled back on exit.
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { app } = require("../server");
const { pool } = require("../src/config/database");
let connection, server, timer;
const originalQuery = pool.query;
const originalGetConnection = pool.getConnection;
async function stop() {
  clearTimeout(timer);
  if (server) await new Promise((resolve) => server.close(resolve));
  pool.query = originalQuery;
  pool.getConnection = originalGetConnection;
  if (connection) { await connection.rollback(); connection.release(); connection = null; }
  await pool.end();
}
async function start() {
  if (process.env.NODE_ENV === "production") throw new Error("QA fixtures must not run in production");
  connection = await pool.getConnection();
  const [locks] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':virtualstore-qa'), 0) AS acquired");
  if (locks[0].acquired !== 1) throw new Error("Another QA session is active; run QA sessions sequentially");
  await connection.beginTransaction();
  const password = "Audit-Browser-Only!42";
  const hash = await bcrypt.hash(password, 10);
  const prefix = randomUUID().slice(0, 8);
  for (const role of ["admin", "karyawan"]) {
    const email = `audit-${role}-${prefix}@example.test`;
    await connection.query("INSERT INTO users (name,email,password,role,status) VALUES (?,?,?,?,'active')", ["Audit Browser", email, hash, role]);
    console.log(JSON.stringify({ fixture: role, email, password }));
  }
  const [category] = await connection.query("INSERT INTO categories (name) VALUES (?)", [`Audit-${prefix}`]);
  await connection.query("INSERT INTO products (code,name,category_id,purchase_price,selling_price,stock,minimum_stock) VALUES (?, 'Audit Browser Product', ?, 0, 12.35, 20, 0)", [`QA-${prefix}`, category.insertId]);
  pool.query = (...args) => connection.query(...args);
  pool.getConnection = async () => ({
    query: (...args) => connection.query(...args),
    beginTransaction: () => connection.query("SAVEPOINT browser_controller"),
    commit: () => connection.query("RELEASE SAVEPOINT browser_controller"),
    rollback: () => connection.query("ROLLBACK TO SAVEPOINT browser_controller"),
    release() {},
  });
  server = app.listen(3001, "127.0.0.1", () => console.log("AUDIT_BROWSER_READY port=3001; writes are uncommitted; auto rollback in 15 minutes"));
  timer = setTimeout(() => stop(), 15 * 60 * 1000);
}
process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
start().catch(async (error) => { console.error(error.code || error.name); await stop(); process.exitCode = 1; });
