const path = require("path");
const sqlite3 = require("sqlite3");

// ---------------------------------------------------------------------------
// SQLite Connection — สร้างไฟล์ cafe_pos.db ในโฟลเดอร์เดียวกับ server.js
// ---------------------------------------------------------------------------
const db = new sqlite3.Database(path.join(__dirname, "cafe_pos.db"));

// Promise wrappers สำหรับ sqlite3 (เหมือนตัวอย่าง wk09-code-demo/bcm/db.js)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ---------------------------------------------------------------------------
// Setup — สร้างตาราง 5 ตาราง ตาม Workflow 2 ของ SKILL.md
// ---------------------------------------------------------------------------
async function setup() {
  // เปิด WAL mode เพื่อประสิทธิภาพ
  await run("PRAGMA journal_mode=WAL");

  // 1. categories — หมวดหมู่เมนู
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  // 2. products — รายการเมนูเครื่องดื่ม/อาหาร
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name        TEXT    NOT NULL,
      base_price  INTEGER NOT NULL,
      image_url   TEXT    DEFAULT NULL,
      is_active   INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // 3. product_options — ตัวเลือกขนาด / ความหวาน / ท็อปปิง
  await run(`
    CREATE TABLE IF NOT EXISTS product_options (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      option_type TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      extra_price INTEGER NOT NULL DEFAULT 0
    )
  `);

  // 4. orders — หัวออเดอร์
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no       TEXT    NOT NULL UNIQUE,
      queue_no       INTEGER NOT NULL,
      total_amount   INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT    NOT NULL DEFAULT 'cash',
      status         TEXT    NOT NULL DEFAULT 'pending',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);

  // 5. order_items — รายการสินค้าในออเดอร์
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER NOT NULL,
      product_id   INTEGER NOT NULL,
      quantity     INTEGER NOT NULL DEFAULT 1,
      unit_price   INTEGER NOT NULL,
      subtotal     INTEGER NOT NULL,
      options_json TEXT    DEFAULT '{}',
      FOREIGN KEY (order_id)   REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Seed mock data (เฉพาะครั้งแรกที่ยังไม่มีข้อมูล)
  await seedMockData();
}

// ---------------------------------------------------------------------------
// Seed Mock Data — เมนูกาแฟ 12 รายการ + ตัวเลือก
// ---------------------------------------------------------------------------
async function seedMockData() {
  const { c } = await get("SELECT COUNT(*) AS c FROM categories");
  if (c > 0) return; // มีข้อมูลแล้ว ไม่ต้อง seed ซ้ำ

  console.log("🌱 Seeding mock data...");

  // --- หมวดหมู่ ---
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", ["กาแฟ", 1]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", ["ชา", 2]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", ["ปั่น", 3]);
  await run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", ["เบเกอรี่", 4]);

  // --- เมนู (12 รายการ) ---
  // กาแฟ (category_id = 1)
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [1, "เอสเปรสโซ่", 45]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [1, "อเมริกาโน่", 50]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [1, "ลาเต้", 60]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [1, "คาปูชิโน่", 60]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [1, "มอคค่า", 65]);

  // ชา (category_id = 2)
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [2, "ชาเขียว", 50]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [2, "ชาไทย", 45]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [2, "ชามะลิ", 45]);

  // ปั่น (category_id = 3)
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [3, "ฟราปเป้มอคค่า", 75]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [3, "สมูทตี้มะม่วง", 70]);

  // เบเกอรี่ (category_id = 4)
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [4, "ครัวซองต์", 55]);
  await run("INSERT INTO products (category_id, name, base_price) VALUES (?, ?, ?)", [4, "เค้กช็อกโกแลต", 65]);

  // --- ตัวเลือก (Product Options) ---
  // ขนาด (size)
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["size", "S", 0]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["size", "M", 10]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["size", "L", 20]);

  // ความหวาน (sweetness) — ไม่คิดเงินเพิ่ม
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["sweetness", "หวาน 0%", 0]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["sweetness", "หวาน 25%", 0]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["sweetness", "หวาน 50%", 0]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["sweetness", "หวาน 75%", 0]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["sweetness", "หวาน 100%", 0]);

  // ท็อปปิง (topping)
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["topping", "ไข่มุก", 15]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["topping", "วิปครีม", 15]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["topping", "ช็อตเพิ่ม", 20]);
  await run("INSERT INTO product_options (option_type, name, extra_price) VALUES (?, ?, ?)", ["topping", "เยลลี่", 10]);

  console.log("✅ Mock data seeded successfully!");
}

module.exports = { run, get, all, setup };
