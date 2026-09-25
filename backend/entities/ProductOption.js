const db = require("../db");

// <<entity>> ProductOption — ติดต่อฐานข้อมูลตาราง product_options
class ProductOption {
  /**
   * ดึงตัวเลือกทั้งหมด จัดกลุ่มตาม option_type (size, sweetness, topping)
   * อ้างอิง: FR-02
   */
  static async findAll() {
    return db.all("SELECT * FROM product_options ORDER BY option_type, id");
  }

  /**
   * ดึงตัวเลือกตาม ID
   */
  static async findById(id) {
    return db.get("SELECT * FROM product_options WHERE id = ?", [id]);
  }

  /**
   * ดึงตัวเลือกหลายรายการตาม IDs
   */
  static async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    // MySQL: ใช้ db.query() แทน db.all() เพราะ mysql2.execute() ไม่รองรับ array expansion
    return db.query(
      `SELECT * FROM product_options WHERE id IN (?)`,
      [ids],
    );
  }
}

module.exports = ProductOption;
