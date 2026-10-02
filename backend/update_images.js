const db = require("./db");

const menuImages = [
  {
    id: 1,
    name: "เอสเพรสโซ (Espresso)",
    image_url:
      "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "อเมริกาโน (Americano)",
    image_url:
      "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "ลาเต้ (Latte)",
    image_url:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "คาปูชิโน (Cappuccino)",
    image_url:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "มอคค่า (Mocha)",
    image_url:
      "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "ชาเขียวมัทฉะ (Matcha Latte)",
    image_url: "/images/matcha-latte.png",
  },
  {
    id: 7,
    name: "ชาไทยเย็น (Thai Milk Tea)",
    image_url: "/images/thai-tea.png",
  },
  {
    id: 8,
    name: "สตรอว์เบอร์รีสมูทตี้ (Strawberry Smoothie)",
    image_url:
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 9,
    name: "ครัวซองต์เนยสด (Butter Croissant)",
    image_url:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 10,
    name: "บราวนี่ดาร์กช็อกโกแลต (Dark Choc Brownie)",
    image_url:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
  },
];

async function updateProductImages() {
  console.log("Updating product images...");
  for (const item of menuImages) {
    await db.run("UPDATE products SET image_url = ? WHERE id = ?", [
      item.image_url,
      item.id,
    ]);
    console.log(`Updated product #${item.id} (${item.name})`);
  }

  const products = await db.all("SELECT id, name, image_url FROM products");
  console.log("\nCurrent Products in DB:");
  console.table(products);
  process.exit(0);
}

updateProductImages().catch((err) => {
  console.error("Error updating images:", err);
  process.exit(1);
});
