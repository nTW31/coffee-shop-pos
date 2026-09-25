const express = require("express");
const productController = require("../controllers/productController");

// <<boundary>> ProductRoutes — รับ HTTP request แล้วส่งต่อให้ Controller
// ไม่มี Business Logic ในชั้นนี้
const router = express.Router();

/**
 * GET /api/products
 * ดึงเมนูทั้งหมดที่เปิดขาย จัดกลุ่มตามหมวดหมู่ พร้อมตัวเลือก
 * อ้างอิง: FR-01, FR-02
 */
router.get("/products", async (req, res) => {
  try {
    const result = await productController.listProducts();
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
