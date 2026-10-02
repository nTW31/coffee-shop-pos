import React from 'react';
import { Coffee, CupSoda, Croissant, Sparkles, LayoutGrid } from 'lucide-react';

const CATEGORY_ICONS = {
  'กาแฟ': Coffee,
  'ชา': CupSoda,
  'ปั่น/สมูทตี้': Sparkles,
  'เบเกอรี่': Croissant,
};

export default function CategoryTabs({ categories, selectedCategoryId, onSelectCategory }) {
  return (
    <div className="category-tabs-container">
      <button
        className={`cat-pill-btn ${selectedCategoryId === null ? 'active' : ''}`}
        onClick={() => onSelectCategory(null)}
      >
        <LayoutGrid size={18} />
        <span>ทั้งหมด</span>
      </button>

      {categories.map((cat) => {
        const IconComponent = CATEGORY_ICONS[cat.name] || Coffee;
        const count = cat.products ? cat.products.length : 0;
        return (
          <button
            key={cat.id}
            className={`cat-pill-btn ${selectedCategoryId === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <IconComponent size={18} />
            <span>{cat.name}</span>
            <span className="cat-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
