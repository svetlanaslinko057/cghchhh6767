// Global quick-order modal bus: any "Замовити переклад" CTA opens the compact
// order form so the lead reaches admin «Заявки» as fast as possible.
export function openOrderModal(detail = {}) {
  window.dispatchEvent(new CustomEvent('order-modal:open', { detail }));
}
