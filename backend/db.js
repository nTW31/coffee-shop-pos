const mysql = require("mysql2/promise");
require("dotenv").config();

// ---------------------------------------------------------------------------
// MySQL Connection Pool — ใช้ mysql2/promise
// รองรับหลาย Request พร้อมกันด้วย Connection Pool
// ---------------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cafe_pos",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

// ---------------------------------------------------------------------------
// Promise wrappers — รักษา Interface เดิม (run, get, all)
// เพื่อให้ Entity Layer ไม่ต้องเปลี่ยน signature มาก
// ---------------------------------------------------------------------------

/**
 * run(sql, params) — สำหรับ INSERT, UPDATE, DELETE
 * คืนค่า { lastID, changes } เหมือน SQLite wrapper เดิม
 */
async function run(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return { lastID: result.insertId, changes: result.affectedRows };
}

/**
 * get(sql, params) — ดึง 1 แถว (first row)
 */
async function get(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

/**
 * all(sql, params) — ดึงทุกแถว
 */
async function all(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * query(sql, params) — สำหรับ SQL ที่ต้อง pass array เป็น parameter
 * เช่น WHERE id IN (?) ที่ mysql2 ต้องใช้ .query() แทน .execute()
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * getConnection() — สำหรับ Transaction (BEGIN, COMMIT, ROLLBACK)
 */
async function getConnection() {
  return pool.getConnection();
}

// ---------------------------------------------------------------------------
// Setup — สร้างตาราง 5 ตาราง ตาม Workflow 2 ของ SKILL.md
// ---------------------------------------------------------------------------
async function setup() {
  // 1. categories — หมวดหมู่เมนู
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(50) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. products — รายการเมนูเครื่องดื่ม/อาหาร
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name        VARCHAR(100) NOT NULL,
      base_price  DECIMAL(10,2) NOT NULL,
      image_url   VARCHAR(255) DEFAULT NULL,
      is_active   TINYINT(1) NOT NULL DEFAULT 1,
      INDEX idx_products_category (category_id),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. product_options — ตัวเลือกขนาด / ความหวาน / ท็อปปิง
  await run(`
    CREATE TABLE IF NOT EXISTS product_options (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      option_type VARCHAR(20) NOT NULL,
      name        VARCHAR(50) NOT NULL,
      extra_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      INDEX idx_options_type (option_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. orders — หัวออเดอร์
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      order_no       VARCHAR(50) NOT NULL UNIQUE,
      queue_no       INT NOT NULL,
      total_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
      status         VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_status (status),
      INDEX idx_orders_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. order_items — รายการสินค้าในออเดอร์
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      order_id     INT NOT NULL,
      product_id   INT NOT NULL,
      quantity     INT NOT NULL DEFAULT 1,
      unit_price   DECIMAL(10,2) NOT NULL,
      subtotal     DECIMAL(10,2) NOT NULL,
      options_json JSON,
      INDEX idx_items_order (order_id),
      FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed mock data (เฉพาะครั้งแรกที่ยังไม่มีข้อมูล)
  await seedMockData();
}

// ---------------------------------------------------------------------------
// Seed Mock Data — เมนูกาแฟ 10 รายการ + ตัวเลือก
// ---------------------------------------------------------------------------
async function seedMockData() {
  const row = await get("SELECT COUNT(*) AS c FROM categories");
  if (row && row.c > 0) return; // มีข้อมูลแล้ว ไม่ต้อง seed ซ้ำ

  console.log("🌱 Seeding mock data...");

  // --- หมวดหมู่ ---
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
    "กาแฟ",
    1,
  ]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
    "ชา",
    2,
  ]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
    "ปั่น/สมูทตี้",
    3,
  ]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
    "เบเกอรี่",
    4,
  ]);

  // --- เมนู (10 รายการ) ---
  // กาแฟ (category_id = 1)
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [1, "เอสเพรสโซ (Espresso)", 45],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [1, "อเมริกาโน (Americano)", 50],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [1, "ลาเต้ (Latte)", 60],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [1, "คาปูชิโน (Cappuccino)", 60],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [1, "มอคค่า (Mocha)", 65],
  );

  // ชา (category_id = 2)
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [2, "ชาเขียวมัทฉะ (Matcha Latte)", 65],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [2, "ชาไทยเย็น (Thai Milk Tea)", 50],
  );

  // ปั่น/สมูทตี้ (category_id = 3)
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [3, "สตรอว์เบอร์รีสมูทตี้ (Strawberry Smoothie)", 70],
  );

  // เบเกอรี่ (category_id = 4)
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [4, "ครัวซองต์เนยสด (Butter Croissant)", 55],
  );
  await run(
    "INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)",
    [4, "บราวนี่ดาร์กช็อกโกแลต (Dark Choc Brownie)", 50],
  );

  // --- ตัวเลือก (Product Options) ---
  // ขนาด (size)
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["size", "S (เล็ก)", 0],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["size", "M (กลาง)", 10],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["size", "L (ใหญ่)", 20],
  );

  // ความหวาน (sweetness) — ไม่คิดเงินเพิ่ม
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["sweetness", "หวาน 0% (ไม่หวาน)", 0],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["sweetness", "หวาน 25% (หวานน้อย)", 0],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["sweetness", "หวาน 50% (หวานปานกลาง)", 0],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["sweetness", "หวาน 75% (หวานปกติ)", 0],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["sweetness", "หวาน 100% (หวานมาก)", 0],
  );

  // ท็อปปิง (topping)
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["topping", "ไข่มุก", 15],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["topping", "วิปครีม", 15],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["topping", "เพิ่มช็อตกาแฟ", 20],
  );
  await run(
    "INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)",
    ["topping", "เยลลี่บุก", 10],
  );

  console.log("✅ Mock data seeded successfully!");
}

module.exports = { run, get, all, query, getConnection, setup, pool };
