import React from 'react';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({ categories, selectedCategoryId, onSelectProduct }) {
  // If selectedCategoryId is null, flatten all products from all categories
  const displayedCategories = selectedCategoryId
    ? categories.filter((c) => c.id === selectedCategoryId)
    : categories;

  const totalProducts = displayedCategories.reduce(
    (acc, cat) => acc + (cat.products ? cat.products.length : 0),
    0
  );

  if (totalProducts === 0) {
    return (
      <div className="product-grid-empty">
        <PackageOpen size={48} className="empty-icon" />
        <p>ไม่พบรายการเมนูในหมวดหมู่นี้</p>
      </div>
    );
  }

  return (
    <div className="product-grid-wrapper">
      {displayedCategories.map((cat) => (
        <section key={cat.id} className="category-section">
          <div className="category-header">
            <h2 className="category-title">{cat.name}</h2>
            <span className="category-item-count">{cat.products.length} รายการ</span>
          </div>

          <div className="product-grid">
            {cat.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryId={cat.id}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
