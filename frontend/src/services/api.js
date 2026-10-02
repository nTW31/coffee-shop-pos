/**
 * Client API Service for Coffee Shop POS
 * Interacts with Backend REST endpoints
 */

const API_BASE = "/api";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch products: ${res.statusText}`);
  }
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถสร้างออเดอร์ได้");
  }
  return data;
}

export async function fetchQueue() {
  const res = await fetch(`${API_BASE}/orders/queue`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch queue: ${res.statusText}`);
  }
  return res.json();
}

export async function updateOrderStatus(orderId, newStatus) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
  }
  return data;
}

export async function cancelOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถยกเลิกออเดอร์ได้");
  }
  return data;
}
