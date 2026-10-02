import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ShoppingCart } from 'lucide-react';

export default function CustomizationModal({
  product,
  options,
  onClose,
  onAddToCart,
}) {
  const sizeOptions = options.size || [];
  const sweetnessOptions = options.sweetness || [];
  const toppingOptions = options.topping || [];

  // Default to first size if available (e.g. S) or null
  const [selectedSizeId, setSelectedSizeId] = useState(
    sizeOptions.length > 0 ? sizeOptions[0].id : null
  );
  // Default to normal sweetness (e.g. 100% or 50%)
  const [selectedSweetnessId, setSelectedSweetnessId] = useState(
    sweetnessOptions.length > 2 ? sweetnessOptions[2].id : (sweetnessOptions[0]?.id || null)
  );
  // Selected topping IDs
  const [selectedToppingIds, setSelectedToppingIds] = useState([]);
  // Quantity
  const [quantity, setQuantity] = useState(1);
  // Error state for validation (FR-03)
  const [errorMsg, setErrorMsg] = useState('');

  // Toggle topping
  const toggleTopping = (toppingId) => {
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  // Calculate Unit Price
  const basePrice = parseFloat(product?.base_price || 0);
  const sizeExtra = parseFloat(
    sizeOptions.find((s) => s.id === selectedSizeId)?.extra_price || 0
  );
  const toppingsExtra = selectedToppingIds.reduce((sum, tid) => {
    const t = toppingOptions.find((item) => item.id === tid);
    return sum + (t ? parseFloat(t.extra_price) : 0);
  }, 0);

  const unitPrice = basePrice + sizeExtra + toppingsExtra;
  const subtotal = unitPrice * quantity;

  const handleConfirm = () => {
    // Validate required size (FR-03)
    if (!selectedSizeId) {
      setErrorMsg('กรุณาเลือกขนาดเครื่องดื่ม (Size)');
      return;
    }

    const selectedSize = sizeOptions.find((s) => s.id === selectedSizeId);
    const selectedSweetness = sweetnessOptions.find((sw) => sw.id === selectedSweetnessId);
    const selectedToppings = toppingOptions.filter((tp) => selectedToppingIds.includes(tp.id));

    onAddToCart({
      product,
      productId: product.id,
      quantity,
      sizeId: selectedSizeId,
      sizeName: selectedSize?.name || '',
      sweetnessId: selectedSweetnessId,
      sweetnessName: selectedSweetness?.name || '',
      toppingIds: selectedToppingIds,
      toppingNames: selectedToppings.map((t) => t.name),
      unitPrice,
      subtotal,
    });
    onClose();
  };

  if (!product) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-customization" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{product.name}</h2>
            <span className="modal-base-price">ราคาเริ่มต้น ฿{basePrice.toFixed(2)}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="validation-alert animate-fadeIn">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body custom-scroll">
          {/* Section 1: ขนาด (Size) - บังคับเลือก (FR-03) */}
          <div className="custom-section">
            <div className="section-label-group">
              <label className="section-label">
                ขนาดเครื่องดื่ม <span className="required-tag">*จำเป็น</span>
              </label>
            </div>
            <div className="options-pill-grid">
              {sizeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  className={`option-card-btn ${selectedSizeId === opt.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSizeId(opt.id);
                    setErrorMsg('');
                  }}
                >
                  <div className="opt-main-info">
                    <span className="opt-name">{opt.name}</span>
                    {Number(opt.extra_price) > 0 && (
                      <span className="opt-extra">+{Number(opt.extra_price).toFixed(2)}฿</span>
                    )}
                  </div>
                  {selectedSizeId === opt.id && <Check size={16} className="opt-check-icon" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: ระดับความหวาน (Sweetness) */}
          {sweetnessOptions.length > 0 && (
            <div className="custom-section">
              <label className="section-label">ระดับความหวาน</label>
              <div className="sweetness-pill-bar">
                {sweetnessOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    className={`sweetness-btn ${selectedSweetnessId === opt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSweetnessId(opt.id)}
                  >
                    {opt.name.replace(' (', '\n(')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: ท็อปปิง (Toppings) */}
          {toppingOptions.length > 0 && (
            <div className="custom-section">
              <label className="section-label">เพิ่มท็อปปิง (เลือกได้หลายอย่าง)</label>
              <div className="toppings-grid">
                {toppingOptions.map((opt) => {
                  const isChecked = selectedToppingIds.includes(opt.id);
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      className={`topping-item-btn ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleTopping(opt.id)}
                    >
                      <div className="topping-checkbox">
                        {isChecked && <Check size={14} />}
                      </div>
                      <span className="topping-name">{opt.name}</span>
                      <span className="topping-price">+{Number(opt.extra_price).toFixed(2)}฿</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: จำนวน (Quantity) */}
          <div className="custom-section quantity-section">
            <label className="section-label">จำนวน</label>
            <div className="quantity-controller">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={18} />
              </button>
              <span className="qty-number">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-footer-price">
            <span className="footer-price-label">ราคารวม ({quantity} รายการ)</span>
            <span className="footer-total-price">฿{subtotal.toFixed(2)}</span>
          </div>

          <button className="confirm-add-btn" onClick={handleConfirm}>
            <ShoppingCart size={18} />
            <span>ใส่ตะกร้า • ฿{subtotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
