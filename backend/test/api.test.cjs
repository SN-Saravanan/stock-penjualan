const { test, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { app } = require("../server");
const { pool } = require("../src/config/database");
const { generateToken } = require("../src/utils/tokens");

// Real Express + real MySQL. All writes use ONE uncommitted transaction.
// Controller transactions become savepoints; final cleanup always rolls back.
// InnoDB may still advance AUTO_INCREMENT counters after rollback.
let connection, server, baseURL, admin, employee, other, categoryId, productId;
const password = "Audit-Test-Password!42";
const originals = { query: pool.query, getConnection: pool.getConnection };

before(async () => {
  if (process.env.NODE_ENV === "production") throw new Error("QA fixtures must not run in production");
  connection = await pool.getConnection();
  const [locks] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':virtualstore-qa'), 0) AS acquired");
  if (locks[0].acquired !== 1) throw new Error("Another QA session is active; stop audit-browser before npm test");
  await connection.beginTransaction();
  const hash = await bcrypt.hash(password, 4);
  for (const role of ["admin", "karyawan", "karyawan"]) {
    const email = `audit-${randomUUID()}@example.test`;
    const [result] = await connection.query(
      "INSERT INTO users (name,email,password,role,status) VALUES ('Audit Fixture',?,?,?,'active')",
      [email, hash, role]);
    const user = { id: result.insertId, email, password: hash, role };
    user.token = generateToken(user);
    if (!admin) admin = user;
    else if (!employee) employee = user;
    else other = user;
  }
  const [category] = await connection.query("INSERT INTO categories (name) VALUES (?)", [`audit-${randomUUID()}`]);
  categoryId = category.insertId;
  const [product] = await connection.query(
    "INSERT INTO products (code,name,category_id,purchase_price,selling_price,stock,minimum_stock) VALUES (?, 'Audit Product', ?, 1.10, 2.35, 10, 0)",
    [`QA-${randomUUID().slice(0, 20)}`, categoryId]);
  productId = product.insertId;
  pool.query = (...args) => connection.query(...args);
  pool.getConnection = async () => ({
    query: (...args) => connection.query(...args),
    beginTransaction: () => connection.query("SAVEPOINT controller_transaction"),
    commit: () => connection.query("RELEASE SAVEPOINT controller_transaction"),
    rollback: () => connection.query("ROLLBACK TO SAVEPOINT controller_transaction"),
    release() {},
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => { await connection.query("SAVEPOINT test_case"); });
afterEach(async () => { await connection.query("ROLLBACK TO SAVEPOINT test_case"); });
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  pool.query = originals.query;
  pool.getConnection = originals.getConnection;
  if (connection) { await connection.rollback(); connection.release(); }
  await pool.end();
});

async function request(path, { method = "GET", body, user = admin, headers = {} } = {}) {
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${user.token}` } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
}

test("health checks MySQL without exposing database metadata", async () => {
  const r = await request("/api/health", { user: null });
  assert.equal(r.status, 200); assert.equal(r.body.database, "connected");
  assert.equal(r.body.mysql_version, undefined); assert.equal(r.headers.get("x-powered-by"), null);
});
test("root and unknown endpoint", async () => {
  assert.equal((await request("/")).status, 200);
  assert.equal((await request("/api/missing")).status, 404);
});
test("production startup rejects a weak JWT secret", () => {
  const { spawnSync } = require("node:child_process");
  const result = spawnSync(process.execPath, ["server.js"], {
    cwd: require("node:path").resolve(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "test-only-short" },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Production requires/);
});
test("CORS accepts configured origin and rejects foreign origin with 403", async () => {
  assert.equal((await request("/", { headers: { Origin: process.env.CLIENT_URL || "http://localhost:5173" } })).status, 200);
  assert.equal((await request("/", { headers: { Origin: "https://untrusted.example" } })).status, 403);
});
test("malformed JSON and oversized body are handled", async () => {
  for (const [body, status] of [["{", 400], [JSON.stringify({ data: "x".repeat(110000) }), 413]]) {
    const r = await fetch(`${baseURL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    assert.equal(r.status, status);
  }
});
test("rejects array bodies and repeated query values", async () => {
  assert.equal((await request("/api/auth/login", { method: "POST", body: [] })).status, 400);
  assert.equal((await request("/api/products?category=1&category=2")).status, 400);
});
for (const path of ["/api/auth/me", "/api/products", "/api/categories", "/api/stock/history", "/api/sales", "/api/dashboard/admin", "/api/reports/sales", "/api/users"]) {
  test(`missing JWT denied: ${path}`, async () => assert.equal((await request(path, { user: null })).status, 401));
}
test("invalid, expired, and malformed-claim JWT denied", async () => {
  const jwt = require("jsonwebtoken");
  for (const token of ["bad-token", jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: -1 }), jwt.sign({ id: {} }, process.env.JWT_SECRET)]) {
    assert.equal((await request("/api/auth/me", { user: { token } })).status, 401);
  }
});
test("inactive account denied immediately", async () => {
  await connection.query("UPDATE users SET status='inactive' WHERE id=?", [employee.id]);
  assert.equal((await request("/api/auth/me", { user: employee })).status, 401);
});
test("current profile never returns password", async () => {
  const r = await request("/api/auth/me"); assert.equal(r.status, 200); assert.equal(r.body.data.password, undefined);
});
test("login succeeds and wrong credentials fail", async () => {
  const r = await request("/api/auth/login", { method: "POST", body: { email: admin.email.toUpperCase(), password } });
  assert.equal(r.status, 200); assert.ok(r.body.token); assert.equal(r.body.user.password, undefined);
  assert.equal((await request("/api/auth/login", { method: "POST", body: { email: admin.email, password: "wrong" } })).status, 401);
});
for (const body of [{ email: {}, password }, { email: admin?.email || "user@example.test", password: [] }, { email: "bad", password }]) {
  test(`login rejects invalid input ${JSON.stringify(body)}`, async () => assert.equal((await request("/api/auth/login", { method: "POST", body })).status, 400));
}
test("public registration forces employee role and hashes password", async () => {
  const email = `registered-${randomUUID()}@example.test`;
  const r = await request("/api/auth/register", { method: "POST", body: { name: "QA User", email, password, confirmPassword: password, role: "admin" } });
  assert.equal(r.status, 201); assert.equal(r.body.data.role, "karyawan");
  const [rows] = await connection.query("SELECT password FROM users WHERE id=?", [r.body.data.id]);
  assert.equal(await bcrypt.compare(password, rows[0].password), true);
});
for (const changes of [{ name: "  " }, { email: {} }, { email: "invalid" }, { password: "123456", confirmPassword: "123456" }, { password: 123456789, confirmPassword: 123456789 }, { password: "x".repeat(73), confirmPassword: "x".repeat(73) }]) {
  test(`registration rejects invalid fields ${JSON.stringify(changes)}`, async () => {
    assert.equal((await request("/api/auth/register", { method: "POST", body: { name: "Test", email: `qa-${randomUUID()}@example.test`, password, confirmPassword: password, ...changes } })).status, 400);
  });
}
test("registration duplicate email returns conflict", async () => {
  assert.equal((await request("/api/auth/register", { method: "POST", body: { name: "Test", email: admin.email, password, confirmPassword: password } })).status, 409);
});
test("wrong current password is validation error, not expired session", async () => {
  const r = await request("/api/auth/change-password", { method: "PATCH", body: { current_password: "wrong", new_password: "Another-Password!42", confirm_password: "Another-Password!42" } });
  assert.equal(r.status, 400); assert.equal((await request("/api/auth/me")).status, 200);
});
test("password change revokes token even in same timestamp second", async () => {
  const jwt = require("jsonwebtoken");
  const r = await request("/api/auth/change-password", { method: "PATCH", body: { current_password: password, new_password: "Another-Password!42", confirm_password: "Another-Password!42" } });
  assert.equal(r.status, 200);
  await connection.query("UPDATE users SET updated_at=FROM_UNIXTIME(?) WHERE id=?", [jwt.decode(admin.token).iat, admin.id]);
  assert.equal((await request("/api/auth/me")).status, 401);
});
test("account settings update own profile, preserve role, return refreshed JWT", async () => {
  const r = await request("/api/auth/profile", { method: "PATCH", user: employee, body: { name: "Updated QA", email: `updated-${randomUUID()}@example.test`, role: "admin" } });
  assert.equal(r.status, 200); assert.equal(r.body.data.role, "karyawan"); assert.equal(r.body.data.password, undefined);
  assert.equal((await request("/api/auth/me", { user: { token: r.body.token } })).status, 200);
});
test("products list hides purchase cost for employees", async () => {
  const r = await request("/api/products", { user: employee });
  assert.equal(r.status, 200); assert.ok(r.body.data.every((p) => p.purchase_price === undefined));
  assert.ok((await request("/api/products")).body.data.some((p) => p.purchase_price !== undefined));
});
test("product search, category and stock filters", async () => {
  const r = await request(`/api/products?search=Audit%20Product&category=${categoryId}&stock_status=tersedia`);
  assert.equal(r.status, 200); assert.equal(r.body.data.length, 1); assert.equal(r.body.data[0].id, productId);
});
test("malformed product and history filters return validation errors", async () => {
  for (const path of ["/api/products?category=bad", "/api/products?stock_status=bad", "/api/stock/history?product_id=bad", "/api/stock/my-history?type=bad"]) {
    assert.equal((await request(path)).status, 400);
  }
});
test("product CRUD and zero minimum stock", async () => {
  const r = await request("/api/products", { method: "POST", body: { code: `QA-${randomUUID().slice(0, 20)}`, name: "CRUD QA", category_id: categoryId, purchase_price: 0, selling_price: 1.25, minimum_stock: 0 } });
  assert.equal(r.status, 201); const id = r.body.data.id;
  assert.equal((await request(`/api/products/${id}`)).status, 200);
  const update = await request(`/api/products/${id}`, { method: "PUT", body: { name: "Updated", minimum_stock: 0 } });
  assert.equal(update.status, 200); assert.equal(update.body.data.minimum_stock, 0);
  assert.equal((await request(`/api/products/${id}`, { method: "DELETE" })).status, 200);
  assert.equal((await request(`/api/products/${id}`)).status, 404);
});
for (const changes of [{ selling_price: [] }, { selling_price: true }, { selling_price: " " }, { selling_price: 1.001 }, { stock: true }, { stock: 4294967296 }, { category_id: {} }, { description: {} }, { code: "x".repeat(31) }]) {
  test(`product rejects invalid fields ${JSON.stringify(changes)}`, async () => {
    assert.equal((await request("/api/products", { method: "POST", body: { code: "QA-VALIDATE", name: "QA", category_id: categoryId, purchase_price: 0, selling_price: 1, ...changes } })).status, 400);
  });
}
for (const path of ["/api/users", "/api/stock/history", "/api/dashboard/admin", "/api/reports/sales"]) {
  test(`employee cannot access admin resource ${path}`, async () => assert.equal((await request(path, { user: employee })).status, 403));
}
test("employee cannot create products", async () => assert.equal((await request("/api/products", { method: "POST", user: employee, body: {} })).status, 403));
test("stock in/out updates and movement records are consistent", async () => {
  for (const [type, quantity, stock] of [["in", 5, 15], ["out", 3, 12]]) {
    const r = await request("/api/stock/update", { method: "POST", user: employee, body: { product_id: productId, type, quantity } });
    assert.equal(r.status, 200); assert.equal(r.body.data.stock_after, stock);
    const [products] = await connection.query("SELECT stock FROM products WHERE id=?", [productId]); assert.equal(products[0].stock, stock);
    const [movements] = await connection.query("SELECT stock_after FROM stock_movements WHERE id=?", [r.body.data.movement_id]); assert.equal(movements[0].stock_after, stock);
  }
});
test("stock rejects oversell, coercion, overflow and excessive notes", async () => {
  for (const change of [{ type: "out", quantity: 11 }, { quantity: true }, { quantity: 4294967295 }, { notes: "x".repeat(256) }]) {
    assert.equal((await request("/api/stock/update", { method: "POST", body: { product_id: productId, type: "in", quantity: 1, ...change } })).status, 400);
  }
});
test("sale uses database price, merges duplicates, updates stock and totals", async () => {
  const r = await request("/api/sales", { method: "POST", user: employee, body: { items: [{ product_id: productId, quantity: 1, price: 0 }, { product_id: productId, quantity: 2 }] } });
  assert.equal(r.status, 201); assert.equal(r.body.data.total_amount, 7.05); assert.equal(r.body.data.items.length, 1);
  const [rows] = await connection.query("SELECT stock FROM products WHERE id=?", [productId]); assert.equal(rows[0].stock, 7);
  assert.equal((await request(`/api/sales/my/${r.body.data.sale_id}`, { user: employee })).status, 200);
  assert.equal((await request(`/api/sales/${r.body.data.sale_id}`, { user: other })).status, 403);
  assert.equal((await request(`/api/sales/my/${r.body.data.sale_id}`, { user: other })).status, 404);
  assert.ok((await request("/api/sales", { user: other })).body.data.every((s) => s.user_id === other.id));
  assert.equal((await request(`/api/products/${productId}`, { method: "DELETE" })).status, 409);
});
test("failed sale rolls back header, items, movements and inventory", async () => {
  const [beforeRows] = await connection.query("SELECT COUNT(*) AS n FROM sales");
  const r = await request("/api/sales", { method: "POST", body: { items: [{ product_id: productId, quantity: 11 }] } });
  assert.equal(r.status, 400);
  const [afterRows] = await connection.query("SELECT COUNT(*) AS n FROM sales"); assert.equal(afterRows[0].n, beforeRows[0].n);
  const [rows] = await connection.query("SELECT stock FROM products WHERE id=?", [productId]); assert.equal(rows[0].stock, 10);
});
test("sales reject boolean quantities and merged count overflow", async () => {
  for (const items of [[{ product_id: productId, quantity: true }], [{ product_id: productId, quantity: 4294967295 }, { product_id: productId, quantity: 1 }]]) {
    assert.equal((await request("/api/sales", { method: "POST", body: { items } })).status, 400);
  }
});
test("reports reject impossible dates", async () => {
  for (const start_date of ["2026-02-30", "2026-13-01", "bad"]) {
    assert.equal((await request(`/api/reports/sales?start_date=${start_date}&end_date=2026-12-31`)).status, 400);
  }
});
for (const [path, role] of [["/api/categories", "admin"], ["/api/stock/history", "admin"], ["/api/stock/my-history", "employee"], ["/api/sales/my", "employee"], ["/api/dashboard/admin", "admin"], ["/api/dashboard/employee", "employee"], ["/api/reports/sales", "admin"], ["/api/users", "admin"]]) {
  test(`read endpoint works with real SQL: ${path}`, async () => assert.equal((await request(path, { user: role === "employee" ? employee : admin })).status, 200));
}
test("user CRUD, status, reset password and self-protection", async () => {
  const r = await request("/api/users", { method: "POST", body: { name: "QA", email: `crud-${randomUUID()}@example.test`, password, confirmPassword: password } });
  assert.equal(r.status, 201); const id = r.body.data.id;
  assert.equal((await request(`/api/users/${id}`, { method: "PUT", body: { name: "Updated QA" } })).status, 200);
  assert.equal((await request(`/api/users/${id}/status`, { method: "PATCH", body: { status: "inactive" } })).status, 200);
  assert.equal((await request(`/api/users/${id}/reset-password`, { method: "PATCH", body: { new_password: password, confirm_password: password } })).status, 200);
  assert.equal((await request(`/api/users/${id}`, { method: "DELETE" })).status, 200);
  assert.equal((await request(`/api/users/${admin.id}`, { method: "DELETE" })).status, 400);
  assert.equal((await request(`/api/users/${admin.id}`, { method: "PUT", body: { role: "karyawan" } })).status, 400);
});
test("invalid resource IDs rejected", async () => {
  for (const path of ["/api/products/1abc", "/api/sales/0"]) assert.equal((await request(path)).status, 400);
  assert.equal((await request("/api/users/-1", { method: "PUT", body: {} })).status, 400);
  // Sales IDs are BIGINT, so valid IDs must not be restricted to uint32.
  assert.equal((await request("/api/sales/4294967296")).status, 404);
});
test("authentication attempts are rate limited", async () => {
  let last;
  for (let i = 0; i < 61; i++) last = await request("/api/auth/login", { method: "POST", user: null, body: {} });
  assert.equal(last.status, 429); assert.ok(last.headers.get("ratelimit"));
});
