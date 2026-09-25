-- =============================================================================
-- Coffee Shop POS Database Schema (MySQL 8.0+)
-- โครงสร้างฐานข้อมูลระบบร้านกาแฟ POS ตามสถาปัตยกรรม BCM
-- =============================================================================

CREATE DATABASE IF NOT EXISTS cafe_pos 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE cafe_pos;

-- 1. หมวดหมู่สินค้า
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. รายการสินค้า/เมนู
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  INDEX idx_products_category (category_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ตัวเลือกสินค้า (ขนาดแก้ว, ระดับความหวาน, ท็อปปิ้ง)
CREATE TABLE IF NOT EXISTS product_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  option_type VARCHAR(20) NOT NULL, -- 'size', 'sweetness', 'topping'
  name VARCHAR(50) NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0.00,
  INDEX idx_options_type (option_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. คำสั่งซื้อ (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  queue_no INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- 'cash', 'transfer'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'cooking', 'completed'
  created_at DATETIME NOT NULL,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. รายการสินค้าในแต่ละคำสั่งซื้อ (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  options_json JSON,
  INDEX idx_items_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Initial Mock Data (Seed Data)
-- =============================================================================

-- หมวดหมู่
INSERT INTO categories (id, name, sort_order) VALUES
  (1, 'กาแฟ', 1),
  (2, 'ชา', 2),
  (3, 'ปั่น/สมูทตี้', 3),
  (4, 'เบเกอรี่', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name), sort_order=VALUES(sort_order);

-- เมนูสินค้า
INSERT INTO products (id, category_id, name, base_price, is_active) VALUES
  (1, 1, 'เอสเพรสโซ (Espresso)', 45.00, 1),
  (2, 1, 'อเมริกาโน (Americano)', 50.00, 1),
  (3, 1, 'ลาเต้ (Latte)', 60.00, 1),
  (4, 1, 'คาปูชิโน (Cappuccino)', 60.00, 1),
  (5, 1, 'มอคค่า (Mocha)', 65.00, 1),
  (6, 2, 'ชาเขียวมัทฉะ (Matcha Latte)', 65.00, 1),
  (7, 2, 'ชาไทยเย็น (Thai Milk Tea)', 50.00, 1),
  (8, 3, 'สตรอว์เบอร์รีสมูทตี้ (Strawberry Smoothie)', 70.00, 1),
  (9, 4, 'ครัวซองต์เนยสด (Butter Croissant)', 55.00, 1),
  (10, 4, 'บราวนี่ดาร์กช็อกโกแลต (Dark Choc Brownie)', 50.00, 1)
ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), name=VALUES(name), base_price=VALUES(base_price), is_active=VALUES(is_active);

-- ตัวเลือกสินค้า (Options)
INSERT INTO product_options (id, option_type, name, extra_price) VALUES
  -- ขนาด (Size)
  (1, 'size', 'S (เล็ก)', 0.00),
  (2, 'size', 'M (กลาง)', 10.00),
  (3, 'size', 'L (ใหญ่)', 20.00),
  -- ความหวาน (Sweetness)
  (4, 'sweetness', 'หวาน 0% (ไม่หวาน)', 0.00),
  (5, 'sweetness', 'หวาน 25% (หวานน้อย)', 0.00),
  (6, 'sweetness', 'หวาน 50% (หวานปานกลาง)', 0.00),
  (7, 'sweetness', 'หวาน 75% (หวานปกติ)', 0.00),
  (8, 'sweetness', 'หวาน 100% (หวานมาก)', 0.00),
  -- ท็อปปิ้ง (Topping)
  (9, 'topping', 'ไข่มุก', 15.00),
  (10, 'topping', 'วิปครีม', 15.00),
  (11, 'topping', 'เพิ่มช็อตกาแฟ', 20.00),
  (12, 'topping', 'เยลลี่บุก', 10.00)
ON DUPLICATE KEY UPDATE option_type=VALUES(option_type), name=VALUES(name), extra_price=VALUES(extra_price);
