'use strict';

(function expose(root) {
  function parseLocaleNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let text = String(value ?? '').trim().replace(/\s/g, '');
    if (!text) return 0;
    const comma = text.lastIndexOf(',');
    const dot = text.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      text = comma > dot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
    } else if (comma >= 0) {
      text = text.replace(',', '.');
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, '');
    }
    const result = Number(text.replace(/[^\d.-]/g, ''));
    return Number.isFinite(result) ? result : 0;
  }

  function formatIntegerInput(value) {
    const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    return digits ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits)) : '';
  }

  const api = { parseLocaleNumber, formatIntegerInput };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NumberFormatVi = api;
})(typeof window !== 'undefined' ? window : null);
