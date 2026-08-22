export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

// Flat platform fee charged to hold/confirm a slot — separate from and unrelated to the
// doctor's own consultation fee (paid at the clinic, not through the app).
export const BOOKING_FEE_VND = 150_000;
