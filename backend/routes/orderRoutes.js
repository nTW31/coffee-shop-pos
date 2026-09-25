const express = require("express");
const orderController = require("../controllers/orderController");

// <<boundary>> OrderRoutes — รับ HTTP request แล้วส่งต่อให้ Controller
// ไม่มี Business Logic ในชั้นนี้
const router = express.Router();

/**
 * POST /api/orders
 * รับออเดอร์ใหม่ คำนวณราคา ออกเลขคิว
 * อ้างอิง: FR-03, FR-04, FR-05, FR-06, FR-07
 *
 * Body: { paymentMethod, items: [{ productId, quantity, sizeId, sweetnessId, toppingIds }] }
 */
router.post("/orders", async (req, res) => {
  try {
    const result = await orderController.createOrder(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * GET /api/orders/queue
 * ดึงรายการออเดอร์ที่อยู่ในคิว (pending, cooking) สำหรับหน้าจอบาริสต้า
 * อ้างอิง: FR-07, FR-08
 */
router.get("/orders/queue", async (req, res) => {
  try {
    const result = await orderController.getQueue();
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/orders/queue error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * PATCH /api/orders/:id/status
 * เปลี่ยนสถานะออเดอร์ (pending → cooking → ready → completed)
 * อ้างอิง: FR-08
 *
 * Body: { status: "cooking" | "ready" | "completed" }
 */
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const result = await orderController.updateStatus(orderId, status);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("PATCH /api/orders/:id/status error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
