const db = require("../db");

// <<entity>> Product — ติดต่อฐานข้อมูลตาราง products, categories, product_options
// ไม่มี Business Logic ในชั้นนี้ มีแค่ CRUD operations
class Product {
  /**
   * ดึงเมนูทั้งหมดที่เปิดขาย (is_active = 1) พร้อมชื่อหมวดหมู่
   * อ้างอิง: FR-01
   */
  static async findAllActive() {
    return db.all(`
      SELECT p.id, p.category_id, c.name AS category_name,
             p.name, p.base_price, p.image_url
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
      ORDER BY c.sort_order, p.id
    `);
  }

  /**
   * ดึงเมนูตาม ID
   */
  static async findById(id) {
    return db.get("SELECT * FROM products WHERE id = ? AND is_active = 1", [id]);
  }
}

module.exports = Product;
