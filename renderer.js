'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const money = value => new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0));
const number = value => window.NumberFormatVi.parseLocaleNumber(value);
const moneyInput = value => window.NumberFormatVi.formatIntegerInput(value);
const today = () => new Date().toISOString().slice(0, 10);

const state = { bootstrap: null, page: 'dashboard', selectedInvoiceFile: null };
const pageMeta = {
  dashboard: ['Tổng quan', 'Tình hình hoạt động trên một màn hình'],
  quotes: ['Báo giá', 'Tính giá theo kích thước và chuyển sang xuất bán'],
  sales: ['Xuất bán', 'Các phiếu đã chuyển từ báo giá'],
  'purchase-orders': ['Đơn đặt hàng', 'Đặt mua và nhận hàng vào kho'],
  'purchase-requests': ['Đề nghị mua', 'Đề nghị và phê duyệt nhu cầu vật tư, thiết bị'],
  inventory: ['Tồn kho', 'Số lượng tồn và lịch sử nhập xuất'],
  'stock-documents': ['Nhập xuất kho', 'Nhập mua, bán trực tiếp, chuyển kho và trả hàng'],
  finance: ['Thu chi & quỹ', 'Thu khách hàng, chi nhà cung cấp, chuyển quỹ và tạm ứng'],
  'invoice-files': ['Hóa đơn đầu vào/ra', 'Lưu file hóa đơn theo tháng và ghi chú'],
  debts: ['Công nợ', 'Phải thu khách hàng và phải trả nhà cung cấp'],
  reports: ['Báo cáo', 'Tổng hợp doanh thu, giá vốn và lãi lỗ'],
  products: ['Hàng hóa', 'Danh mục hàng hóa và vật tư'],
  customers: ['Khách hàng', 'Danh mục khách hàng'],
  suppliers: ['Nhà cung cấp', 'Danh mục nhà cung cấp'],
  warehouses: ['Kho', 'Danh mục kho hàng'],
  employees: ['Nhân viên', 'Danh mục nhân viên và người nhận tạm ứng'],
  cash_accounts: ['Quỹ / tài khoản', 'Tiền mặt và tài khoản ngân hàng'],
  income_expense_categories: ['Hạng mục thu chi', 'Phân loại các khoản thu và chi'],
  'print-templates': ['Mẫu in', 'Thêm, sửa và chọn mẫu mặc định bằng các biến'],
  settings: ['Cài đặt & sao lưu', 'Thông tin doanh nghiệp và an toàn dữ liệu']
};

const masterConfig = {
  products: {
    title: 'Hàng hóa', fields: [
      ['code', 'Mã hàng', 'text'], ['name', 'Tên hàng', 'text'], ['unit', 'Đơn vị', 'text'],
      ['purchase_price', 'Giá nhập', 'money'], ['sale_price', 'Giá bán', 'money'], ['vat_rate', 'VAT (%)', 'number']
    ], columns: [['code', 'Mã'], ['name', 'Tên hàng'], ['unit', 'ĐVT'], ['purchase_price', 'Giá nhập', 'money'], ['sale_price', 'Giá bán', 'money'], ['vat_rate', 'VAT (%)']]
  },
  customers: {
    title: 'Khách hàng', fields: [['code', 'Mã KH', 'text'], ['name', 'Tên khách hàng', 'text'], ['phone', 'Điện thoại', 'text'], ['tax_code', 'Mã số thuế', 'text'], ['address', 'Địa chỉ', 'text', 2]],
    columns: [['code', 'Mã'], ['name', 'Tên khách hàng'], ['phone', 'Điện thoại'], ['tax_code', 'MST'], ['address', 'Địa chỉ']]
  },
  suppliers: {
    title: 'Nhà cung cấp', fields: [['code', 'Mã NCC', 'text'], ['name', 'Tên nhà cung cấp', 'text'], ['phone', 'Điện thoại', 'text'], ['tax_code', 'Mã số thuế', 'text'], ['address', 'Địa chỉ', 'text', 2]],
    columns: [['code', 'Mã'], ['name', 'Tên nhà cung cấp'], ['phone', 'Điện thoại'], ['tax_code', 'MST'], ['address', 'Địa chỉ']]
  },
  warehouses: {
    title: 'Kho', fields: [['code', 'Mã kho', 'text'], ['name', 'Tên kho', 'text'], ['address', 'Địa chỉ', 'text', 2]],
    columns: [['code', 'Mã'], ['name', 'Tên kho'], ['address', 'Địa chỉ']]
  },
  employees: {
    title: 'Nhân viên', fields: [['code', 'Mã NV', 'text'], ['name', 'Tên nhân viên', 'text'], ['phone', 'Điện thoại', 'text'], ['address', 'Địa chỉ', 'text']],
    columns: [['code', 'Mã'], ['name', 'Tên nhân viên'], ['phone', 'Điện thoại'], ['address', 'Địa chỉ']]
  },
  cash_accounts: {
    title: 'Quỹ / tài khoản', fields: [['code', 'Mã quỹ', 'text'], ['name', 'Tên quỹ / ngân hàng', 'text'], ['opening_balance', 'Số dư đầu', 'money']],
    columns: [['code', 'Mã'], ['name', 'Tên quỹ / ngân hàng'], ['opening_balance', 'Số dư đầu', 'money']]
  },
  income_expense_categories: {
    title: 'Hạng mục thu chi', fields: [['code', 'Mã', 'text'], ['name', 'Tên hạng mục', 'text'], ['transaction_type', 'Loại', 'transaction_type'], ['affects_profit', 'Tính lãi lỗ', 'boolean']],
    columns: [['code', 'Mã'], ['name', 'Tên hạng mục'], ['transaction_type', 'Loại'], ['affects_profit', 'Tính lãi lỗ', 'boolean']]
  }
};

function toast(message, error = false) {
  const node = $('#toast');
  node.textContent = message;
  node.className = `toast show${error ? ' error' : ''}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.className = 'toast', 3200);
}

function openModal(html) { $('#modal-body').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal-body').innerHTML = ''; }
function options(rows, selected = '') { return rows.map(row => `<option value="${row.id}" ${String(row.id) === String(selected) ? 'selected' : ''}>${esc(row.code)} — ${esc(row.name)}</option>`).join(''); }
function statusLabel(status) { return ({ DRAFT: 'Nháp', SENT: 'Đã gửi', WON: 'Đã chốt', CONVERTED: 'Đã xuất', CANCELLED: 'Đã hủy', RECEIVED: 'Đã nhận', POSTED: 'Đã ghi sổ' })[status] || status; }
function badge(status) { return `<span class="badge ${status}">${statusLabel(status)}</span>`; }
const quoteTypeLabels = { FULL_SERVICE: 'Vật tư + gia công', CUSTOMER_MATERIAL: 'Chỉ gia công' };

async function refreshBootstrap() { state.bootstrap = await window.crm.bootstrap(); }

async function navigate(page) {
  state.page = page;
  $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.page === page));
  $('#page-title').textContent = pageMeta[page][0];
  $('#page-subtitle').textContent = pageMeta[page][1];
  $('#content').innerHTML = '<div class="panel">Đang tải dữ liệu…</div>';
  try {
    if (page === 'dashboard') await renderDashboard();
    else if (masterConfig[page]) await renderMaster(page);
    else if (page === 'quotes') await renderQuotes();
    else if (page === 'sales') await renderSales();
    else if (page === 'purchase-orders') await renderPurchaseOrders();
    else if (page === 'purchase-requests') await renderPurchaseRequests();
    else if (page === 'inventory') await renderInventory();
    else if (page === 'stock-documents') await renderStockDocuments();
    else if (page === 'finance') await renderFinance();
    else if (page === 'invoice-files') await renderInvoiceFiles();
    else if (page === 'debts') await renderDebts();
    else if (page === 'reports') await renderReports();
    else if (page === 'print-templates') await renderPrintTemplates();
    else if (page === 'settings') renderSettings();
  } catch (error) { $('#content').innerHTML = `<div class="panel"><strong>Không tải được dữ liệu:</strong> ${esc(error.message)}</div>`; }
}

async function renderDashboard() {
  await refreshBootstrap();
  const s = state.bootstrap.stats;
  $('#content').innerHTML = `<div class="cards">
    <div class="stat-card"><span>Báo giá</span><strong>${s.quotes}</strong><em>Tổng số chứng từ</em></div>
    <div class="stat-card"><span>Phiếu xuất bán</span><strong>${s.sales}</strong><em>Đã ghi nhận</em></div>
    <div class="stat-card"><span>Đơn đặt hàng</span><strong>${s.purchaseOrders}</strong><em>Tổng số đơn</em></div>
    <div class="stat-card"><span>Giá trị tồn tham khảo</span><strong>${money(s.stockValue)} ₫</strong><em>Theo giá nhập danh mục</em></div>
  </div><div class="panel"><div class="panel-head"><div><h2>Bắt đầu nhanh</h2><p>Các nghiệp vụ cốt lõi</p></div></div><div class="quick-links">
    <button class="quick-link" data-go="quotes"><strong>+ Lập báo giá</strong><span>Tính giá theo kích thước, nhân công và chi phí</span></button>
    <button class="quick-link" data-go="purchase-orders"><strong>+ Lập đơn đặt hàng</strong><span>Đặt hàng nhà cung cấp và nhập kho</span></button>
    <button class="quick-link" data-go="inventory"><strong>Xem tồn kho</strong><span>Kiểm tra số lượng và lịch sử biến động</span></button>
  </div><div class="hint">Bản đầu tiên đang dùng quy tắc giá hình chữ nhật. Trước khi dùng số liệu để chào giá chính thức, hãy kiểm tra lại đơn vị chi phí và quy tắc hao hụt với file Excel gốc.</div></div>`;
}

async function renderMaster(type) {
  const cfg = masterConfig[type];
  const rows = await window.crm.listMaster(type);
  const head = cfg.columns.map(([, label]) => `<th>${label}</th>`).join('');
  const display = (row, key, format) => format === 'money' ? money(row[key]) : format === 'boolean' ? (Number(row[key]) ? 'Có' : 'Không') : key === 'transaction_type' ? (row[key] === 'RECEIPT' ? 'Thu' : 'Chi') : esc(row[key]);
  const body = rows.length ? rows.map(row => `<tr>${cfg.columns.map(([key,, format]) => `<td class="${format === 'money' ? 'num' : ''}">${display(row, key, format)}</td>`).join('')}<td class="actions"><button class="btn small" data-master-edit="${type}" data-id="${row.id}">Sửa</button><button class="btn small danger" data-master-delete="${type}" data-id="${row.id}">Xóa</button></td></tr>`).join('') : '<tr><td class="empty" colspan="10">Chưa có dữ liệu</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Danh sách ${cfg.title.toLowerCase()}</h2><p>${rows.length} bản ghi đang hoạt động</p></div><button class="btn primary" data-master-new="${type}">+ Thêm mới</button></div><div class="table-wrap"><table><thead><tr>${head}<th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  state.masterRows = rows;
}

function showMasterForm(type, id) {
  const cfg = masterConfig[type];
  const row = (state.masterRows || []).find(item => item.id === Number(id)) || {};
  const fields = cfg.fields.map(([key, label, inputType, span]) => {
    if (inputType === 'transaction_type') return `<div class="field"><label>${label}</label><select name="${key}"><option value="RECEIPT" ${row[key] === 'RECEIPT' ? 'selected' : ''}>Thu</option><option value="PAYMENT" ${row[key] !== 'RECEIPT' ? 'selected' : ''}>Chi</option></select></div>`;
    if (inputType === 'boolean') return `<div class="field"><label>${label}</label><select name="${key}"><option value="1" ${Number(row[key] ?? 1) ? 'selected' : ''}>Có</option><option value="0" ${!Number(row[key] ?? 1) ? 'selected' : ''}>Không</option></select></div>`;
    return `<div class="field ${span ? `span-${span}` : ''}"><label>${label}</label><input name="${key}" type="${inputType === 'money' ? 'text' : inputType}" ${inputType === 'money' ? 'inputmode="numeric" class="money-input"' : ''} value="${esc(inputType === 'money' ? moneyInput(row[key] ?? '') : row[key] ?? '')}" ${key === 'code' || key === 'name' ? 'required' : ''}></div>`;
  }).join('');
  openModal(`<h2>${id ? 'Sửa' : 'Thêm'} ${cfg.title.toLowerCase()}</h2><form id="master-form" data-type="${type}" data-id="${id || ''}"><div class="form-grid">${fields}</div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function renderQuotes() {
  const rows = await window.crm.listQuotes();
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.quote_date)}</td><td>${esc(row.customer_name)}</td><td>${esc(quoteTypeLabels[row.quote_type] || quoteTypeLabels.FULL_SERVICE)}</td><td>${esc(row.warehouse_name)}</td><td>${badge(row.status)}</td><td class="num"><strong>${money(row.total)} ₫</strong></td><td><div class="actions">
    <button class="btn small" data-doc-preview="quote" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="quote" data-id="${row.id}">PDF</button>
    ${row.status !== 'CONVERTED' ? `<button class="btn small" data-quote-detail data-id="${row.id}">Chi tiết / Sửa</button>` : ''}
    ${row.status === 'DRAFT' ? `<button class="btn small" data-quote-status="SENT" data-id="${row.id}">Đã gửi</button>` : ''}
    ${['DRAFT','SENT'].includes(row.status) ? `<button class="btn small teal" data-quote-status="WON" data-id="${row.id}">Chốt</button>` : ''}
    ${row.status === 'WON' ? `<button class="btn small primary" data-quote-convert data-id="${row.id}">Xuất bán</button>` : ''}
    ${!['CONVERTED','CANCELLED'].includes(row.status) ? `<button class="btn small danger" data-quote-status="CANCELLED" data-id="${row.id}">Hủy</button>` : ''}
    ${row.status !== 'CONVERTED' ? `<button class="btn small danger" data-quote-delete data-id="${row.id}">Xóa</button>` : ''}
  </div></td></tr>`).join('') : '<tr><td class="empty" colspan="8">Chưa có báo giá</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Danh sách báo giá</h2><p>Hai loại: cung cấp vật tư + gia công hoặc chỉ nhận gia công</p></div><button class="btn primary" id="new-quote">+ Lập báo giá</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Khách hàng</th><th>Loại báo giá</th><th>Kho</th><th>Trạng thái</th><th class="num">Tổng tiền</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

function quoteLine(index = Date.now()) {
  const b = state.bootstrap;
  return `<div class="line-card quote-line" data-index="${index}"><button type="button" class="btn small danger remove-line">Xóa dòng</button><div class="line-grid">
    <div class="field"><label>Vật tư trừ kho</label><select name="productId"><option value="">Không trừ kho</option>${options(b.products)}</select></div>
    <div class="field"><label>Tên sản phẩm *</label><input name="description" required></div><div class="field"><label>ĐVT</label><input name="unit" value="cái"></div>
    <div class="field"><label>Số lượng *</label><input name="quantity" type="number" min="0.001" step="any" value="1" required></div><div class="field"><label>SL tiêu hao kho</label><input name="stockQuantity" type="number" min="0" step="any" value="0"></div>
    <div class="field"><label>Dài (mm)</label><input name="lengthMm" type="number" min="0" step="any"></div><div class="field"><label>Rộng (mm)</label><input name="widthMm" type="number" min="0" step="any"></div><div class="field"><label>Dày (mm)</label><input name="thicknessMm" type="number" min="0" step="any"></div>
    <div class="field"><label>Tỷ trọng</label><input name="density" type="number" min="0" step="any" value="7.85"></div><div class="field"><label>Giá vật liệu/kg</label><input name="materialPricePerKg" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Giờ gia công</label><input name="laborHours" type="number" min="0" step="any"></div><div class="field"><label>Đơn giá/giờ</label><input name="laborRatePerHour" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Số người</label><input name="workerCount" type="number" min="1" step="any" value="1"></div>
    <div class="field"><label>VT Tiêu hao/SP</label><input name="consumablesPerItem" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Điện (kWh)</label><input name="electricityKwh" type="number" min="0" step="any"></div><div class="field"><label>Giá điện/kWh</label><input name="electricityRate" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Khấu hao MMTB/giờ</label><input name="depreciationPerHour" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Số mặt sơn</label><input name="coatingSides" type="number" min="1" step="1" value="1"></div><div class="field"><label>Giá sơn/m²</label><input name="coatingPricePerM2" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Hao hụt (%)</label><input name="wastePercent" type="number" min="0" step="any" value="0"></div><div class="field"><label>Lợi nhuận (%)</label><input name="profitPercent" type="number" min="0" step="any" value="15"></div><div class="field"><label>VAT (%)</label><input name="vatPercent" type="number" min="0" step="any" value="10"></div>
  </div><div class="line-total"><span>Khối lượng: <b data-result="weight">0</b> kg</span><span>Giá vốn: <b data-result="cost">0</b> ₫</span><span>Thành tiền: <strong data-result="total">0 ₫</strong></span></div></div>`;
}

function quoteItemFromDb(item) {
  const fields = { productId: 'product_id', description: 'description', unit: 'unit', quantity: 'quantity', stockQuantity: 'stock_quantity',
    lengthMm: 'length_mm', widthMm: 'width_mm', thicknessMm: 'thickness_mm', density: 'density', materialPricePerKg: 'material_price_per_kg',
    laborHours: 'labor_hours', laborRatePerHour: 'labor_rate_per_hour', workerCount: 'worker_count', consumablesPerItem: 'consumables_per_item',
    electricityKwh: 'electricity_kwh', electricityRate: 'electricity_rate', depreciationPerHour: 'depreciation_per_hour', coatingSides: 'coating_sides',
    coatingPricePerM2: 'coating_price_per_m2', wastePercent: 'waste_percent', profitPercent: 'profit_percent', vatPercent: 'vat_percent' };
  return Object.fromEntries(Object.entries(fields).map(([key, source]) => [key, item[source]]));
}

function updateQuoteCustomerInfo() {
  const select = $('#quote-form [name="customerId"]');
  const box = $('#quote-customer-info');
  if (!select || !box) return;
  const customer = state.bootstrap.customers.find(row => row.id === Number(select.value));
  box.innerHTML = customer ? `<strong>${esc(customer.name)}</strong> · ${esc(customer.phone || 'Chưa có SĐT')} · MST: ${esc(customer.tax_code || '—')}<br>${esc(customer.address || 'Chưa có địa chỉ')} <button type="button" class="btn small" data-quote-customer-edit data-id="${customer.id}">Sửa khách hàng</button>` : '';
}

async function showQuoteForm(id) {
  await refreshBootstrap();
  if (!state.bootstrap.customers.length || !state.bootstrap.products.length) return toast('Cần tạo khách hàng và hàng hóa trước.', true);
  const quote = id ? await window.crm.getQuote(Number(id)) : null;
  const items = quote ? quote.items.map(quoteItemFromDb) : [{}];
  openModal(`<h2>${quote ? `Chi tiết / Sửa ${esc(quote.number)}` : 'Lập báo giá mới'}</h2><form id="quote-form" data-id="${quote?.id || ''}"><div class="form-grid">
    <div class="field"><label>Ngày báo giá</label><input name="date" type="date" value="${esc(quote?.quote_date || today())}" required></div>
    <div class="field"><label>Khách hàng</label><select name="customerId" required>${options(state.bootstrap.customers, quote?.customer_id)}</select></div>
    <div class="field"><label>Kho xuất</label><select name="warehouseId" required>${options(state.bootstrap.warehouses, quote?.warehouse_id)}</select></div>
    <div class="field"><label>Loại báo giá</label><select name="quoteType"><option value="FULL_SERVICE" ${quote?.quote_type !== 'CUSTOMER_MATERIAL' ? 'selected' : ''}>Khách mua vật tư và gia công</option><option value="CUSTOMER_MATERIAL" ${quote?.quote_type === 'CUSTOMER_MATERIAL' ? 'selected' : ''}>Khách cung cấp vật tư, chỉ gia công</option></select></div>
    <div class="field span-4"><label>Ghi chú / điều khoản</label><input name="notes" value="${esc(quote?.notes || '')}"></div>
    <div id="quote-customer-info" class="field hint span-4"></div>
  </div><div class="hint">SL tiêu hao kho là số lượng vật tư sẽ bị trừ khi xuất bán. Có thể nhập kg, tấm hoặc đơn vị khác nhưng phải khớp với đơn vị của hàng hóa đã chọn.</div><div class="section-title">Chi tiết giá thành</div><div id="quote-lines">${items.map((_, index) => quoteLine(index)).join('')}</div><button type="button" class="btn" id="add-quote-line">+ Thêm dòng</button><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">${quote ? 'Lưu thay đổi' : 'Lưu báo giá'}</button></div></form>`);
  $$('.quote-line').forEach((line, index) => Object.entries(items[index]).forEach(([name, value]) => {
    const input = $(`[name="${name}"]`, line);
    if (input) input.value = input.classList.contains('money-input') ? moneyInput(value) : value ?? '';
  }));
  updateQuoteCustomerInfo();
  await Promise.all($$('.quote-line').map(updateQuoteLine));
}

function lineData(node) {
  return Object.fromEntries($$('input,select', node).map(input => [input.name, input.type === 'number' || input.classList.contains('money-input') ? number(input.value) : input.value]));
}

async function updateQuoteLine(node) {
  if (!node) return;
  const calc = await window.crm.calculateCost(lineData(node));
  $('[data-result="weight"]', node).textContent = calc.totalWeight.toFixed(3);
  $('[data-result="cost"]', node).textContent = money(calc.costBeforeProfit);
  $('[data-result="total"]', node).textContent = `${money(calc.total)} ₫`;
}

async function renderPurchaseOrders() {
  const rows = await window.crm.listPurchaseOrders();
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.order_date)}</td><td>${esc(row.supplier_name)}</td><td>${esc(row.warehouse_name)}</td><td>${badge(row.status)}</td><td class="num"><strong>${money(row.total)} ₫</strong></td><td><div class="actions"><button class="btn small" data-doc-preview="po" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="po" data-id="${row.id}">PDF</button>${row.status !== 'RECEIVED' ? `<button class="btn small" data-po-detail data-id="${row.id}">Chi tiết / Sửa</button><button class="btn small teal" data-po-receive data-id="${row.id}">Nhận toàn bộ</button>` : ''}<button class="btn small danger" data-po-delete data-id="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td class="empty" colspan="7">Chưa có đơn đặt hàng</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Đơn đặt hàng nhà cung cấp</h2><p>Chỉ tăng tồn sau khi xác nhận nhận hàng</p></div><button class="btn primary" id="new-po">+ Lập đơn đặt hàng</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Nhà cung cấp</th><th>Kho nhận</th><th>Trạng thái</th><th class="num">Tổng tiền</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

function poLine() {
  return `<div class="line-card po-line"><button type="button" class="btn small danger remove-line">Xóa dòng</button><div class="line-grid"><div class="field"><label>Hàng hóa</label><select name="productId">${options(state.bootstrap.products)}</select></div><div class="field"><label>Số lượng</label><input name="quantity" type="number" min="0.001" step="any" value="1" required></div><div class="field"><label>Đơn giá</label><input name="unitPrice" type="text" inputmode="numeric" class="money-input" value="0"></div><div class="field"><label>VAT (%)</label><input name="vatPercent" type="number" min="0" step="any" value="10"></div></div></div>`;
}

async function showPurchaseOrderForm(id) {
  await refreshBootstrap();
  if (!state.bootstrap.suppliers.length || !state.bootstrap.products.length) return toast('Cần tạo nhà cung cấp và hàng hóa trước.', true);
  const po = id ? await window.crm.getPurchaseOrder(Number(id)) : null;
  const items = po?.items || [{}];
  openModal(`<h2>${po ? `Chi tiết / Sửa ${esc(po.number)}` : 'Lập đơn đặt hàng'}</h2><form id="po-form" data-id="${po?.id || ''}"><div class="form-grid">
    <div class="field"><label>Ngày đặt</label><input name="date" type="date" value="${esc(po?.order_date || today())}" required></div><div class="field"><label>Nhà cung cấp</label><select name="supplierId">${options(state.bootstrap.suppliers, po?.supplier_id)}</select></div><div class="field"><label>Kho nhận</label><select name="warehouseId">${options(state.bootstrap.warehouses, po?.warehouse_id)}</select></div><div class="field"><label>Công trình / bộ phận</label><input name="project" value="${esc(po?.project || '')}"></div>
    <div class="field"><label>Ngày giao dự kiến</label><input name="deliveryDate" type="date" value="${esc(po?.delivery_date || '')}"></div><div class="field span-2"><label>Địa điểm giao hàng</label><input name="deliveryLocation" value="${esc(po?.delivery_location || '')}"></div><div class="field"><label>Chi phí vận chuyển / khác</label><input name="shippingCost" class="money-input" inputmode="numeric" value="${moneyInput(po?.shipping_cost || 0)}"></div>
    <div class="field span-2"><label>Điều kiện thanh toán</label><input name="paymentTerms" value="${esc(po?.payment_terms || '')}"></div><div class="field span-2"><label>Yêu cầu chất lượng / tiêu chuẩn</label><input name="qualityRequirements" value="${esc(po?.quality_requirements || '')}"></div>
    <div class="field span-2"><label>Bảo hành / đổi trả</label><input name="warranty" value="${esc(po?.warranty || '')}"></div><div class="field span-2"><label>Chứng từ yêu cầu</label><input name="documentsRequired" value="${esc(po?.documents_required || '')}"></div><div class="field span-4"><label>Ghi chú</label><input name="notes" value="${esc(po?.notes || '')}"></div>
  </div><div class="section-title">Hàng đặt</div><div id="po-lines">${items.map(poLine).join('')}</div><button type="button" class="btn" id="add-po-line">+ Thêm dòng</button><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">${po ? 'Lưu thay đổi' : 'Lưu đơn hàng'}</button></div></form>`);
  $$('.po-line').forEach((line, index) => {
    const item = items[index];
    $('[name="productId"]', line).value = item.product_id || '';
    $('[name="quantity"]', line).value = item.quantity ?? 1;
    $('[name="unitPrice"]', line).value = moneyInput(item.unit_price ?? 0);
    $('[name="vatPercent"]', line).value = item.vat_percent ?? 10;
  });
}

function purchaseRequestLine() {
  return `<div class="line-card purchase-request-line"><button type="button" class="btn small danger remove-line">Xóa dòng</button><div class="line-grid">
    <div class="field span-2"><label>Tên vật tư / thiết bị</label><input name="itemName" required></div><div class="field span-2"><label>Quy cách / mã hàng</label><input name="specification"></div><div class="field"><label>ĐVT</label><input name="unit"></div><div class="field"><label>Số lượng</label><input name="quantity" type="number" min="0.001" step="any" value="1" required></div><div class="field"><label>Đơn giá dự kiến</label><input name="estimatedUnitPrice" class="money-input" inputmode="numeric" value="0"></div><div class="field span-2"><label>Ghi chú</label><input name="notes"></div>
  </div></div>`;
}

async function renderPurchaseRequests() {
  const rows = await window.crm.listPurchaseRequests();
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.request_date)}</td><td>${esc(row.employee_name || row.requester_name)}</td><td>${esc(row.department)}</td><td>${esc(row.purpose)}</td><td class="num">${money(row.total)} ₫</td><td><div class="actions"><button class="btn small" data-doc-preview="purchase_request" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="purchase_request" data-id="${row.id}">PDF</button><button class="btn small" data-purchase-request-edit data-id="${row.id}">Chi tiết / Sửa</button><button class="btn small danger" data-purchase-request-delete data-id="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Chưa có phiếu đề nghị mua</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Phiếu đề nghị mua vật tư, thiết bị</h2><p>Mẫu nội bộ trước khi lập đơn đặt hàng</p></div><button class="btn primary" id="new-purchase-request">+ Lập phiếu đề nghị</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Người đề nghị</th><th>Bộ phận</th><th>Mục đích</th><th class="num">Dự kiến</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showPurchaseRequestForm(id) {
  await refreshBootstrap();
  const request = id ? await window.crm.getPurchaseRequest(Number(id)) : null;
  const items = request?.items || [{}];
  openModal(`<h2>${request ? `Chi tiết / Sửa ${esc(request.number)}` : 'Lập phiếu đề nghị mua'}</h2><form id="purchase-request-form" data-id="${request?.id || ''}"><div class="form-grid">
    <div class="field"><label>Ngày đề nghị</label><input name="date" type="date" value="${esc(request?.request_date || today())}" required></div><div class="field"><label>Nhân viên</label><select name="employeeId"><option value="">—</option>${options(state.bootstrap.employees, request?.employee_id)}</select></div><div class="field"><label>Người đề nghị khác</label><input name="requesterName" value="${esc(request?.requester_name || '')}"></div><div class="field"><label>Bộ phận / chức vụ</label><input name="department" value="${esc(request?.department || '')}"></div>
    <div class="field span-2"><label>Công trình / đơn hàng / máy móc</label><input name="project" value="${esc(request?.project || '')}"></div><div class="field"><label>Mục đích mua</label><input name="purpose" value="${esc(request?.purpose || '')}"></div><div class="field"><label>Thời gian cần</label><input name="neededDate" type="date" value="${esc(request?.needed_date || '')}"></div>
    <div class="field span-2"><label>Nhà cung cấp đề xuất</label><input name="proposedSupplier" value="${esc(request?.proposed_supplier || '')}"></div><div class="field span-2"><label>Yêu cầu kỹ thuật / tiêu chuẩn</label><input name="technicalRequirements" value="${esc(request?.technical_requirements || '')}"></div><div class="field span-2"><label>Lý do mua / tồn kho / phương án thay thế</label><input name="reason" value="${esc(request?.reason || '')}"></div><div class="field span-2"><label>Hồ sơ kèm theo / ghi chú</label><input name="notes" value="${esc(request?.notes || '')}"></div>
  </div><div class="section-title">Vật tư, thiết bị đề nghị mua</div><div id="purchase-request-lines">${items.map(purchaseRequestLine).join('')}</div><button type="button" class="btn" id="add-purchase-request-line">+ Thêm dòng</button><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu phiếu</button></div></form>`);
  $$('.purchase-request-line').forEach((line, index) => {
    const item = items[index];
    const values = { itemName: item.item_name, specification: item.specification, unit: item.unit, quantity: item.quantity, estimatedUnitPrice: item.estimated_unit_price, notes: item.notes };
    Object.entries(values).forEach(([name, value]) => { const input = $(`[name="${name}"]`, line); input.value = input.classList.contains('money-input') ? moneyInput(value || 0) : value ?? ''; });
  });
}

async function renderInventory() {
  const data = await window.crm.getInventory();
  const inventory = data.inventory.map(row => `<tr><td>${esc(row.code)}</td><td>${esc(row.name)}</td><td>${esc(row.warehouse_name)}</td><td>${esc(row.unit)}</td><td class="num ${row.balance < 0 ? 'negative' : row.balance > 0 ? 'positive' : ''}"><strong>${row.balance}</strong></td><td class="num">${money(row.stock_value)} ₫</td></tr>`).join('');
  const movements = data.movements.length ? data.movements.map(row => `<tr><td>${esc(row.movement_date)}</td><td>${esc(row.code)} — ${esc(row.product_name)}</td><td>${esc(row.warehouse_name)}</td><td>${esc(row.source_type)}</td><td class="num ${row.quantity < 0 ? 'negative' : 'positive'}">${row.quantity > 0 ? '+' : ''}${row.quantity} ${esc(row.unit)}</td><td>${esc(row.note)}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Chưa có nhập xuất</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Tồn hiện tại</h2><p>Tổng nhập trừ tổng xuất theo hàng và kho</p></div></div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Hàng hóa</th><th>Kho</th><th>ĐVT</th><th class="num">Tồn</th><th class="num">Giá trị tham khảo</th></tr></thead><tbody>${inventory || '<tr><td colspan="6" class="empty">Chưa có hàng hóa</td></tr>'}</tbody></table></div></div><div class="panel"><div class="panel-head"><div><h2>Biến động gần đây</h2><p>Tối đa 500 dòng mới nhất</p></div></div><div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Hàng hóa</th><th>Kho</th><th>Nguồn</th><th class="num">Số lượng</th><th>Chứng từ</th></tr></thead><tbody>${movements}</tbody></table></div></div>`;
}

async function renderSales() {
  const rows = await window.crm.listSales();
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.sale_date)}</td><td>${esc(row.customer_name)}</td><td>${esc(row.warehouse_name)}</td><td>${badge(row.status)}</td><td class="num"><strong>${money(row.total)} ₫</strong></td><td><div class="actions"><button class="btn small" data-doc-preview="sale" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="sale" data-id="${row.id}">PDF</button><button class="btn small danger" data-sale-delete data-id="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td class="empty" colspan="7">Chưa có phiếu xuất bán</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Phiếu xuất bán</h2><p>Được tạo khi chuyển báo giá đã chốt</p></div></div><div class="table-wrap"><table><thead><tr><th>Số phiếu</th><th>Ngày</th><th>Khách hàng</th><th>Kho</th><th>Trạng thái</th><th class="num">Tổng tiền</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

const stockTypeLabels = {
  DIRECT_RECEIPT: 'Nhập mua trực tiếp', DIRECT_SALE: 'Bán trực tiếp', TRANSFER: 'Chuyển kho',
  SUPPLIER_RETURN: 'Trả nhà cung cấp', CUSTOMER_RETURN: 'Khách trả hàng'
};

async function renderStockDocuments() {
  const rows = await window.crm.listStockDocuments();
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.document_date)}</td><td>${esc(stockTypeLabels[row.type])}</td><td>${esc(row.warehouse_from_name || '')}</td><td>${esc(row.warehouse_to_name || '')}</td><td>${esc(row.customer_name || row.supplier_name || '')}</td><td class="num">${money(row.total)} ₫</td><td>${badge(row.status)}</td><td><div class="actions"><button class="btn small" data-stock-document-detail data-id="${row.id}">Chi tiết</button><button class="btn small danger" data-stock-document-delete data-id="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td class="empty" colspan="9">Chưa có giao dịch kho trực tiếp</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Chứng từ nhập xuất kho</h2><p>Khi xóa, tồn kho và công nợ được tính lại</p></div><button class="btn primary" id="new-stock-document">+ Lập chứng từ</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Loại</th><th>Kho xuất</th><th>Kho nhận</th><th>Đối tượng</th><th class="num">Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showStockDocumentDetails(id) {
  const doc = await window.crm.getStockDocument(Number(id));
  const items = doc.items.map(item => `<tr><td>${esc(item.product_code)}</td><td>${esc(item.product_name)}</td><td class="num">${item.quantity} ${esc(item.unit)}</td><td class="num">${money(item.unit_price)} ₫</td><td class="num">${item.vat_percent}%</td></tr>`).join('');
  openModal(`<h2>Chi tiết ${esc(doc.number)}</h2><div class="form-grid"><div class="field"><label>Ngày</label><strong>${esc(doc.document_date)}</strong></div><div class="field"><label>Nghiệp vụ</label><strong>${esc(stockTypeLabels[doc.type])}</strong></div><div class="field"><label>Kho xuất</label><strong>${esc(doc.warehouse_from_name || '—')}</strong></div><div class="field"><label>Kho nhận</label><strong>${esc(doc.warehouse_to_name || '—')}</strong></div><div class="field span-2"><label>Đối tượng</label><strong>${esc(doc.customer_name || doc.supplier_name || '—')}</strong></div><div class="field span-2"><label>Ghi chú</label><strong>${esc(doc.notes || '—')}</strong></div></div><div class="section-title">Hàng hóa</div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Hàng hóa</th><th class="num">Số lượng</th><th class="num">Đơn giá</th><th class="num">VAT</th></tr></thead><tbody>${items}</tbody></table></div><div class="hint">Chứng từ đã ghi sổ không sửa trực tiếp. Nếu cần thay đổi, hãy xóa để đảo tồn kho/công nợ rồi lập lại.</div><div class="form-actions"><button class="btn" data-close-modal>Đóng</button></div>`);
}

function stockDocumentLine() {
  return `<div class="line-card stock-document-line"><button type="button" class="btn small danger remove-line">Xóa dòng</button><div class="line-grid"><div class="field span-2"><label>Hàng hóa</label><select name="productId">${options(state.bootstrap.products)}</select></div><div class="field"><label>Số lượng</label><input name="quantity" type="number" min="0.001" step="any" value="1" required></div><div class="field"><label>Đơn giá</label><input name="unitPrice" type="text" inputmode="numeric" class="money-input" value="0"></div><div class="field"><label>VAT (%)</label><input name="vatPercent" type="number" min="0" step="any" value="10"></div></div></div>`;
}

async function showStockDocumentForm() {
  await refreshBootstrap();
  if (!state.bootstrap.products.length) return toast('Cần tạo hàng hóa trước.', true);
  openModal(`<h2>Lập chứng từ kho</h2><form id="stock-document-form"><div class="form-grid">
    <div class="field"><label>Loại nghiệp vụ</label><select name="type">${Object.entries(stockTypeLabels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></div>
    <div class="field"><label>Ngày chứng từ</label><input name="date" type="date" value="${today()}" required></div>
    <div class="field"><label>Kho xuất (nếu có)</label><select name="warehouseFromId"><option value="">—</option>${options(state.bootstrap.warehouses)}</select></div>
    <div class="field"><label>Kho nhận (nếu có)</label><select name="warehouseToId"><option value="">—</option>${options(state.bootstrap.warehouses)}</select></div>
    <div class="field"><label>Khách hàng (nếu có)</label><select name="customerId"><option value="">—</option>${options(state.bootstrap.customers)}</select></div>
    <div class="field"><label>Nhà cung cấp (nếu có)</label><select name="supplierId"><option value="">—</option>${options(state.bootstrap.suppliers)}</select></div>
    <div class="field span-2"><label>Ghi chú</label><input name="notes"></div>
  </div><div class="hint">Nhập mua/khách trả hàng dùng kho nhận. Bán/trả NCC dùng kho xuất. Chuyển kho cần chọn cả hai kho.</div><div class="section-title">Chi tiết hàng hóa</div><div id="stock-document-lines">${stockDocumentLine()}</div><button type="button" class="btn" id="add-stock-document-line">+ Thêm dòng</button><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Ghi sổ</button></div></form>`);
}

const cashTypeLabels = {
  CUSTOMER_RECEIPT: 'Thu khách hàng', SUPPLIER_PAYMENT: 'Chi nhà cung cấp', OTHER_RECEIPT: 'Thu khác',
  OTHER_PAYMENT: 'Chi khác', FUND_TRANSFER: 'Chuyển quỹ', ADVANCE: 'Tạm ứng nhân viên', ADVANCE_SETTLEMENT: 'Quyết toán tạm ứng', ADVANCE_REFUND: 'Hoàn ứng'
};
const cashInTypes = ['CUSTOMER_RECEIPT', 'OTHER_RECEIPT', 'ADVANCE_REFUND'];

async function renderFinance() {
  const data = await window.crm.getFinance();
  const cards = data.accounts.map(account => `<div class="stat-card"><span>${esc(account.name)}</span><strong>${money(account.balance)} ₫</strong><em>Số dư hiện tại</em></div>`).join('');
  const body = data.transactions.length ? data.transactions.map(row => {
    const incoming = cashInTypes.includes(row.type);
    const neutral = row.type === 'ADVANCE_SETTLEMENT';
    const printable = ['ADVANCE', 'ADVANCE_SETTLEMENT', 'ADVANCE_REFUND'].includes(row.type);
    const party = row.customer_name || row.supplier_name || row.employee_name || row.category_name || row.target_account_name || '';
    return `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.transaction_date)}</td><td>${esc(cashTypeLabels[row.type])}</td><td>${esc(row.account_name)}</td><td>${esc(party)}</td><td class="num ${neutral ? '' : incoming ? 'positive' : 'negative'}">${neutral ? '' : incoming ? '+' : '-'}${money(row.amount)} ₫</td><td>${esc(row.reference)}</td><td>${esc(row.notes)}</td><td><div class="actions">${printable ? `<button class="btn small" data-doc-preview="cash" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="cash" data-id="${row.id}">PDF</button>` : ''}<button class="btn small" data-cash-detail data-id="${row.id}">Chi tiết</button><button class="btn small danger" data-cash-delete data-id="${row.id}">Xóa</button></div></td></tr>`;
  }).join('') : '<tr><td class="empty" colspan="9">Chưa có giao dịch thu chi</td></tr>';
  state.financeRows = data.transactions;
  const advances = data.advances.length ? data.advances.map(row => `<tr><td>${esc(row.code)}</td><td>${esc(row.name)}</td><td class="num ${row.balance > 0 ? 'negative' : ''}">${money(row.balance)} ₫</td></tr>`).join('') : '<tr><td colspan="3" class="empty">Chưa có nhân viên</td></tr>';
  $('#content').innerHTML = `<div class="cards account-cards">${cards || '<div class="stat-card"><span>Chưa có quỹ</span><strong>0 ₫</strong></div>'}</div><div class="panel"><div class="panel-head"><div><h2>Sổ thu chi</h2><p>Tối đa 500 giao dịch gần nhất</p></div><button class="btn primary" id="new-cash-transaction">+ Lập phiếu thu/chi</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Nghiệp vụ</th><th>Quỹ</th><th>Đối tượng</th><th class="num">Số tiền</th><th>Tham chiếu</th><th>Nội dung</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div><div class="panel"><div class="panel-head"><div><h2>Tạm ứng nhân viên</h2><p>Tạm ứng trừ quyết toán và hoàn ứng</p></div></div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Nhân viên</th><th class="num">Còn tạm ứng</th></tr></thead><tbody>${advances}</tbody></table></div></div>`;
}

function showCashDetails(id) {
  const row = (state.financeRows || []).find(item => item.id === Number(id));
  if (!row) return toast('Không tìm thấy giao dịch.', true);
  const party = row.customer_name || row.supplier_name || row.employee_name || row.category_name || '—';
  openModal(`<h2>Chi tiết ${esc(row.number)}</h2><div class="form-grid"><div class="field"><label>Ngày</label><strong>${esc(row.transaction_date)}</strong></div><div class="field"><label>Nghiệp vụ</label><strong>${esc(cashTypeLabels[row.type])}</strong></div><div class="field"><label>Quỹ chi/thu</label><strong>${esc(row.account_name)}</strong></div><div class="field"><label>Quỹ nhận</label><strong>${esc(row.target_account_name || '—')}</strong></div><div class="field span-2"><label>Đối tượng / hạng mục</label><strong>${esc(party)}</strong></div><div class="field"><label>Số tiền</label><strong>${money(row.amount)} ₫</strong></div><div class="field"><label>Tham chiếu</label><strong>${esc(row.reference || '—')}</strong></div><div class="field span-4"><label>Nội dung</label><strong>${esc(row.notes || '—')}</strong></div></div><div class="hint">Giao dịch đã ghi sổ không sửa trực tiếp. Nếu cần thay đổi, hãy xóa để tính lại số dư/công nợ rồi lập lại.</div><div class="form-actions"><button class="btn" data-close-modal>Đóng</button></div>`);
}

async function showCashTransactionForm() {
  await refreshBootstrap();
  if (!state.bootstrap.cashAccounts.length) return toast('Cần tạo quỹ hoặc tài khoản trước.', true);
  openModal(`<h2>Lập phiếu thu / chi</h2><form id="cash-transaction-form"><div class="form-grid">
    <div class="field"><label>Nghiệp vụ</label><select name="type">${Object.entries(cashTypeLabels).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></div>
    <div class="field"><label>Ngày</label><input name="date" type="date" value="${today()}" required></div>
    <div class="field"><label>Quỹ / tài khoản</label><select name="accountId">${options(state.bootstrap.cashAccounts)}</select></div>
    <div class="field"><label>Quỹ nhận (khi chuyển)</label><select name="targetAccountId"><option value="">—</option>${options(state.bootstrap.cashAccounts)}</select></div>
    <div class="field"><label>Số tiền</label><input name="amount" type="text" inputmode="numeric" class="money-input" required></div>
    <div class="field"><label>Khách hàng</label><select name="customerId"><option value="">—</option>${options(state.bootstrap.customers)}</select></div>
    <div class="field"><label>Nhà cung cấp</label><select name="supplierId"><option value="">—</option>${options(state.bootstrap.suppliers)}</select></div>
    <div class="field"><label>Nhân viên</label><select name="employeeId"><option value="">—</option>${options(state.bootstrap.employees)}</select></div>
    <div class="field"><label>Hạng mục</label><select name="categoryId"><option value="">—</option>${options(state.bootstrap.categories)}</select></div>
    <div class="field"><label>Số chứng từ tham chiếu</label><input name="reference"></div>
    <div class="field"><label>Bộ phận / chức vụ</label><input name="department"></div><div class="field"><label>Từ ngày</label><input name="useFromDate" type="date"></div><div class="field"><label>Đến ngày</label><input name="useToDate" type="date"></div><div class="field"><label>Hạn thanh toán tạm ứng</label><input name="dueDate" type="date"></div>
    <div class="field"><label>Hình thức nhận tiền</label><select name="paymentMethod"><option value="">—</option><option>Tiền mặt</option><option>Chuyển khoản</option></select></div><div class="field"><label>Ngân hàng</label><input name="bankName"></div><div class="field"><label>Số tài khoản</label><input name="bankAccount"></div><div class="field"><label>Số chứng từ kèm theo</label><input name="documentCount" type="number" min="0" value="0"></div>
    <div class="field span-4"><label>Nội dung / mục đích</label><input name="notes"></div>
  </div><div class="hint">Các trường bộ phận, thời hạn và tài khoản được dùng trên mẫu tạm ứng/thanh toán. Nghiệp vụ khác có thể để trống.</div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Ghi sổ</button></div></form>`);
}

async function renderDebts() {
  const data = await window.crm.getDebts();
  const customers = data.customers.length ? data.customers.map(row => `<tr><td>${esc(row.code)}</td><td>${esc(row.name)}</td><td class="num ${row.balance > 0 ? 'negative' : ''}"><strong>${money(row.balance)} ₫</strong></td></tr>`).join('') : '<tr><td colspan="3" class="empty">Chưa có khách hàng</td></tr>';
  const suppliers = data.suppliers.length ? data.suppliers.map(row => `<tr><td>${esc(row.code)}</td><td>${esc(row.name)}</td><td class="num ${row.balance > 0 ? 'negative' : ''}"><strong>${money(row.balance)} ₫</strong></td></tr>`).join('') : '<tr><td colspan="3" class="empty">Chưa có nhà cung cấp</td></tr>';
  $('#content').innerHTML = `<div class="split"><div class="panel"><div class="panel-head"><div><h2>Phải thu khách hàng</h2><p>Bán hàng trừ tiền đã thu</p></div></div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Khách hàng</th><th class="num">Còn phải thu</th></tr></thead><tbody>${customers}</tbody></table></div></div><div class="panel"><div class="panel-head"><div><h2>Phải trả nhà cung cấp</h2><p>Nhập hàng trừ tiền đã chi</p></div></div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Nhà cung cấp</th><th class="num">Còn phải trả</th></tr></thead><tbody>${suppliers}</tbody></table></div></div></div>`;
}

async function renderReports() {
  const r = await window.crm.getReports();
  $('#content').innerHTML = `<div class="cards"><div class="stat-card"><span>Doanh thu</span><strong>${money(r.revenue)} ₫</strong><em>Bán hàng trừ hàng trả</em></div><div class="stat-card"><span>Giá vốn</span><strong>${money(r.cogs)} ₫</strong><em>Theo biến động kho</em></div><div class="stat-card"><span>Thu / chi khác</span><strong>${money(r.otherIncome - r.expenses)} ₫</strong><em>Khoản tính vào lãi lỗ</em></div><div class="stat-card"><span>Lợi nhuận</span><strong class="${r.profit < 0 ? 'negative' : 'positive'}">${money(r.profit)} ₫</strong><em>Doanh thu − giá vốn ± thu chi khác</em></div></div><div class="panel"><div class="panel-head"><div><h2>Chi tiết kết quả</h2><p>Số liệu được tổng hợp trực tiếp từ chứng từ đã ghi sổ</p></div></div><div class="table-wrap"><table><tbody><tr><td>Doanh thu bán hàng</td><td class="num">${money(r.revenue)} ₫</td></tr><tr><td>Giá vốn hàng bán</td><td class="num">${money(r.cogs)} ₫</td></tr><tr><td>Thu khác tính lãi lỗ</td><td class="num">${money(r.otherIncome)} ₫</td></tr><tr><td>Chi khác tính lãi lỗ</td><td class="num">${money(r.expenses)} ₫</td></tr><tr><td><strong>Lợi nhuận</strong></td><td class="num"><strong>${money(r.profit)} ₫</strong></td></tr></tbody></table></div></div>`;
}

async function renderInvoiceFiles() {
  const rows = await window.crm.listInvoiceFiles();
  const body = rows.length ? rows.map(row => `<tr><td>${row.invoice_type === 'INPUT' ? 'Đầu vào' : 'Đầu ra'}</td><td>${esc(row.invoice_month)}</td><td>${esc(row.invoice_number)}</td><td>${esc(row.partner_name)}</td><td>${esc(row.original_name)}</td><td>${esc(row.notes)}</td><td><div class="actions"><button class="btn small" data-invoice-open data-id="${row.id}">Mở file</button><button class="btn small danger" data-invoice-delete data-id="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="7" class="empty">Chưa lưu file hóa đơn</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Kho file hóa đơn</h2><p>Phân loại đầu vào, đầu ra theo tháng; file được sao chép vào dữ liệu ứng dụng</p></div><button class="btn primary" id="new-invoice-file">+ Thêm hóa đơn</button></div><div class="table-wrap"><table><thead><tr><th>Loại</th><th>Tháng</th><th>Số hóa đơn</th><th>Khách hàng / NCC</th><th>File</th><th>Ghi chú</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

function showInvoiceFileForm() {
  state.selectedInvoiceFile = null;
  openModal(`<h2>Thêm file hóa đơn</h2><form id="invoice-file-form"><div class="form-grid">
    <div class="field"><label>Loại hóa đơn</label><select name="invoiceType"><option value="INPUT">Hóa đơn đầu vào</option><option value="OUTPUT">Hóa đơn đầu ra</option></select></div><div class="field"><label>Tháng</label><input name="invoiceMonth" type="month" value="${today().slice(0, 7)}" required></div><div class="field"><label>Số hóa đơn</label><input name="invoiceNumber"></div><div class="field"><label>Khách hàng / nhà cung cấp</label><input name="partnerName"></div><div class="field span-4"><label>Ghi chú</label><input name="notes"></div><div class="field span-4"><label>File đã chọn</label><div class="file-picker"><button type="button" class="btn" id="pick-invoice-file">Chọn file</button><strong id="invoice-file-name">Chưa chọn file</strong></div></div>
  </div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu hóa đơn</button></div></form>`);
}

async function renderPrintTemplates() {
  const data = await window.crm.listPrintTemplates();
  state.printTemplateData = data;
  const body = data.templates.map(row => `<tr><td>${esc(row.name)}</td><td>${esc(data.types[row.document_type])}</td><td>${row.is_default ? '<span class="badge RECEIVED">Mặc định</span>' : ''}</td><td><div class="actions"><button class="btn small" data-template-edit data-id="${row.id}">Sửa / Xem trước</button>${row.is_default ? '' : `<button class="btn small teal" data-template-default data-id="${row.id}">Chọn mặc định</button><button class="btn small danger" data-template-delete data-id="${row.id}">Xóa</button>`}</div></td></tr>`).join('');
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Thư viện mẫu in</h2><p>Chỉnh trực quan, xem trước tức thời và chèn biến bằng một lần bấm</p></div><button class="btn primary" id="new-print-template">+ Thêm mẫu</button></div><div class="table-wrap"><table><thead><tr><th>Tên mẫu</th><th>Loại chứng từ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div><div class="hint">Mở một mẫu để xem danh sách biến có mô tả và dữ liệu minh họa. Bảng dòng hàng dùng biến <strong>{{items_table}}</strong>.</div></div>`;
}

function showPrintTemplateForm(id) {
  const data = state.printTemplateData;
  const row = data.templates.find(item => item.id === Number(id)) || {};
  const starter = `<div class="brand-images">{{banner}}{{watermark}}</div>\n<h1>{{title}}</h1>\n<div class="meta">Số: <strong>{{number}}</strong> · Ngày: {{date}}</div>\n{{items_table}}\n<div class="totals"><div class="grand">TỔNG CỘNG: {{total}} đồng</div></div>\n<div class="notes">{{notes}}</div>`;
  const help = window.TemplateEditor.variables.filter(item => data.variables.includes(item.name));
  const variableGroups = [...new Set(help.map(item => item.group))].map(group => `<section class="variable-group"><h4>${esc(group)}</h4>${help.filter(item => item.group === group).map(item => `<button type="button" class="variable-chip" data-insert-variable="${item.name}" data-variable-search="${esc(`${item.name} ${item.label}`.toLowerCase())}" title="Bấm để chèn {{${item.name}}}"><code>{{${item.name}}}</code><span>${esc(item.label)}</span><small>Ví dụ: ${esc(item.sample)}</small></button>`).join('')}</section>`).join('');
  openModal(`<h2>${id ? 'Sửa và xem trước mẫu in' : 'Tạo mẫu in'}</h2><form id="print-template-form" class="template-editor-form" data-id="${id || ''}"><div class="form-grid template-heading"><div class="field span-2"><label>Tên mẫu</label><input name="name" value="${esc(row.name || '')}" required></div><div class="field span-2"><label>Loại chứng từ</label><select name="documentType">${Object.entries(data.types).map(([key, label]) => `<option value="${key}" ${row.document_type === key ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div></div>
    <div class="template-editor-shell"><section class="template-compose"><div class="template-section-head"><div><strong>Thiết kế trực quan</strong><small>Chọn nội dung rồi dùng thanh công cụ; bấm biến ở bên phải để chèn</small></div></div><div class="template-toolbar" aria-label="Định dạng mẫu"><button type="button" data-editor-command="bold"><strong>B</strong></button><button type="button" data-editor-command="italic"><em>I</em></button><button type="button" data-editor-command="formatBlock" data-editor-value="h1">Tiêu đề</button><button type="button" data-editor-command="formatBlock" data-editor-value="h2">Mục</button><button type="button" data-editor-command="formatBlock" data-editor-value="p">Đoạn</button><button type="button" data-editor-command="justifyLeft">Căn trái</button><button type="button" data-editor-command="justifyCenter">Căn giữa</button></div><div id="template-designer" class="template-designer" contenteditable="true" spellcheck="false" aria-label="Nội dung mẫu in"></div><details class="template-source"><summary>Chỉnh mã HTML nâng cao</summary><textarea id="template-source" name="content" rows="10" required>${esc(row.content || starter)}</textarea></details></section>
      <aside class="template-side"><section class="template-preview-panel"><div class="template-section-head"><div><strong>Xem trước trực tiếp</strong><small>Dữ liệu minh họa, không phải chứng từ thật</small></div></div><div class="template-preview"><div id="template-preview-paper" class="template-preview-paper"></div></div></section><section class="variable-library"><div class="template-section-head"><div><strong>Danh sách biến</strong><small>Bấm vào một biến để chèn</small></div><input id="variable-search" type="search" placeholder="Tìm biến..."></div><div id="variable-list" class="variable-list">${variableGroups}</div></section></aside></div>
    <div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu mẫu</button></div></form>`);

  const form = $('#print-template-form');
  const designer = $('#template-designer');
  const source = $('#template-source');
  const type = $('[name="documentType"]', form);
  let savedRange;
  const updatePreview = () => { $('#template-preview-paper').innerHTML = window.TemplateEditor.render(designer.innerHTML, type.value); };
  const syncFromDesigner = () => { source.value = designer.innerHTML; updatePreview(); };
  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount && designer.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange();
  };
  designer.innerHTML = window.TemplateEditor.sanitize(row.content || starter);
  designer.addEventListener('input', syncFromDesigner);
  designer.addEventListener('keyup', rememberSelection);
  designer.addEventListener('mouseup', rememberSelection);
  source.addEventListener('input', () => { designer.innerHTML = window.TemplateEditor.sanitize(source.value); updatePreview(); });
  type.addEventListener('change', updatePreview);
  $$('.template-toolbar button', form).forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => { designer.focus(); document.execCommand(button.dataset.editorCommand, false, button.dataset.editorValue || null); syncFromDesigner(); rememberSelection(); });
  });
  $$('.variable-chip', form).forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => {
      designer.focus();
      const selection = window.getSelection();
      const range = savedRange && designer.contains(savedRange.commonAncestorContainer) ? savedRange : document.createRange();
      if (!savedRange || !designer.contains(savedRange.commonAncestorContainer)) { range.selectNodeContents(designer); range.collapse(false); }
      selection.removeAllRanges(); selection.addRange(range);
      document.execCommand('insertText', false, `{{${button.dataset.insertVariable}}}`);
      syncFromDesigner(); rememberSelection();
    });
  });
  $('#variable-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    $$('.variable-chip', form).forEach(button => button.hidden = Boolean(query) && !button.dataset.variableSearch.includes(query));
    $$('.variable-group', form).forEach(group => group.hidden = !$$('.variable-chip:not([hidden])', group).length);
  });
  form.addEventListener('submit', syncFromDesigner);
  form.closest('.modal-card').classList.add('template-modal-card');
  syncFromDesigner();
}

function renderSettings() {
  const s = state.bootstrap?.settings || {};
  $('#content').innerHTML = `<div class="split"><div class="panel"><div class="panel-head"><div><h2>Thông tin doanh nghiệp</h2><p>Hiển thị trên chứng từ in</p></div></div><form id="settings-form"><div class="form-grid"><div class="field span-4"><label>Tên doanh nghiệp</label><input name="company_name" value="${esc(s.company_name)}"></div><div class="field span-4"><label>Địa chỉ</label><input name="company_address" value="${esc(s.company_address)}"></div><div class="field span-2"><label>Điện thoại</label><input name="company_phone" value="${esc(s.company_phone)}"></div><div class="field span-2"><label>Mã số thuế</label><input name="tax_code" value="${esc(s.tax_code)}"></div></div><div class="form-actions"><button class="btn primary">Lưu cài đặt</button></div></form></div><div class="panel"><div class="panel-head"><div><h2>Sao lưu dữ liệu</h2><p>Tạo bản sao cơ sở dữ liệu để cất ở ổ khác</p></div></div><p>Dữ liệu đang được lưu cục bộ trên máy. Nên sao lưu cuối mỗi ngày làm việc và chép bản sao sang OneDrive, USB hoặc ổ mạng.</p><button class="btn teal" id="backup-now">Sao lưu ngay</button><div class="hint">Bản sao không bao gồm file cài đặt; chỉ cần cài lại ứng dụng rồi khôi phục file dữ liệu khi có sự cố.</div></div><div class="panel"><div class="panel-head"><div><h2>Dữ liệu kiểm tra</h2><p>Khách hàng, hàng hóa, tồn kho, báo giá, đơn mua và phiếu thu mẫu</p></div></div><button class="btn primary" id="seed-demo">Tạo dữ liệu mẫu</button><div class="hint">Dữ liệu mẫu có mã bắt đầu bằng DEMO-. Nút này chạy lại không tạo trùng.</div></div><div class="panel"><div class="panel-head"><div><h2>Hướng dẫn sử dụng</h2><p>Quy trình từ danh mục đến báo cáo</p></div></div><button class="btn" id="open-guide">Mở hướng dẫn</button></div></div>`;
}

function showGuide() {
  openModal(`<h2>Hướng dẫn sử dụng nhanh</h2><ol><li>Vào <strong>Cài đặt & sao lưu</strong>, nhập thông tin doanh nghiệp và tạo dữ liệu mẫu nếu cần.</li><li>Kiểm tra các danh mục: hàng hóa, khách hàng, nhà cung cấp, kho, quỹ và nhân viên.</li><li>Vào <strong>Báo giá</strong> → Lập báo giá. Nhập số lượng, kích thước và chi phí; ô tiền tự thêm dấu chấm hàng nghìn.</li><li>Dùng <strong>Chi tiết / Sửa</strong> để xem điện thoại, địa chỉ, MST khách hàng và sửa toàn bộ dòng giá thành. Chốt báo giá rồi bấm <strong>Xuất bán</strong> để trừ tồn.</li><li>Vào <strong>Đơn đặt hàng</strong> để đặt mua; chỉ khi bấm Nhận toàn bộ thì tồn kho và công nợ mới tăng.</li><li>Dùng <strong>Nhập xuất kho</strong> cho nhập/bán trực tiếp, chuyển kho và trả hàng.</li><li>Dùng <strong>Thu chi & quỹ</strong> để thu khách, chi nhà cung cấp, chuyển quỹ và tạm ứng.</li><li>Đối chiếu tại Tồn kho, Công nợ và Báo cáo. Sao lưu cuối ngày.</li></ol><div class="hint">Chứng từ kho/quỹ đã ghi sổ: xem Chi tiết; nếu nhập sai, Xóa để hệ thống đảo số liệu rồi lập lại. Dữ liệu xóa là vĩnh viễn.</div><div class="form-actions"><button class="btn primary" data-close-modal>Đã hiểu</button></div>`);
}

document.addEventListener('click', async event => {
  const target = event.target.closest('button,[data-close-modal]');
  if (!target) return;
  try {
    if (target.dataset.closeModal !== undefined) return closeModal();
    if (target.dataset.page) return navigate(target.dataset.page);
    if (target.dataset.go) return navigate(target.dataset.go);
    if (target.dataset.masterNew) return showMasterForm(target.dataset.masterNew);
    if (target.dataset.masterEdit) return showMasterForm(target.dataset.masterEdit, target.dataset.id);
    if (target.dataset.masterDelete) {
      if (!confirm('Xóa vĩnh viễn bản ghi này? Dữ liệu đã dùng trong chứng từ sẽ không được phép xóa.')) return;
      await window.crm.deleteMaster(target.dataset.masterDelete, Number(target.dataset.id)); toast('Đã xóa bản ghi.'); return navigate(state.page);
    }
    if (target.id === 'new-quote') return showQuoteForm();
    if (target.dataset.quoteDetail !== undefined) return showQuoteForm(Number(target.dataset.id));
    if (target.dataset.quoteCustomerEdit !== undefined) {
      state.masterRows = await window.crm.listMaster('customers');
      return showMasterForm('customers', Number(target.dataset.id));
    }
    if (target.id === 'add-quote-line') { $('#quote-lines').insertAdjacentHTML('beforeend', quoteLine()); return updateQuoteLine($$('.quote-line').at(-1)); }
    if (target.id === 'new-po') return showPurchaseOrderForm();
    if (target.dataset.poDetail !== undefined) return showPurchaseOrderForm(Number(target.dataset.id));
    if (target.id === 'add-po-line') return $('#po-lines').insertAdjacentHTML('beforeend', poLine());
    if (target.id === 'new-purchase-request') return showPurchaseRequestForm();
    if (target.dataset.purchaseRequestEdit !== undefined) return showPurchaseRequestForm(Number(target.dataset.id));
    if (target.id === 'add-purchase-request-line') return $('#purchase-request-lines').insertAdjacentHTML('beforeend', purchaseRequestLine());
    if (target.dataset.purchaseRequestDelete !== undefined) { if (!confirm('Xóa phiếu đề nghị mua này?')) return; await window.crm.deletePurchaseRequest(Number(target.dataset.id)); toast('Đã xóa phiếu đề nghị.'); return navigate('purchase-requests'); }
    if (target.id === 'new-stock-document') return showStockDocumentForm();
    if (target.id === 'add-stock-document-line') return $('#stock-document-lines').insertAdjacentHTML('beforeend', stockDocumentLine());
    if (target.id === 'new-cash-transaction') return showCashTransactionForm();
    if (target.id === 'new-invoice-file') return showInvoiceFileForm();
    if (target.id === 'pick-invoice-file') { state.selectedInvoiceFile = await window.crm.pickInvoiceFile(); if (state.selectedInvoiceFile) $('#invoice-file-name').textContent = state.selectedInvoiceFile.name; return; }
    if (target.dataset.invoiceOpen !== undefined) return window.crm.openInvoiceFile(Number(target.dataset.id));
    if (target.dataset.invoiceDelete !== undefined) { if (!confirm('Xóa thông tin và file hóa đơn đã lưu?')) return; await window.crm.deleteInvoiceFile(Number(target.dataset.id)); toast('Đã xóa file hóa đơn.'); return navigate('invoice-files'); }
    if (target.id === 'new-print-template') return showPrintTemplateForm();
    if (target.dataset.templateEdit !== undefined) return showPrintTemplateForm(Number(target.dataset.id));
    if (target.dataset.templateDefault !== undefined) { await window.crm.setDefaultPrintTemplate(Number(target.dataset.id)); toast('Đã chọn mẫu mặc định.'); return navigate('print-templates'); }
    if (target.dataset.templateDelete !== undefined) { if (!confirm('Xóa mẫu in này?')) return; await window.crm.deletePrintTemplate(Number(target.dataset.id)); toast('Đã xóa mẫu in.'); return navigate('print-templates'); }
    if (target.classList.contains('remove-line')) {
      const card = target.closest('.line-card');
      if ($$('.line-card', card.parentElement).length === 1) return toast('Chứng từ cần ít nhất một dòng.', true);
      return card.remove();
    }
    if (target.dataset.quoteStatus) { await window.crm.setQuoteStatus(Number(target.dataset.id), target.dataset.quoteStatus); toast('Đã cập nhật trạng thái.'); return navigate('quotes'); }
    if (target.dataset.quoteConvert !== undefined) { if (!confirm('Tạo phiếu xuất và trừ tồn kho ngay?')) return; const result = await window.crm.convertQuote(Number(target.dataset.id)); toast(`Đã tạo phiếu ${result.number}.`); return navigate('quotes'); }
    if (target.dataset.quoteDelete !== undefined) { if (!confirm('Xóa vĩnh viễn báo giá này?')) return; await window.crm.deleteQuote(Number(target.dataset.id)); toast('Đã xóa báo giá.'); return navigate('quotes'); }
    if (target.dataset.saleDelete !== undefined) { if (!confirm('Xóa phiếu xuất bán và hoàn lại tồn kho? Báo giá sẽ trở về trạng thái Đã chốt.')) return; await window.crm.deleteSale(Number(target.dataset.id)); toast('Đã xóa phiếu xuất bán và hoàn tồn.'); return navigate('sales'); }
    if (target.dataset.poReceive !== undefined) { if (!confirm('Nhận toàn bộ đơn và tăng tồn kho?')) return; const result = await window.crm.receivePurchaseOrder(Number(target.dataset.id)); toast(`Đã tạo phiếu nhập ${result.number}.`); return navigate('purchase-orders'); }
    if (target.dataset.poDelete !== undefined) { if (!confirm('Xóa đơn đặt hàng? Nếu đã nhận, tồn kho và công nợ sẽ được tính lại.')) return; await window.crm.deletePurchaseOrder(Number(target.dataset.id)); toast('Đã xóa đơn đặt hàng.'); return navigate('purchase-orders'); }
    if (target.dataset.stockDocumentDetail !== undefined) return showStockDocumentDetails(Number(target.dataset.id));
    if (target.dataset.stockDocumentDelete !== undefined) { if (!confirm('Xóa chứng từ này và đảo ảnh hưởng tồn kho, công nợ?')) return; await window.crm.deleteStockDocument(Number(target.dataset.id)); toast('Đã xóa chứng từ kho.'); return navigate('stock-documents'); }
    if (target.dataset.cashDetail !== undefined) return showCashDetails(Number(target.dataset.id));
    if (target.dataset.cashDelete !== undefined) { if (!confirm('Xóa giao dịch này và tính lại số dư, công nợ?')) return; await window.crm.deleteCashTransaction(Number(target.dataset.id)); toast('Đã xóa giao dịch thu chi.'); return navigate('finance'); }
    if (target.dataset.docPreview) return window.crm.previewDocument(target.dataset.docPreview, Number(target.dataset.id));
    if (target.dataset.docPdf) { const file = await window.crm.exportPdf(target.dataset.docPdf, Number(target.dataset.id)); if (file) toast('Đã xuất file PDF.'); return; }
    if (target.id === 'seed-demo') { if (!confirm('Tạo bộ dữ liệu DEMO để kiểm tra ứng dụng?')) return; const result = await window.crm.seedDemoData(); await refreshBootstrap(); toast(result.created ? `Đã tạo ${result.created} nhóm dữ liệu mẫu.` : 'Dữ liệu mẫu đã có, không tạo trùng.'); return navigate('dashboard'); }
    if (target.id === 'open-guide') return showGuide();
    if (target.id === 'backup-now') { const file = await window.crm.backup(); if (file) toast(`Đã sao lưu: ${file}`); }
  } catch (error) { toast(error.message, true); }
});

document.addEventListener('input', event => {
  if (event.target.classList.contains('money-input')) event.target.value = moneyInput(event.target.value);
  const line = event.target.closest('.quote-line');
  if (line) { clearTimeout(line.calcTimer); line.calcTimer = setTimeout(() => updateQuoteLine(line).catch(error => toast(error.message, true)), 120); }
});

document.addEventListener('change', event => {
  if (event.target.name === 'customerId' && event.target.closest('#quote-form')) updateQuoteCustomerInfo();
  if (event.target.name === 'productId' && event.target.closest('.quote-line')) {
    const product = state.bootstrap.products.find(item => item.id === Number(event.target.value));
    const line = event.target.closest('.quote-line');
    if (product) {
      $('[name="description"]', line).value ||= product.name;
      $('[name="unit"]', line).value = product.unit;
      $('[name="vatPercent"]', line).value = product.vat_rate;
      if (!$('[name="materialPricePerKg"]', line).value) $('[name="materialPricePerKg"]', line).value = moneyInput(product.purchase_price);
      updateQuoteLine(line);
    }
  }
  if (event.target.name === 'productId' && event.target.closest('.po-line')) {
    const product = state.bootstrap.products.find(item => item.id === Number(event.target.value));
    if (product) { $('[name="unitPrice"]', event.target.closest('.po-line')).value = moneyInput(product.purchase_price); $('[name="vatPercent"]', event.target.closest('.po-line')).value = product.vat_rate; }
  }
  if (event.target.name === 'productId' && event.target.closest('.stock-document-line')) {
    const product = state.bootstrap.products.find(item => item.id === Number(event.target.value));
    if (product) { $('[name="unitPrice"]', event.target.closest('.stock-document-line')).value = moneyInput(product.purchase_price); $('[name="vatPercent"]', event.target.closest('.stock-document-line')).value = product.vat_rate; }
  }
});

document.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  try {
    if (form.id === 'master-form') {
      const record = Object.fromEntries($$('input,select,textarea', form).filter(input => input.name).map(input => [input.name, input.classList.contains('money-input') ? number(input.value) : input.value]));
      if (form.dataset.id) record.id = Number(form.dataset.id);
      await window.crm.saveMaster(form.dataset.type, record); closeModal(); toast('Đã lưu danh mục.'); await refreshBootstrap(); return navigate(state.page);
    }
    if (form.id === 'quote-form') {
      const head = Object.fromEntries(new FormData(form));
      const payload = { date: head.date, customerId: Number(head.customerId), warehouseId: Number(head.warehouseId), quoteType: head.quoteType, notes: head.notes, items: $$('.quote-line', form).map(lineData) };
      const result = form.dataset.id ? await window.crm.updateQuote(Number(form.dataset.id), payload) : await window.crm.createQuote(payload);
      closeModal(); toast(form.dataset.id ? `Đã cập nhật ${result.number}.` : `Đã tạo báo giá ${result.number}.`); return navigate('quotes');
    }
    if (form.id === 'po-form') {
      const data = new FormData(form);
      const payload = { date: data.get('date'), supplierId: Number(data.get('supplierId')), warehouseId: Number(data.get('warehouseId')),
        project: data.get('project'), deliveryDate: data.get('deliveryDate'), deliveryLocation: data.get('deliveryLocation'),
        shippingCost: number(data.get('shippingCost')), paymentTerms: data.get('paymentTerms'), qualityRequirements: data.get('qualityRequirements'),
        warranty: data.get('warranty'), documentsRequired: data.get('documentsRequired'), notes: data.get('notes'), items: $$('.po-line', form).map(lineData) };
      const result = form.dataset.id ? await window.crm.updatePurchaseOrder(Number(form.dataset.id), payload) : await window.crm.createPurchaseOrder(payload);
      closeModal(); toast(form.dataset.id ? `Đã cập nhật ${result.number}.` : `Đã tạo đơn ${result.number}.`); return navigate('purchase-orders');
    }
    if (form.id === 'purchase-request-form') {
      const data = Object.fromEntries(new FormData(form));
      const payload = { ...data, employeeId: Number(data.employeeId) || null, items: $$('.purchase-request-line', form).map(lineData) };
      const result = await window.crm.savePurchaseRequest(Number(form.dataset.id) || null, payload);
      closeModal(); toast(`Đã lưu ${result.number}.`); return navigate('purchase-requests');
    }
    if (form.id === 'stock-document-form') {
      const data = Object.fromEntries(new FormData(form));
      const payload = {
        type: data.type, date: data.date, warehouseFromId: Number(data.warehouseFromId) || null,
        warehouseToId: Number(data.warehouseToId) || null, customerId: Number(data.customerId) || null,
        supplierId: Number(data.supplierId) || null, notes: data.notes,
        items: $$('.stock-document-line', form).map(lineData)
      };
      const result = await window.crm.createStockDocument(payload); closeModal(); toast(`Đã ghi sổ ${result.number}.`); return navigate('stock-documents');
    }
    if (form.id === 'cash-transaction-form') {
      const fields = Object.fromEntries($$('input,select,textarea', form).filter(input => input.name).map(input => [input.name, input.classList.contains('money-input') ? number(input.value) : input.value]));
      const payload = { ...fields, accountId: Number(fields.accountId), targetAccountId: Number(fields.targetAccountId) || null,
        customerId: Number(fields.customerId) || null, supplierId: Number(fields.supplierId) || null,
        employeeId: Number(fields.employeeId) || null, categoryId: Number(fields.categoryId) || null,
        documentCount: Number(fields.documentCount) || 0 };
      const result = await window.crm.createCashTransaction(payload); closeModal(); toast(`Đã ghi sổ ${result.number}.`); return navigate('finance');
    }
    if (form.id === 'invoice-file-form') {
      if (!state.selectedInvoiceFile) throw new Error('Cần chọn file hóa đơn.');
      const fields = Object.fromEntries(new FormData(form));
      await window.crm.saveInvoiceFile({ ...fields, sourcePath: state.selectedInvoiceFile.path, originalName: state.selectedInvoiceFile.name });
      state.selectedInvoiceFile = null; closeModal(); toast('Đã lưu file hóa đơn.'); return navigate('invoice-files');
    }
    if (form.id === 'print-template-form') {
      const fields = Object.fromEntries(new FormData(form));
      if (form.dataset.id) fields.id = Number(form.dataset.id);
      await window.crm.savePrintTemplate(fields); closeModal(); toast('Đã lưu mẫu in.'); return navigate('print-templates');
    }
    if (form.id === 'settings-form') { await window.crm.saveSettings(Object.fromEntries(new FormData(form))); await refreshBootstrap(); toast('Đã lưu cài đặt.'); return renderSettings(); }
  } catch (error) { toast(error.message, true); }
});

$('#today').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
refreshBootstrap().then(() => navigate('dashboard')).catch(error => toast(error.message, true));
