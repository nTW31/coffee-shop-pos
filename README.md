ก# ☕ Coffee Shop POS System (ระบบบริหารจัดการร้านกาแฟ)

> **วิชา:** System Analysis and Design (การวิเคราะห์และออกแบบระบบ)  
> **สถาปัตยกรรม:** Boundary-Control-Entity (BCM) Pattern  
> **เทคโนโลยี:** React 19 + Vite (Frontend SPA) & Node.js + Express (Backend REST API) & SQLite / MySQL (Database)

---

## 📋 ภาพรวมโครงการ (Project Overview)

ระบบ POS สำหรับร้านกาแฟ พัฒนาตามข้อกำหนดความต้องการและกระบวนการวิเคราะห์ออกแบบระบบ (System Analysis & Design) ครบถ้วน:

- **Cashier Screen (พนักงานหน้าร้าน):** เลือกเมนูตามหมวดหมู่, ปรับแต่งขนาด/ระดับความหวาน/ท็อปปิง, คำนวณราคาแบบเรียลไทม์, จัดการตะกร้าสินค้า, เลือกวิธีชำระเงิน (เงินสด/โอน/QR), และพิมพ์ใบเสร็จพร้อมออกเลขคิว
- **Barista Screen (หน้าจอบาริสต้า):** แสดงคิวแบบเรียลไทม์ (Auto Polling ทุก 3 วินาที), แสดงสูตรการชงแยกตามแก้วอย่างละเอียด, และกดเลื่อนสถานะออเดอร์ (`รอทำ` $\rightarrow$ `กำลังทำ` $\rightarrow$ `พร้อมรับ` $\rightarrow$ `เสร็จสิ้น`)
- **BCM Architecture (Boundary-Control-Entity):** แยก Layer การทำงานอย่างชัดเจนตามหลักวิศวกรรมซอฟต์แวร์

---

## 🏛️ โครงสร้างสถาปัตยกรรม (BCM Architecture)

```
project/
├── backend/
│   ├── db/
│   │   ├── index.js            # DB Gateway (สลับ SQLite / MySQL ผ่าน DB_DIALECT)
│   │   ├── sqlite.js           # SQLite Adapter & In-memory / File persistence
│   │   └── mysql.js            # MySQL Adapter & Connection Pool
│   ├── entities/               # Entity Layer <<entity>>
│   │   ├── Product.js          # ข้อมูลเมนูสินค้า
│   │   ├── ProductOption.js    # ตัวเลือก (ขนาด, ความหวาน, ท็อปปิง)
│   │   └── Order.js            # ข้อมูลออเดอร์, คิว, และ OrderItems
│   ├── controllers/            # Control Layer <<control>>
│   │   ├── productController.js # ควบคุม Business Logic การดึงเมนูและตัวเลือก
│   │   └── orderController.js   # ควบคุม Validation (FR-03), คำนวณราคา (FR-05), ออกคิว (FR-04, FR-07)
│   ├── routes/                 # Boundary Layer <<boundary>>
│   │   ├── productRoutes.js    # GET /api/products
│   │   └── orderRoutes.js      # POST /api/orders, GET /api/orders/queue, PATCH /api/orders/:id/status
│   └── server.js               # Express Server & SPA Static Fallback
│
└── frontend/                   # Frontend SPA (React + Vite + Modern CSS)
    ├── src/
    │   ├── App.jsx             # Main Container & Navbar Tab Switcher
    │   ├── App.css             # Theme Styling (Warm Espresso & Caramel)
    │   ├── services/
    │   │   └── api.js          # REST Client API
    │   └── components/
    │       ├── Navbar.jsx      # Navigation bar, Active Queue Counter Badge
    │       ├── cashier/        # หน้าจอแคชเชียร์ (FR-01 ถึง FR-06)
    │       │   ├── CashierView.jsx
    │       │   ├── CategoryTabs.jsx
    │       │   ├── ProductGrid.jsx
    │       │   ├── ProductCard.jsx
    │       │   ├── CustomizationModal.jsx
    │       │   ├── CartSidebar.jsx
    │       │   └── ReceiptModal.jsx
    │       └── barista/        # หน้าจอบาริสต้า (FR-07 ถึง FR-08)
    │           ├── BaristaView.jsx
    │           └── QueueCard.jsx
```

---

## 🚀 วิธีการติดตั้งและรันระบบ (How to Run)

### วิธีที่ 1: รันแบบ Single Server (แนะนำสำหรับทดสอบ/ส่งงาน)

Backend จะ serve ตัว React Frontend ที่ build แล้วอัตโนมัติบนพอร์ต 3000:

1. **Build Frontend**:

   ```bash
   cd project/frontend
   npm install
   npm run build
   ```

2. **Start Backend**:

   ```bash
   cd ../backend
   npm install
   npm start
   ```

3. **เปิดเว็บเบราว์เซอร์**: เข้าใช้งานได้ที่ [http://localhost:3000](http://localhost:3000)

---

### วิธีที่ 2: รันแบบ Development Mode (Hot-Reload)

เหมาะสำหรับการแก้ไขโค้ดและทดสอบแบบ Real-time:

1. **เปิด Terminal ที่ 1 (Backend - Port 3000)**:

   ```bash
   cd project/backend
   npm run dev
   ```

2. **เปิด Terminal ที่ 2 (Frontend Vite - Port 5173)**:

   ```bash
   cd project/frontend
   npm run dev
   ```

3. **เปิดเว็บเบราว์เซอร์**: เข้าใช้งานได้ที่ [http://localhost:5173](http://localhost:5173) (Vite มี proxy ส่งคำขอ `/api` ไปยัง Backend 3000 อัตโนมัติ)

---

## 📡 สรุป REST API Endpoints

| Method  | Endpoint                 | รายละเอียด                                                                    |
| ------- | ------------------------ | ----------------------------------------------------------------------------- |
| `GET`   | `/api/products`          | ดึงรายการหมวดหมู่, เมนูสินค้า และตัวเลือกทั้งหมด (ขนาด/หวาน/ท็อปปิง)          |
| `POST`  | `/api/orders`            | บันทึกการสั่งซื้อ, คำนวณราคา, และออกหมายเลขคิวใหม่                            |
| `GET`   | `/api/orders/queue`      | ดึงรายการคิวที่ยังไม่เสร็จสิ้น (`pending`, `cooking`, `ready`) สำหรับบาริสต้า |
| `PATCH` | `/api/orders/:id/status` | อัปเดตสถานะคิว (`cooking`, `ready`, `completed`)                              |

---

## ✅ ตรวจสอบตาม Functional Requirements (FR)

| รหัส      | ข้อกำหนดความต้องการ                                 | สถานะ                                                            |
| --------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| **FR-01** | แสดงหมวดหมู่และรายการสินค้าทั้งหมด                  | ✅ เสร็จสมบูรณ์ (แบ่งหมวด กาแฟ, ชา, ปั่น, เบเกอรี่)              |
| **FR-02** | ค้นหาและกรองสินค้าตามหมวดหมู่                       | ✅ เสร็จสมบูรณ์ (แท็บกรองตามหมวดหมู่แบบ Interactive)             |
| **FR-03** | บังคับเลือกขนาด (Size) และเลือกท็อปปิง/ความหวานได้  | ✅ เสร็จสมบูรณ์ (Validation เตือนทันทีหากไม่เลือกขนาด)           |
| **FR-04** | สร้างเลขออเดอร์และเลขคิวที่ไม่ซ้ำกันในแต่ละวัน      | ✅ เสร็จสมบูรณ์ (`POS-YYYYMMDD-XXXX` และคิว #001, #002...)       |
| **FR-05** | คำนวณยอดเงินรวมและภาษีตามจริง                       | ✅ เสร็จสมบูรณ์ (คำนวณราคาฐาน + ขนาด + ท็อปปิง แบบเรียลไทม์)     |
| **FR-06** | รองรับการชำระเงิน (เงินสด, โอน, QR) และพิมพ์ใบเสร็จ | ✅ เสร็จสมบูรณ์ (มีปุ่มพิมพ์ใบเสร็จและแสดงสรุป)                  |
| **FR-07** | ส่งรายการไปยังหน้าจอบาริสต้าทันที                   | ✅ เสร็จสมบูรณ์ (บันทึกลง Database พร้อมให้หน้าจอบาริสต้าดึงคิว) |
| **FR-08** | บาริสต้าดูสูตรละเอียดและเลื่อนสถานะออเดอร์ได้       | ✅ เสร็จสมบูรณ์ (แสดงสูตรรายแก้ว และกดเลื่อนสถานะ 1-Click)       |
