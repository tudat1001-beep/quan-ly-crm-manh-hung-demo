'use strict';

(function attachTemplateEditor(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TemplateEditor = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  const variables = [
    ['Nhận diện', 'banner', 'Banner đầu trang', 'Banner công ty'],
    ['Nhận diện', 'watermark', 'Logo chìm nội bộ', 'Logo chìm'],
    ['Doanh nghiệp', 'company_name', 'Tên doanh nghiệp', 'CÔNG TY TNHH MẠNH HÙNG'],
    ['Doanh nghiệp', 'company_address', 'Địa chỉ doanh nghiệp', 'TP. Hồ Chí Minh'],
    ['Doanh nghiệp', 'company_phone', 'Điện thoại doanh nghiệp', '0901 234 567'],
    ['Doanh nghiệp', 'company_tax_code', 'Mã số thuế doanh nghiệp', '0312345678'],
    ['Chứng từ', 'title', 'Tiêu đề chứng từ', 'BÁO GIÁ'],
    ['Chứng từ', 'number', 'Số chứng từ', 'BG2026-0001'],
    ['Chứng từ', 'date', 'Ngày chứng từ', '11/10/2026'],
    ['Đối tác', 'partner_label', 'Nhãn đối tượng', 'Khách hàng'],
    ['Đối tác', 'partner_name', 'Tên khách hàng / nhà cung cấp', 'Công ty Nội thất An Phát'],
    ['Đối tác', 'partner_address', 'Địa chỉ đối tác', '125 Nguyễn Văn Linh, TP.HCM'],
    ['Đối tác', 'partner_phone', 'Điện thoại đối tác', '028 3822 6688'],
    ['Đối tác', 'partner_tax_code', 'Mã số thuế đối tác', '0319876543'],
    ['Chứng từ', 'warehouse', 'Tên kho', 'Kho chính'],
    ['Bảng và tiền', 'items_table', 'Bảng chi tiết hàng hóa', 'Bảng hàng hóa mẫu'],
    ['Bảng và tiền', 'subtotal', 'Tiền trước thuế', '2.500.000'],
    ['Bảng và tiền', 'vat_total', 'Tổng thuế GTGT', '250.000'],
    ['Bảng và tiền', 'shipping_cost', 'Phí vận chuyển khách trả', '150.000'],
    ['Bảng và tiền', 'shipping_vat_amount', 'VAT phí vận chuyển', '15.000'],
    ['Bảng và tiền', 'shipping_info', 'Thông tin vận chuyển', 'Giao tại kho khách hàng'],
    ['Bảng và tiền', 'total', 'Tổng thanh toán', '2.750.000'],
    ['Bảng và tiền', 'total_words', 'Tổng tiền bằng chữ', 'Hai triệu bảy trăm năm mươi nghìn đồng'],
    ['Chứng từ', 'notes', 'Ghi chú / điều khoản', 'Thanh toán trong vòng 15 ngày.'],
    ['Nhân sự', 'employee_name', 'Tên nhân viên / người đề nghị', 'Nguyễn Văn Minh'],
    ['Nhân sự', 'department', 'Bộ phận / chức vụ', 'Bộ phận sản xuất'],
    ['Nhân sự', 'purpose', 'Mục đích', 'Mua vật tư phục vụ sản xuất'],
    ['Chứng từ', 'reference', 'Số chứng từ tham chiếu', 'CT-2026-001'],
    ['Đề nghị mua', 'needed_date', 'Ngày cần vật tư', '20/10/2026'],
    ['Đề nghị mua', 'project', 'Công trình / đơn hàng', 'Đơn hàng MH-01'],
    ['Đề nghị mua', 'proposed_supplier', 'Nhà cung cấp đề xuất', 'Công ty Thép Việt'],
    ['Đề nghị mua', 'technical_requirements', 'Yêu cầu kỹ thuật', 'Đúng quy cách và chứng chỉ'],
    ['Đề nghị mua', 'reason', 'Lý do mua', 'Bổ sung tồn kho sản xuất'],
    ['Đơn đặt hàng', 'delivery_date', 'Ngày giao hàng', '20/10/2026'],
    ['Đơn đặt hàng', 'delivery_location', 'Địa điểm giao hàng', 'Kho chính'],
    ['Đơn đặt hàng', 'payment_terms', 'Điều kiện thanh toán', 'Chuyển khoản sau khi nhận hàng'],
    ['Đơn đặt hàng', 'quality_requirements', 'Yêu cầu chất lượng', 'Hàng mới 100%, đúng quy cách'],
    ['Đơn đặt hàng', 'warranty', 'Điều kiện bảo hành', 'Bảo hành 12 tháng'],
    ['Đơn đặt hàng', 'documents_required', 'Chứng từ yêu cầu', 'Hóa đơn GTGT, phiếu giao hàng'],
    ['Tạm ứng', 'use_from_date', 'Ngày bắt đầu sử dụng', '11/10/2026'],
    ['Tạm ứng', 'use_to_date', 'Ngày kết thúc sử dụng', '18/10/2026'],
    ['Tạm ứng', 'due_date', 'Hạn thanh toán tạm ứng', '20/10/2026'],
    ['Tạm ứng', 'payment_method', 'Hình thức nhận tiền', 'Chuyển khoản'],
    ['Tạm ứng', 'bank_name', 'Tên ngân hàng', 'Vietcombank'],
    ['Tạm ứng', 'bank_account', 'Số tài khoản', '0123456789'],
    ['Tạm ứng', 'document_count', 'Số chứng từ kèm theo', '3'],
    ['Tạm ứng', 'advance_balance_before', 'Số tạm ứng trước quyết toán', '5.000.000'],
    ['Tạm ứng', 'settlement_difference', 'Chênh lệch sau quyết toán', '500.000']
  ].map(([group, name, label, sample]) => ({ group, name, label, sample }));

  const titles = {
    QUOTE_FULL: 'BÁO GIÁ', QUOTE_PROCESSING: 'BÁO GIÁ GIA CÔNG', QUOTE_PAINT: 'BÁO GIÁ SƠN TĨNH ĐIỆN', SALE: 'PHIẾU XUẤT BÁN',
    PURCHASE_ORDER: 'ĐƠN ĐẶT HÀNG', PURCHASE_REQUEST: 'PHIẾU ĐỀ NGHỊ MUA VẬT TƯ, THIẾT BỊ',
    ADVANCE_REQUEST: 'GIẤY ĐỀ NGHỊ TẠM ỨNG', ADVANCE_SETTLEMENT: 'GIẤY THANH TOÁN TIỀN TẠM ỨNG'
  };

  const layouts = {
    QUOTE_FULL: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN KHÁCH HÀNG',
      infoText: '{{partner_label}}: {{partner_name}}\nĐịa chỉ: {{partner_address}}\nĐiện thoại: {{partner_phone}} · MST: {{partner_tax_code}}\nKho xuất: {{warehouse}}',
      tableHeading: 'NỘI DUNG BÁO GIÁ', summaryText: 'Tạm tính: {{subtotal}} đồng\nPhí vận chuyển: {{shipping_cost}} đồng\nThuế GTGT: {{vat_total}} đồng\nTỔNG THANH TOÁN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Ghi chú / điều khoản: {{notes}}', signaturesText: 'NGƯỜI LẬP\nKHÁCH HÀNG\nĐẠI DIỆN CÔNG TY'
    },
    QUOTE_PROCESSING: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN KHÁCH HÀNG',
      infoText: '{{partner_label}}: {{partner_name}}\nĐịa chỉ: {{partner_address}}\nĐiện thoại: {{partner_phone}} · MST: {{partner_tax_code}}\nKho xuất: {{warehouse}}',
      tableHeading: 'NỘI DUNG GIA CÔNG', summaryText: 'Tạm tính: {{subtotal}} đồng\nPhí vận chuyển: {{shipping_cost}} đồng\nThuế GTGT: {{vat_total}} đồng\nTỔNG THANH TOÁN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Ghi chú / điều khoản: {{notes}}', signaturesText: 'NGƯỜI LẬP\nKHÁCH HÀNG\nĐẠI DIỆN CÔNG TY'
    },
    QUOTE_PAINT: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN KHÁCH HÀNG',
      infoText: '{{partner_label}}: {{partner_name}}\nĐịa chỉ: {{partner_address}}\nĐiện thoại: {{partner_phone}} · MST: {{partner_tax_code}}\nKho xuất: {{warehouse}}',
      tableHeading: 'NỘI DUNG SƠN TĨNH ĐIỆN', summaryText: 'Tạm tính: {{subtotal}} đồng\nPhí vận chuyển: {{shipping_cost}} đồng\nThuế GTGT: {{vat_total}} đồng\nTỔNG THANH TOÁN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Vận chuyển: {{shipping_info}}\nGhi chú / điều khoản: {{notes}}', signaturesText: 'NGƯỜI LẬP\nKHÁCH HÀNG\nĐẠI DIỆN CÔNG TY'
    },
    SALE: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN GIAO HÀNG',
      infoText: 'Khách hàng: {{partner_name}}\nĐịa chỉ: {{partner_address}}\nĐiện thoại: {{partner_phone}}\nKho xuất: {{warehouse}}',
      tableHeading: 'HÀNG HÓA XUẤT BÁN', summaryText: 'Tạm tính: {{subtotal}} đồng\nPhí vận chuyển: {{shipping_cost}} đồng\nThuế GTGT: {{vat_total}} đồng\nTỔNG THANH TOÁN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Vận chuyển: {{shipping_info}}\nGhi chú: {{notes}}', signaturesText: 'NGƯỜI LẬP\nTHỦ KHO\nNGƯỜI NHẬN'
    },
    PURCHASE_ORDER: {
      metaText: 'Số đơn hàng: {{number}} · Ngày đặt hàng: {{date}}', infoHeading: 'THÔNG TIN ĐẶT HÀNG',
      infoText: 'Nhà cung cấp: {{partner_name}}\nMã số thuế: {{partner_tax_code}}\nĐịa chỉ: {{partner_address}} · Điện thoại: {{partner_phone}}\nBên đặt hàng: {{company_name}} · {{company_phone}}\nCông trình / bộ phận: {{project}}\nNgày giao: {{delivery_date}} · Địa điểm: {{delivery_location}}',
      tableHeading: 'DANH MỤC HÀNG HÓA / VẬT TƯ / THIẾT BỊ', summaryText: 'Tạm tính: {{subtotal}} đồng\nThuế GTGT: {{vat_total}} đồng\nVận chuyển / chi phí khác: {{shipping_cost}} đồng\nTỔNG THANH TOÁN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Thanh toán: {{payment_terms}}\nChất lượng: {{quality_requirements}}\nBảo hành / đổi trả: {{warranty}}\nChứng từ yêu cầu: {{documents_required}}\nGhi chú: {{notes}}',
      signaturesText: 'NGƯỜI LẬP ĐƠN\nĐẠI DIỆN BÊN ĐẶT HÀNG\nXÁC NHẬN NHÀ CUNG CẤP'
    },
    PURCHASE_REQUEST: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN ĐỀ NGHỊ',
      infoText: 'Bộ phận: {{department}}\nNgười đề nghị: {{employee_name}}\nCông trình / đơn hàng: {{project}}\nMục đích: {{purpose}}\nThời gian cần: {{needed_date}}',
      tableHeading: 'DANH MỤC VẬT TƯ, THIẾT BỊ ĐỀ NGHỊ MUA', summaryText: 'TỔNG GIÁ TRỊ DỰ KIẾN: {{total}} đồng\nBằng chữ: {{total_words}}',
      notesText: 'Nhà cung cấp đề xuất: {{proposed_supplier}}\nYêu cầu kỹ thuật: {{technical_requirements}}\nLý do mua: {{reason}}\nHồ sơ kèm theo / ghi chú: {{notes}}',
      signaturesText: 'NGƯỜI ĐỀ NGHỊ\nTRƯỞNG BỘ PHẬN\nMUA HÀNG / KẾ TOÁN\nGIÁM ĐỐC'
    },
    ADVANCE_REQUEST: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN TẠM ỨNG',
      infoText: 'Kính gửi: Ban Giám đốc {{company_name}}\nNgười đề nghị: {{employee_name}}\nBộ phận / chức vụ: {{department}}\nSố tiền đề nghị: {{total}} đồng\nBằng chữ: {{total_words}}\nMục đích: {{purpose}}\nThời gian sử dụng: {{use_from_date}} đến {{use_to_date}}\nHạn thanh toán: {{due_date}}\nHình thức nhận: {{payment_method}}\nNgân hàng / số tài khoản: {{bank_name}} / {{bank_account}}',
      tableHeading: 'NỘI DUNG CHI', summaryText: '', notesText: 'Ghi chú: {{notes}}',
      signaturesText: 'NGƯỜI ĐỀ NGHỊ\nTRƯỞNG BỘ PHẬN\nKẾ TOÁN\nGIÁM ĐỐC'
    },
    ADVANCE_SETTLEMENT: {
      metaText: 'Số: {{number}} · Ngày: {{date}}', infoHeading: 'THÔNG TIN THANH TOÁN',
      infoText: 'Bộ phận: {{department}}\nNgười thanh toán: {{employee_name}}\nNội dung / mục đích: {{purpose}}\nChứng từ tham chiếu: {{reference}}',
      tableHeading: 'NỘI DUNG THANH TOÁN / HOÀN ỨNG', summaryText: 'Tạm ứng trước quyết toán: {{advance_balance_before}} đồng\nThanh toán / hoàn ứng: {{total}} đồng\nCHÊNH LỆCH SAU QUYẾT TOÁN: {{settlement_difference}} đồng\nSố chứng từ kèm theo: {{document_count}}',
      notesText: 'Ghi chú: {{notes}}', signaturesText: 'NGƯỜI THANH TOÁN\nKẾ TOÁN\nKẾ TOÁN TRƯỞNG\nGIÁM ĐỐC'
    }
  };

  function defaultLayout(documentType) {
    return {
      showBanner: true, showWatermark: true, title: titles[documentType] || 'CHỨNG TỪ',
      showMeta: true, showInfo: true, showTable: true, showSummary: true, showNotes: true, showSignatures: true,
      ...(layouts[documentType] || layouts.QUOTE_FULL)
    };
  }

  const textHtml = value => esc(value).replace(/\r?\n/g, '<br>');
  function buildContent(layout) {
    const block = { ...defaultLayout('QUOTE_FULL'), ...(layout || {}) };
    const signatures = String(block.signaturesText || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    return [
      block.showBanner || block.showWatermark ? `<div class="brand-images">${block.showBanner ? '{{banner}}' : ''}${block.showWatermark ? '{{watermark}}' : ''}</div>` : '',
      `<h1>${textHtml(block.title)}</h1>`,
      block.showMeta ? `<div class="meta">${textHtml(block.metaText)}</div>` : '',
      block.showInfo ? `<section class="print-block">${block.infoHeading ? `<h2>${textHtml(block.infoHeading)}</h2>` : ''}<div class="party">${textHtml(block.infoText)}</div></section>` : '',
      block.showTable ? `<section class="print-block">${block.tableHeading ? `<h2>${textHtml(block.tableHeading)}</h2>` : ''}{{items_table}}</section>` : '',
      block.showSummary && block.summaryText ? `<div class="totals">${textHtml(block.summaryText)}</div>` : '',
      block.showNotes && block.notesText ? `<div class="notes">${textHtml(block.notesText)}</div>` : '',
      block.showSignatures && signatures.length ? `<div class="signatures">${signatures.map(value => `<div><strong>${textHtml(value)}</strong><small>(Ký, ghi rõ họ tên)</small></div>`).join('')}</div>` : ''
    ].filter(Boolean).join('\n');
  }

  function sanitize(content) {
    return String(content || '')
      .replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|svg)[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|svg)\b[^>]*\/?\s*>/gi, '')
      .replace(/\s(on\w+|src|href|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  function render(content, documentType, options = {}) {
    const sample = Object.fromEntries(variables.map(item => [item.name, esc(item.sample)]));
    sample.title = esc(titles[documentType] || 'CHỨNG TỪ');
    sample.banner = options.banner ? `<img class="preview-banner-image" src="${esc(options.banner)}" alt="Banner">` : '<div class="preview-banner">CÔNG TY TNHH MẠNH HÙNG</div>';
    sample.watermark = '<div class="preview-watermark">LOGO NỘI BỘ</div>';
    sample.items_table = '<table><thead><tr><th>STT</th><th>Nội dung</th><th>ĐVT</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody><tr><td>1</td><td>Gia công chi tiết thép theo bản vẽ</td><td>Cái</td><td>2</td><td>2.750.000</td></tr></tbody></table>';
    return sanitize(content).replace(/\{\{([a-z_]+)\}\}/g, (_match, key) => sample[key] ?? `<span class="unknown-variable">{{${esc(key)}}}</span>`);
  }

  return { variables, sanitize, render, defaultLayout, buildContent };
});
