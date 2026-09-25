const Product = require("../entities/Product");
const ProductOption = require("../entities/ProductOption");
const Order = require("../entities/Order");

// <<control>> OrderController — Business Logic สำหรับจัดการออเดอร์
// ตัดสินใจตามกฎ Use Case 01: รับออเดอร์และคำนวณราคา

/**
 * สร้างออเดอร์ใหม่
 * อ้างอิง: FR-03 (Validate), FR-04 (เลขคิว), FR-05 (คำนวณราคา), FR-06 (ชำระเงิน), FR-07 (ส่งให้บาริสต้า)
 *
 * @param {Object} data - { paymentMethod, items: [{ productId, quantity, size, sweetness, toppings }] }
 */
async function createOrder(data) {
  const { paymentMethod, items } = data;

  // --- FR-03: Validate ข้อมูลที่จำเป็น ---
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { status: 400, body: { error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" } };
  }

  const validPayments = ["cash", "transfer", "qr"];
  if (!paymentMethod || !validPayments.includes(paymentMethod)) {
    return { status: 400, body: { error: "กรุณาเลือกวิธีชำระเงิน (cash, transfer, qr)" } };
  }

  // --- FR-05: คำนวณราคาแต่ละรายการ ---
  let totalAmount = 0;
  const resolvedItems = [];

  for (const item of items) {
    const { productId, quantity, sizeId, sweetnessId, toppingIds } = item;

    // Validate: ต้องมี productId และ quantity
    if (!productId || !quantity || quantity <= 0) {
      return { status: 400, body: { error: "ข้อมูลรายการสินค้าไม่ถูกต้อง (ต้องระบุ productId และ quantity)" } };
    }

    // FR-03: ต้องเลือกขนาด (sizeId) สำหรับเครื่องดื่ม
    if (!sizeId) {
      return { status: 400, body: { error: "กรุณาเลือกขนาดเครื่องดื่ม (sizeId)" } };
    }

    // ตรวจสอบว่าเมนูมีอยู่จริง
    const product = await Product.findById(productId);
    if (!product) {
      return { status: 404, body: { error: `ไม่พบเมนู id ${productId}` } };
    }

    // คำนวณราคา: base_price + ขนาด + ท็อปปิง
    let unitPrice = parseFloat(product.base_price);

    // บวกราคาขนาด
    const sizeOption = await ProductOption.findById(sizeId);
    if (sizeOption) {
      unitPrice += parseFloat(sizeOption.extra_price);
    }

    // บวกราคาท็อปปิง (ถ้ามี)
    if (toppingIds && toppingIds.length > 0) {
      const toppings = await ProductOption.findByIds(toppingIds);
      for (const topping of toppings) {
        unitPrice += parseFloat(topping.extra_price);
      }
    }

    const subtotal = unitPrice * quantity;
    totalAmount += subtotal;

    // เก็บข้อมูลตัวเลือกเป็น JSON
    const optionsJson = JSON.stringify({
      sizeId: sizeId || null,
      sweetnessId: sweetnessId || null,
      toppingIds: toppingIds || [],
    });

    resolvedItems.push({
      productId,
      quantity,
      unitPrice,
      subtotal,
      optionsJson,
    });
  }

  // --- FR-04: สร้างเลขออเดอร์และเลขคิวที่ไม่ซ้ำกัน ---
  const lastQueue = await Order.getLastQueueNoToday();
  const queueNo = lastQueue + 1;

  // สร้างเลขออเดอร์: POS-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, "0")
    + String(now.getDate()).padStart(2, "0");
  const orderNo = `POS-${dateStr}-${String(queueNo).padStart(4, "0")}`;

  // --- บันทึกลง DB ด้วย Transaction ---
  const order = await Order.createWithItems({
    orderNo,
    queueNo,
    totalAmount,
    paymentMethod,
    items: resolvedItems,
  });

  // --- FR-07: ส่งข้อมูลกลับ (หน้าจอบาริสต้าจะ poll จาก GET /api/orders/queue) ---
  return {
    status: 201,
    body: {
      orderId: order.id,
      orderNo: order.orderNo,
      queueNo: order.queueNo,
      totalAmount,
      paymentMethod,
      status: "pending",
    },
  };
}

/**
 * ดึงรายการคิวสำหรับหน้าจอบาริสต้า
 * อ้างอิง: FR-07, FR-08
 */
async function getQueue() {
  const orders = await Order.findQueue();
  return { status: 200, body: orders };
}

/**
 * เปลี่ยนสถานะออเดอร์
 * อ้างอิง: FR-08 — ลำดับสถานะ: pending → cooking → ready → completed
 */
async function updateStatus(orderId, newStatus) {
  const validStatuses = ["pending", "cooking", "ready", "completed"];
  if (!validStatuses.includes(newStatus)) {
    return { status: 400, body: { error: `สถานะไม่ถูกต้อง ต้องเป็น: ${validStatuses.join(", ")}` } };
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return { status: 404, body: { error: `ไม่พบออเดอร์ id ${orderId}` } };
  }

  // ตรวจสอบลำดับสถานะ (ห้ามย้อนกลับ)
  const statusOrder = { pending: 0, cooking: 1, ready: 2, completed: 3 };
  if (statusOrder[newStatus] <= statusOrder[order.status]) {
    return { status: 400, body: { error: `ไม่สามารถเปลี่ยนสถานะจาก "${order.status}" เป็น "${newStatus}" ได้` } };
  }

  await Order.updateStatus(orderId, newStatus);
  return { status: 200, body: { id: orderId, status: newStatus } };
}

module.exports = { createOrder, getQueue, updateStatus };
