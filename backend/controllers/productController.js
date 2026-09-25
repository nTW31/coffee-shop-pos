const Product = require("../entities/Product");
const ProductOption = require("../entities/ProductOption");

// <<control>> ProductController — Business Logic สำหรับจัดการเมนูสินค้า
// อ้างอิง: FR-01 (แสดงเมนู), FR-02 (ตัวเลือกขนาด/หวาน/ท็อปปิง)

/**
 * ดึงเมนูทั้งหมดที่เปิดขาย จัดกลุ่มตามหมวดหมู่ พร้อมตัวเลือก
 * ตอบกลับ { categories: [...], options: { size: [...], sweetness: [...], topping: [...] } }
 */
async function listProducts() {
  const products = await Product.findAllActive();
  const allOptions = await ProductOption.findAll();

  // จัดกลุ่มเมนูตามหมวดหมู่
  const categoryMap = {};
  for (const product of products) {
    if (!categoryMap[product.category_id]) {
      categoryMap[product.category_id] = {
        id: product.category_id,
        name: product.category_name,
        products: [],
      };
    }
    categoryMap[product.category_id].products.push({
      id: product.id,
      name: product.name,
      base_price: product.base_price,
      image_url: product.image_url,
    });
  }

  // จัดกลุ่มตัวเลือกตามประเภท
  const options = {};
  for (const opt of allOptions) {
    if (!options[opt.option_type]) {
      options[opt.option_type] = [];
    }
    options[opt.option_type].push({
      id: opt.id,
      name: opt.name,
      extra_price: opt.extra_price,
    });
  }

  return {
    status: 200,
    body: {
      categories: Object.values(categoryMap),
      options,
    },
  };
}

module.exports = { listProducts };
