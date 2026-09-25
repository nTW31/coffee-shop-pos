require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());                                           // อนุญาต cross-origin (Frontend แยก port)
app.use(express.json());                                   // รับ JSON body
app.use(express.static(path.join(__dirname, "public")));   // Serve static files

// ---------------------------------------------------------------------------
// Mount Routes (Boundary Layer)
// ---------------------------------------------------------------------------
app.use("/api", productRoutes);   // GET  /api/products
app.use("/api", orderRoutes);     // POST /api/orders, GET /api/orders/queue, PATCH /api/orders/:id/status

// ---------------------------------------------------------------------------
// Start Server — setup DB ก่อนเปิดรับ request
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

db.setup().then(() => {
  app.listen(PORT, () => {
    console.log(`☕ Coffee Shop POS Backend running at http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/products`);
  });
}).catch((err) => {
  console.error("❌ Failed to setup database:", err);
  process.exit(1);
});
