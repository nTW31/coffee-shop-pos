const db = require("../db");

// <<entity>> Order — ติดต่อฐานข้อมูลตาราง orders และ order_items
// ไม่มี Business Logic (การคำนวณราคา, Validation) ในชั้นนี้
class Order {
  /**
   * ดึงเลขคิวล่าสุดของวันนี้ เพื่อให้ Controller ใช้สร้างเลขคิวถัดไป
   * อ้างอิง: FR-04
   * MySQL: ใช้ CURDATE() แทน DATE('now','localtime') ของ SQLite
   */
  static async getLastQueueNoToday() {
    const row = await db.get(`
      SELECT MAX(queue_no) AS last_queue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    return row ? row.last_queue || 0 : 0;
  }

  /**
   * บันทึกออเดอร์พร้อมรายการสินค้าด้วย MySQL Transaction (START TRANSACTION / COMMIT / ROLLBACK)
   * ป้องกันข้อมูลไม่สมบูรณ์หากบันทึกรายการล้มเหลว
   */
  static async createWithItems({ orderNo, queueNo, totalAmount, paymentMethod, items }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [orderResult] = await conn.execute(
        `INSERT INTO orders (order_no, queue_no, total_amount, payment_method, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [orderNo, queueNo, totalAmount, paymentMethod],
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, options_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.unitPrice, item.subtotal, item.optionsJson || "{}"],
        );
      }

      await conn.commit();
      return { id: orderId, orderNo, queueNo };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * บันทึกหัวออเดอร์
   * MySQL: ใช้ result.lastID (wrapper จาก db.run ที่ map insertId → lastID)
   */
  static async create({ orderNo, queueNo, totalAmount, paymentMethod }) {
    const result = await db.run(
      `INSERT INTO orders (order_no, queue_no, total_amount, payment_method, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [orderNo, queueNo, totalAmount, paymentMethod],
    );
    return { id: result.lastID, orderNo, queueNo };
  }

  /**
   * บันทึกรายการสินค้าในออเดอร์
   */
  static async createItem({
    orderId,
    productId,
    quantity,
    unitPrice,
    subtotal,
    optionsJson,
  }) {
    return db.run(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, options_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, productId, quantity, unitPrice, subtotal, optionsJson || "{}"],
    );
  }

  /**
   * ดึงออเดอร์ที่อยู่ในคิว (pending, cooking) สำหรับหน้าจอบาริสต้า
   * อ้างอิง: FR-07, FR-08
   */
  static async findQueue() {
    const orders = await db.all(`
      SELECT id, order_no, queue_no, total_amount, payment_method, status, created_at
      FROM orders
      WHERE status IN ('pending', 'cooking')
      ORDER BY queue_no ASC
    `);

    // ดึง items ของแต่ละออเดอร์
    for (const order of orders) {
      order.total_amount = parseFloat(order.total_amount);
      order.items = await db.all(
        `
        SELECT oi.id, oi.product_id, p.name AS product_name,
               oi.quantity, oi.unit_price, oi.subtotal, oi.options_json
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
      `,
        [order.id],
      );
      for (const item of order.items) {
        item.unit_price = parseFloat(item.unit_price);
        item.subtotal = parseFloat(item.subtotal);
        if (typeof item.options_json === "string") {
          try {
            item.options_json = JSON.parse(item.options_json);
          } catch (e) {}
        }
      }
    }

    return orders;
  }

  /**
   * ดึงออเดอร์ตาม ID
   */
  static async findById(id) {
    return db.get("SELECT * FROM orders WHERE id = ?", [id]);
  }

  /**
   * อัปเดตสถานะออเดอร์
   * อ้างอิง: FR-08
   */
  static async updateStatus(id, status) {
    return db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  }
}

module.exports = Order;
