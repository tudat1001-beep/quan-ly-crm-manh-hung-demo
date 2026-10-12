'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const money = value => new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0));
const number = value => window.NumberFormatVi.parseLocaleNumber(value);
const moneyInput = value => window.NumberFormatVi.formatIntegerInput(value);
const today = () => new Date().toISOString().slice(0, 10);

const state = { bootstrap: null, page: 'dashboard', selectedInvoiceFile: null, quoteInvoiceFilter: 'ALL', bannerData: null };
const pageMeta = {
  dashboard: ['Tổng quan', 'Tình hình hoạt động trên một màn hình'],
  'sales-dashboard': ['CRM Sale B2B', 'Khách hàng, công việc, cơ hội và KPI'],
  'sales-tasks': ['Công việc Sale', 'Lịch gọi điện, gặp khách và chăm sóc'],
  opportunities: ['Cơ hội bán hàng', 'Theo dõi từ tiếp cận đến thắng hoặc mất đơn'],
  'quote-requests': ['Yêu cầu báo giá', 'Tiếp nhận RFQ, bản vẽ và phân công xử lý'],
  'sales-kpis': ['KPI Sale', 'Mục tiêu và kết quả theo nhân viên'],
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
    title: 'Khách hàng', fields: [['code', 'Mã KH', 'text'], ['name', 'Tên doanh nghiệp', 'text'], ['phone', 'Điện thoại', 'text'], ['tax_code', 'Mã số thuế', 'text'], ['address', 'Địa chỉ', 'text', 2],
      ['industrial_zone', 'Khu công nghiệp', 'text'], ['industry', 'Ngành nghề', 'text'], ['contact_name', 'Người liên hệ', 'text'], ['contact_position', 'Chức vụ', 'text'],
      ['contact_phone', 'SĐT người liên hệ', 'text'], ['interested_services', 'Dịch vụ quan tâm', 'text', 2], ['assigned_employee_id', 'Nhân viên phụ trách', 'employee_select']],
    columns: [['code', 'Mã'], ['name', 'Tên khách hàng'], ['industrial_zone', 'KCN'], ['contact_name', 'Người liên hệ'], ['contact_phone', 'SĐT liên hệ'], ['industry', 'Ngành nghề'], ['assigned_employee_name', 'Phụ trách']]
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

function openModal(html) { $('#modal-body').innerHTML = html; $('#modal').classList.remove('hidden'); attachTableTools($('#modal-body')); }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal-body').innerHTML = ''; }
function options(rows, selected = '') { return rows.map(row => `<option value="${row.id}" ${String(row.id) === String(selected) ? 'selected' : ''}>${esc(row.code)} — ${esc(row.name)}</option>`).join(''); }
function statusLabel(status) { return ({ DRAFT: 'Nháp', SENT: 'Đã gửi', WON: 'Đã chốt', CONVERTED: 'Đã xuất', CANCELLED: 'Đã hủy', RECEIVED: 'Đã nhận', POSTED: 'Đã ghi sổ' })[status] || status; }
function badge(status) { return `<span class="badge ${status}">${statusLabel(status)}</span>`; }
const quoteTypeLabels = { FULL_SERVICE: 'Vật tư + gia công + sơn', CUSTOMER_MATERIAL: 'Gia công + sơn', PAINT_ONLY: 'Chỉ sơn tĩnh điện' };
const invoiceStatusLabels = { PENDING: 'Chưa xuất HĐ', ISSUED: 'Đã xuất HĐ', RETAIL_NO_INVOICE: 'Không lấy HĐ – Bán lẻ' };

async function refreshBootstrap() { state.bootstrap = await window.crm.bootstrap(); }

function attachTableTools(root = $('#content')) {
  $$('.table-wrap', root).forEach((wrap, tableIndex) => {
    const table = $('table', wrap);
    const body = $('tbody', table);
    if (!table || !body || wrap.previousElementSibling?.classList.contains('table-tools')) return;
    const rows = $$('tr', body).filter(row => !row.querySelector('.empty'));
    const numericColumns = $$('thead th', table).map((cell, index) => ({ cell, index })).filter(item => item.cell.classList.contains('num'));
    const tools = document.createElement('div');
    tools.className = 'table-tools';
    tools.innerHTML = `<input type="search" aria-label="Lọc bảng ${tableIndex + 1}" placeholder="Lọc nhanh trong bảng..."><span class="table-summary"></span>`;
    wrap.before(tools);
    const input = $('input', tools);
    const summary = $('.table-summary', tools);
    const update = () => {
      const keyword = input.value.trim().toLocaleLowerCase('vi');
      let visible = 0;
      const totals = new Map(numericColumns.map(item => [item.index, 0]));
      rows.forEach(row => {
        row.hidden = keyword && !row.textContent.toLocaleLowerCase('vi').includes(keyword);
        if (row.hidden) return;
        visible += 1;
        numericColumns.forEach(({ index }) => totals.set(index, totals.get(index) + number(row.cells[index]?.textContent || 0)));
      });
      const values = numericColumns.map(({ cell, index }) => `${cell.textContent.trim()}: ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(totals.get(index))}`).join(' · ');
      summary.textContent = `Hiển thị ${visible}/${rows.length} dòng${values ? ` · ${values}` : ''}`;
    };
    input.addEventListener('input', update);
    update();
  });
}

async function navigate(page) {
  state.page = page;
  $$('.nav-item').forEach(node => node.classList.toggle('active', node.dataset.page === page));
  $('#page-title').textContent = pageMeta[page][0];
  $('#page-subtitle').textContent = pageMeta[page][1];
  $('#content').innerHTML = '<div class="panel">Đang tải dữ liệu…</div>';
  try {
    if (page === 'dashboard') await renderDashboard();
    else if (page === 'sales-dashboard') await renderSalesDashboard();
    else if (page === 'sales-tasks') await renderSalesTasks();
    else if (page === 'opportunities') await renderOpportunities();
    else if (page === 'quote-requests') await renderQuoteRequests();
    else if (page === 'sales-kpis') await renderSalesKpis();
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
    else if (page === 'settings') await renderSettings();
    attachTableTools();
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

const taskTypeLabels = { CALL: 'Gọi điện', VISIT: 'Đi thị trường', MEETING: 'Gặp khách', FOLLOW_UP: 'Chăm sóc', OTHER: 'Khác' };
const taskStatusLabels = { TODO: 'Chưa làm', DOING: 'Đang làm', DONE: 'Hoàn thành' };
const opportunityStageLabels = { APPROACH: 'Tiếp cận', NEEDS: 'Xác định nhu cầu', RFQ: 'Nhận RFQ', QUOTED: 'Đã báo giá', NEGOTIATION: 'Đàm phán', WON: 'Thắng', LOST: 'Mất đơn' };
const requestStatusLabels = { NEW: 'Mới tiếp nhận', ASSIGNED: 'Đã phân công', QUOTED: 'Đã báo giá', CLOSED: 'Đã đóng' };
const blankOptions = (rows, selected, label = '— Chưa chọn —') => `<option value="">${label}</option>${options(rows, selected)}`;

async function renderSalesDashboard() {
  const data = await window.crm.getSalesDashboard();
  const tasks = data.tasks.length ? data.tasks.map(row => `<tr><td>${esc(row.due_date)}</td><td>${esc(row.title)}</td><td>${esc(row.customer_name || '')}</td><td>${esc(row.employee_name || '')}</td><td>${esc(taskStatusLabels[row.status] || row.status)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">Không có công việc đến hạn</td></tr>';
  const kpis = data.kpis.length ? data.kpis.map(row => `<tr><td>${esc(row.name)}</td><td>${row.actual_customers}/${row.target_customers}</td><td>${row.actual_calls}/${row.target_calls}</td><td>${row.actual_meetings}/${row.target_meetings}</td><td>${money(row.actual_revenue)} / ${money(row.target_revenue)} ₫</td><td>${row.bonus_percent}%</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Chưa thiết lập KPI tháng này</td></tr>';
  $('#content').innerHTML = `<div class="cards"><div class="stat-card"><span>Khách hàng B2B</span><strong>${data.customers}</strong><em>Đang hoạt động</em></div><div class="stat-card"><span>Công việc đến hạn</span><strong>${data.dueTasks}</strong><em>Trong 7 ngày</em></div><div class="stat-card"><span>Cơ hội đang mở</span><strong>${data.openOpportunities}</strong><em>${money(data.pipelineValue)} ₫ dự kiến</em></div><div class="stat-card"><span>Báo giá chờ phản hồi</span><strong>${data.pendingQuotes}</strong><em>Trạng thái đã gửi</em></div></div>
    <div class="panel"><div class="panel-head"><div><h2>Công việc sắp đến hạn</h2><p>Ưu tiên chăm sóc và theo dõi khách hàng</p></div><button class="btn primary" id="new-sales-task">+ Công việc</button></div><div class="table-wrap"><table><thead><tr><th>Hạn</th><th>Công việc</th><th>Khách hàng</th><th>Phụ trách</th><th>Trạng thái</th></tr></thead><tbody>${tasks}</tbody></table></div></div>
    <div class="panel"><div class="panel-head"><div><h2>KPI tháng ${today().slice(0, 7)}</h2><p>Kết quả ghi nhận từ khách hàng, lịch chăm sóc và đơn bán đã chốt</p></div></div><div class="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Khách hàng</th><th>Cuộc gọi</th><th>Gặp khách</th><th>Doanh số / Mục tiêu</th><th>Thưởng (%)</th></tr></thead><tbody>${kpis}</tbody></table></div></div>`;
}

async function renderSalesTasks() {
  const rows = await window.crm.listSalesTasks(); state.salesTasks = rows;
  const body = rows.length ? rows.map(row => `<tr><td>${esc(row.due_date)}</td><td><strong>${esc(row.title)}</strong></td><td>${esc(taskTypeLabels[row.task_type] || row.task_type)}</td><td>${esc(row.customer_name || '')}</td><td>${esc(row.employee_name || '')}</td><td>${esc(taskStatusLabels[row.status] || row.status)}</td><td>${esc(row.notes)}</td><td><div class="actions"><button class="btn small" data-sales-task-edit="${row.id}">Sửa</button><button class="btn small danger" data-sales-task-delete="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="8" class="empty">Chưa có công việc Sale</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Kế hoạch và công việc Sale</h2><p>Gọi điện, đi thị trường, gặp khách và lịch chăm sóc</p></div><button class="btn primary" id="new-sales-task">+ Thêm công việc</button></div><div class="table-wrap"><table><thead><tr><th>Hạn</th><th>Công việc</th><th>Loại</th><th>Khách hàng</th><th>Phụ trách</th><th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showSalesTaskForm(id) {
  await refreshBootstrap(); const row = (state.salesTasks || []).find(item => item.id === Number(id)) || {};
  openModal(`<h2>${id ? 'Sửa' : 'Thêm'} công việc Sale</h2><form id="sales-task-form" data-id="${id || ''}"><div class="form-grid"><div class="field span-2"><label>Tiêu đề *</label><input name="title" value="${esc(row.title || '')}" required></div><div class="field"><label>Loại công việc</label><select name="taskType">${Object.entries(taskTypeLabels).map(([value,label]) => `<option value="${value}" ${row.task_type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>Hạn thực hiện *</label><input name="dueDate" type="date" value="${esc(row.due_date || today())}" required></div><div class="field"><label>Khách hàng</label><select name="customerId">${blankOptions(state.bootstrap.customers, row.customer_id)}</select></div><div class="field"><label>Nhân viên</label><select name="employeeId">${blankOptions(state.bootstrap.employees, row.employee_id)}</select></div><div class="field"><label>Trạng thái</label><select name="status">${Object.entries(taskStatusLabels).map(([value,label]) => `<option value="${value}" ${row.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field span-4"><label>Ghi chú</label><textarea name="notes">${esc(row.notes || '')}</textarea></div></div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function renderOpportunities() {
  const rows = await window.crm.listOpportunities(); state.opportunities = rows;
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.code)}</strong></td><td>${esc(row.customer_name)}</td><td>${esc(row.employee_name || '')}</td><td>${esc(row.service)}</td><td>${esc(opportunityStageLabels[row.stage] || row.stage)}</td><td class="num">${money(row.expected_value)} ₫</td><td>${esc(row.expected_close_date)}</td><td>${esc(row.quote_number || '')}</td><td><div class="actions"><button class="btn small" data-opportunity-edit="${row.id}">Sửa</button><button class="btn small danger" data-opportunity-delete="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="9" class="empty">Chưa có cơ hội bán hàng</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Cơ hội bán hàng</h2><p>Tiếp cận → nhu cầu → RFQ → báo giá → đàm phán → kết quả</p></div><button class="btn primary" id="new-opportunity">+ Thêm cơ hội</button></div><div class="table-wrap"><table><thead><tr><th>Mã</th><th>Khách hàng</th><th>Phụ trách</th><th>Dịch vụ</th><th>Giai đoạn</th><th class="num">Doanh số dự kiến</th><th>Ngày dự kiến</th><th>Báo giá</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showOpportunityForm(id) {
  await refreshBootstrap(); const row = (state.opportunities || []).find(item => item.id === Number(id)) || {}; const quotes = await window.crm.listQuotes();
  openModal(`<h2>${id ? 'Sửa' : 'Thêm'} cơ hội bán hàng</h2><form id="opportunity-form" data-id="${id || ''}"><div class="form-grid"><div class="field"><label>Khách hàng *</label><select name="customerId" required>${options(state.bootstrap.customers, row.customer_id)}</select></div><div class="field"><label>Nhân viên phụ trách</label><select name="employeeId">${blankOptions(state.bootstrap.employees, row.employee_id)}</select></div><div class="field"><label>Giai đoạn</label><select name="stage">${Object.entries(opportunityStageLabels).map(([value,label]) => `<option value="${value}" ${row.stage === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>Ngày chốt dự kiến</label><input name="expectedCloseDate" type="date" value="${esc(row.expected_close_date || '')}"></div><div class="field span-2"><label>Dịch vụ quan tâm</label><input name="service" value="${esc(row.service || '')}"></div><div class="field"><label>Doanh số dự kiến</label><input name="expectedValue" class="money-input" inputmode="numeric" value="${moneyInput(row.expected_value || 0)}"></div><div class="field"><label>Báo giá liên kết</label><select name="quoteId"><option value="">Chưa liên kết</option>${quotes.map(q => `<option value="${q.id}" ${Number(row.quote_id) === q.id ? 'selected' : ''}>${esc(q.number)} — ${esc(q.customer_name)}</option>`).join('')}</select></div><div class="field span-4"><label>Ghi chú</label><textarea name="notes">${esc(row.notes || '')}</textarea></div></div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function renderQuoteRequests() {
  const rows = await window.crm.listQuoteRequests(); state.quoteRequests = rows;
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.request_date)}</td><td>${esc(row.customer_name)}</td><td>${esc(row.contact_name)}</td><td>${esc(row.drawing_reference)}</td><td>${esc(row.material)}</td><td class="num">${row.quantity}</td><td>${esc(row.employee_name || '')}</td><td>${esc(requestStatusLabels[row.status] || row.status)}</td><td><div class="actions"><button class="btn small" data-quote-request-edit="${row.id}">Chi tiết / Sửa</button><button class="btn small danger" data-quote-request-delete="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="10" class="empty">Chưa có yêu cầu báo giá</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Yêu cầu báo giá RFQ</h2><p>Bản vẽ, quy cách, vật tư, số lượng và người tiếp nhận</p></div><button class="btn primary" id="new-quote-request">+ Tiếp nhận yêu cầu</button></div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Khách hàng</th><th>Liên hệ</th><th>Bản vẽ</th><th>Vật tư</th><th class="num">Số lượng</th><th>Phụ trách</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showQuoteRequestForm(id) {
  await refreshBootstrap(); const row = (state.quoteRequests || []).find(item => item.id === Number(id)) || {};
  openModal(`<h2>${id ? 'Chi tiết / Sửa' : 'Tiếp nhận'} yêu cầu báo giá</h2><form id="quote-request-form" data-id="${id || ''}"><div class="form-grid"><div class="field"><label>Ngày tiếp nhận *</label><input name="requestDate" type="date" value="${esc(row.request_date || today())}" required></div><div class="field"><label>Khách hàng *</label><select name="customerId" required>${options(state.bootstrap.customers, row.customer_id)}</select></div><div class="field"><label>Người tiếp nhận</label><select name="employeeId">${blankOptions(state.bootstrap.employees, row.employee_id)}</select></div><div class="field"><label>Trạng thái</label><select name="status">${Object.entries(requestStatusLabels).map(([value,label]) => `<option value="${value}" ${row.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>Người liên hệ</label><input name="contactName" value="${esc(row.contact_name || '')}"></div><div class="field"><label>Số bản vẽ / tệp tham chiếu</label><input name="drawingReference" value="${esc(row.drawing_reference || '')}"></div><div class="field"><label>Vật tư</label><input name="material" value="${esc(row.material || '')}"></div><div class="field"><label>Số lượng</label><input name="quantity" type="number" min="0" step="any" value="${row.quantity || 0}"></div><div class="field span-4"><label>Quy cách / yêu cầu kỹ thuật</label><textarea name="specification">${esc(row.specification || '')}</textarea></div><div class="field span-4"><label>Ghi chú</label><textarea name="notes">${esc(row.notes || '')}</textarea></div></div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function renderSalesKpis() {
  const rows = await window.crm.listSalesKpis(); state.salesKpis = rows;
  const body = rows.length ? rows.map(row => `<tr><td>${esc(row.period)}</td><td>${esc(row.employee_name)}</td><td class="num">${row.target_customers}</td><td class="num">${row.target_calls}</td><td class="num">${row.target_meetings}</td><td class="num">${money(row.target_revenue)} ₫</td><td class="num">${row.bonus_percent}%</td><td>${esc(row.notes)}</td><td><div class="actions"><button class="btn small" data-sales-kpi-edit="${row.id}">Sửa</button><button class="btn small danger" data-sales-kpi-delete="${row.id}">Xóa</button></div></td></tr>`).join('') : '<tr><td colspan="9" class="empty">Chưa thiết lập KPI</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>KPI Sale theo tháng</h2><p>Mục tiêu khách hàng, hoạt động, doanh số và tỷ lệ thưởng</p></div><button class="btn primary" id="new-sales-kpi">+ Thiết lập KPI</button></div><div class="table-wrap"><table><thead><tr><th>Tháng</th><th>Nhân viên</th><th class="num">KH mục tiêu</th><th class="num">Cuộc gọi</th><th class="num">Gặp khách</th><th class="num">Doanh số mục tiêu</th><th class="num">Thưởng (%)</th><th>Ghi chú</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showSalesKpiForm(id) {
  await refreshBootstrap(); const row = (state.salesKpis || []).find(item => item.id === Number(id)) || {};
  openModal(`<h2>${id ? 'Sửa' : 'Thiết lập'} KPI Sale</h2><form id="sales-kpi-form" data-id="${id || ''}"><div class="form-grid"><div class="field"><label>Tháng *</label><input name="period" type="month" value="${esc(row.period || today().slice(0, 7))}" required></div><div class="field"><label>Nhân viên *</label><select name="employeeId" required>${options(state.bootstrap.employees, row.employee_id)}</select></div><div class="field"><label>Khách hàng mục tiêu</label><input name="targetCustomers" type="number" min="0" value="${row.target_customers || 0}"></div><div class="field"><label>Cuộc gọi mục tiêu</label><input name="targetCalls" type="number" min="0" value="${row.target_calls || 0}"></div><div class="field"><label>Gặp khách mục tiêu</label><input name="targetMeetings" type="number" min="0" value="${row.target_meetings || 0}"></div><div class="field"><label>Doanh số mục tiêu</label><input name="targetRevenue" class="money-input" inputmode="numeric" value="${moneyInput(row.target_revenue || 0)}"></div><div class="field"><label>Thưởng theo doanh số (%)</label><input name="bonusPercent" type="number" min="0" max="100" step="any" value="${row.bonus_percent || 0}"></div><div class="field span-4"><label>Ghi chú</label><textarea name="notes">${esc(row.notes || '')}</textarea></div></div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function showCustomerCare(customerId) {
  await refreshBootstrap(); const customer = state.bootstrap.customers.find(row => row.id === Number(customerId)); const rows = await window.crm.listCareLogs(Number(customerId));
  const body = rows.length ? rows.map(row => `<tr><td>${esc(row.care_date)}</td><td>${esc(taskTypeLabels[row.care_type] || row.care_type)}</td><td>${esc(row.employee_name || '')}</td><td>${esc(row.content)}</td><td>${esc(row.next_action_date)}</td><td><button type="button" class="btn small danger" data-care-log-delete="${row.id}" data-customer-id="${customerId}">Xóa</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty">Chưa có lịch sử chăm sóc</td></tr>';
  openModal(`<h2>Chăm sóc khách hàng — ${esc(customer?.name || '')}</h2><form id="care-log-form" data-customer-id="${customerId}"><div class="form-grid"><div class="field"><label>Ngày chăm sóc</label><input name="careDate" type="date" value="${today()}"></div><div class="field"><label>Hình thức</label><select name="careType">${Object.entries(taskTypeLabels).map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></div><div class="field"><label>Nhân viên</label><select name="employeeId">${blankOptions(state.bootstrap.employees)}</select></div><div class="field"><label>Ngày chăm sóc tiếp</label><input name="nextActionDate" type="date"></div><div class="field span-4"><label>Nội dung *</label><input name="content" required></div></div><div class="form-actions inline-actions"><button class="btn primary">Lưu lịch sử</button></div></form><div class="section-title">Lịch sử chăm sóc</div><div class="table-wrap"><table><thead><tr><th>Ngày</th><th>Hình thức</th><th>Nhân viên</th><th>Nội dung</th><th>Chăm sóc tiếp</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div>`);
}

async function renderMaster(type) {
  const cfg = masterConfig[type];
  const rows = await window.crm.listMaster(type);
  const head = cfg.columns.map(([, label]) => `<th>${label}</th>`).join('');
  const display = (row, key, format) => format === 'money' ? money(row[key]) : format === 'boolean' ? (Number(row[key]) ? 'Có' : 'Không') : key === 'transaction_type' ? (row[key] === 'RECEIPT' ? 'Thu' : 'Chi') : esc(row[key]);
  const body = rows.length ? rows.map(row => `<tr>${cfg.columns.map(([key,, format]) => `<td class="${format === 'money' ? 'num' : ''}">${display(row, key, format)}</td>`).join('')}<td class="actions">${type === 'customers' ? `<button class="btn small teal" data-customer-care="${row.id}">Chăm sóc</button>` : ''}<button class="btn small" data-master-edit="${type}" data-id="${row.id}">Sửa</button><button class="btn small danger" data-master-delete="${type}" data-id="${row.id}">Xóa</button></td></tr>`).join('') : '<tr><td class="empty" colspan="10">Chưa có dữ liệu</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Danh sách ${cfg.title.toLowerCase()}</h2><p>${rows.length} bản ghi đang hoạt động</p></div><button class="btn primary" data-master-new="${type}">+ Thêm mới</button></div><div class="table-wrap"><table><thead><tr>${head}<th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  state.masterRows = rows;
}

function showMasterForm(type, id) {
  const cfg = masterConfig[type];
  const row = (state.masterRows || []).find(item => item.id === Number(id)) || {};
  const fields = cfg.fields.map(([key, label, inputType, span]) => {
    if (inputType === 'transaction_type') return `<div class="field"><label>${label}</label><select name="${key}"><option value="RECEIPT" ${row[key] === 'RECEIPT' ? 'selected' : ''}>Thu</option><option value="PAYMENT" ${row[key] !== 'RECEIPT' ? 'selected' : ''}>Chi</option></select></div>`;
    if (inputType === 'boolean') return `<div class="field"><label>${label}</label><select name="${key}"><option value="1" ${Number(row[key] ?? 1) ? 'selected' : ''}>Có</option><option value="0" ${!Number(row[key] ?? 1) ? 'selected' : ''}>Không</option></select></div>`;
    if (inputType === 'employee_select') return `<div class="field"><label>${label}</label><select name="${key}"><option value="">Chưa phân công</option>${options(state.bootstrap.employees, row[key])}</select></div>`;
    return `<div class="field ${span ? `span-${span}` : ''}"><label>${label}</label><input name="${key}" type="${inputType === 'money' ? 'text' : inputType}" ${inputType === 'money' ? 'inputmode="numeric" class="money-input"' : ''} value="${esc(inputType === 'money' ? moneyInput(row[key] ?? '') : row[key] ?? '')}" ${key === 'code' || key === 'name' ? 'required' : ''}></div>`;
  }).join('');
  openModal(`<h2>${id ? 'Sửa' : 'Thêm'} ${cfg.title.toLowerCase()}</h2><form id="master-form" data-type="${type}" data-id="${id || ''}"><div class="form-grid">${fields}</div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu</button></div></form>`);
}

async function renderQuotes() {
  const allRows = await window.crm.listQuotes();
  const rows = state.quoteInvoiceFilter === 'ALL' ? allRows : allRows.filter(row => row.invoice_status === state.quoteInvoiceFilter);
  const filterButton = (value, label) => `<button class="invoice-filter ${state.quoteInvoiceFilter === value ? 'active' : ''}" data-invoice-filter="${value}">${esc(label)} <strong>${value === 'ALL' ? allRows.length : allRows.filter(row => row.invoice_status === value).length}</strong></button>`;
  const body = rows.length ? rows.map(row => `<tr><td><strong>${esc(row.number)}</strong></td><td>${esc(row.quote_date)}</td><td>${esc(row.customer_name)}</td><td>${esc(quoteTypeLabels[row.quote_type] || quoteTypeLabels.FULL_SERVICE)}</td><td>${esc(row.warehouse_name)}</td><td>${badge(row.status)}</td><td class="num"><strong>${money(row.total)} ₫</strong></td><td><div class="actions">
    <button class="invoice-status-button ${row.invoice_status}" data-quote-invoice data-id="${row.id}"><strong>${esc(invoiceStatusLabels[row.invoice_status] || invoiceStatusLabels.PENDING)}</strong>${row.invoice_status === 'ISSUED' ? `<small>${esc(row.invoice_number)} · ${esc(row.invoice_date)}</small>` : ''}</button>
  </div></td><td><div class="actions">
    <button class="btn small" data-doc-preview="quote" data-id="${row.id}">Xem/In</button><button class="btn small" data-doc-pdf="quote" data-id="${row.id}">PDF</button>
    ${row.status !== 'CONVERTED' ? `<button class="btn small" data-quote-detail data-id="${row.id}">Chi tiết / Sửa</button>` : ''}
    ${row.status === 'DRAFT' ? `<button class="btn small" data-quote-status="SENT" data-id="${row.id}">Đã gửi</button>` : ''}
    ${['DRAFT','SENT'].includes(row.status) ? `<button class="btn small teal" data-quote-status="WON" data-id="${row.id}">Chốt</button>` : ''}
    ${row.status === 'WON' ? `<button class="btn small primary" data-quote-convert data-id="${row.id}">Xuất bán</button>` : ''}
    ${!['CONVERTED','CANCELLED'].includes(row.status) ? `<button class="btn small danger" data-quote-status="CANCELLED" data-id="${row.id}">Hủy</button>` : ''}
    ${row.status !== 'CONVERTED' ? `<button class="btn small danger" data-quote-delete data-id="${row.id}">Xóa</button>` : ''}
  </div></td></tr>`).join('') : '<tr><td class="empty" colspan="9">Không có báo giá trong trạng thái hóa đơn này</td></tr>';
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Danh sách báo giá</h2><p>Nhìn và lọc trạng thái xuất hóa đơn ngay trên danh sách</p></div><button class="btn primary" id="new-quote">+ Lập báo giá</button></div><div class="invoice-filters">${filterButton('ALL', 'Tất cả')}${filterButton('PENDING', 'Chưa xuất HĐ')}${filterButton('ISSUED', 'Đã xuất HĐ')}${filterButton('RETAIL_NO_INVOICE', 'Không lấy HĐ – Bán lẻ')}</div><div class="table-wrap"><table><thead><tr><th>Số</th><th>Ngày</th><th>Khách hàng</th><th>Loại báo giá</th><th>Kho</th><th>Trạng thái</th><th class="num">Tổng tiền</th><th>Hóa đơn</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

async function showQuoteInvoiceForm(id) {
  const quote = await window.crm.getQuote(Number(id));
  const status = quote.invoice_status || 'PENDING';
  openModal(`<h2>Cập nhật hóa đơn — ${esc(quote.number)}</h2><form id="quote-invoice-form" data-id="${quote.id}"><div class="invoice-choices">
    ${Object.entries(invoiceStatusLabels).map(([value, label]) => `<label class="invoice-choice ${status === value ? 'selected' : ''}"><input type="radio" name="status" value="${value}" ${status === value ? 'checked' : ''}><strong>${esc(label)}</strong><small>${value === 'PENDING' ? 'Đơn cần theo dõi để xuất hóa đơn' : value === 'ISSUED' ? 'Hệ thống tự sinh số hóa đơn' : 'Khách mua lẻ và không nhận hóa đơn'}</small></label>`).join('')}
  </div><div id="issued-invoice-fields" class="form-grid ${status === 'ISSUED' ? '' : 'hidden'}"><div class="field span-2"><label>Số hóa đơn</label><strong class="readonly-value">${esc(quote.invoice_number || 'Tự động tạo khi lưu')}</strong></div><div class="field span-2"><label>Ngày xuất hóa đơn</label><input name="invoiceDate" type="date" value="${esc(quote.invoice_date || today())}"></div></div><div class="field"><label>Ghi chú hóa đơn</label><textarea name="notes" rows="3">${esc(quote.invoice_notes || '')}</textarea></div><div class="hint">Tiền tố và số bắt đầu được cài trong mục <strong>Cài đặt & sao lưu</strong>. Ngày xuất mặc định là hôm nay.</div><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu trạng thái hóa đơn</button></div></form>`);
  const form = $('#quote-invoice-form');
  $$('[name="status"]', form).forEach(input => input.addEventListener('change', () => {
    $$('.invoice-choice', form).forEach(choice => choice.classList.toggle('selected', choice.contains(input)));
    $('#issued-invoice-fields').classList.toggle('hidden', input.value !== 'ISSUED');
  }));
}

function quoteLine(index = Date.now()) {
  const b = state.bootstrap;
  return `<div class="line-card quote-line" data-index="${index}"><button type="button" class="btn small danger remove-line">Xóa dòng</button><input type="hidden" name="stockQuantity" value="0"><div class="line-grid quote-row quote-row-7">
    <div class="field"><label>Vật tư trừ kho</label><select name="productId"><option value="">Không trừ kho</option>${options(b.products)}</select></div>
    <div class="field"><label>Tên sản phẩm *</label><input name="description" required></div><div class="field"><label>ĐVT</label><input name="unit" value="cái"></div>
    <div class="field"><label>Dài (mm)</label><input name="lengthMm" type="number" min="0" step="any"></div><div class="field"><label>Rộng (mm)</label><input name="widthMm" type="number" min="0" step="any"></div><div class="field"><label>Dày (mm)</label><input name="thicknessMm" type="number" min="0" step="any"></div><div class="field"><label>Số lượng *</label><input name="quantity" type="number" min="0.001" step="any" value="1" required></div>
  </div><div class="line-grid quote-row quote-row-10">
    <div class="field"><label>Tỷ trọng</label><input name="density" type="number" min="0" step="any" value="7.85"></div><div class="field"><label>Giá vật liệu GC/kg</label><input name="materialPricePerKg" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Bột sơn trừ kho</label><select name="paintProductId"><option value="">Không trừ sơn</option>${options(b.products)}</select></div><div class="field"><label>Giá vật liệu sơn/kg</label><input name="paintMaterialPricePerKg" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Giờ gia công</label><input name="laborHours" type="number" min="0" step="any"></div><div class="field"><label>Giờ sơn tĩnh điện</label><input name="paintLaborHours" type="number" min="0" step="any"></div><div class="field"><label>Định mức bột sơn kg/m²</label><input name="powderNormKgM2" type="number" min="0" step="any"></div>
    <div class="field"><label>Số mặt sơn</label><input name="coatingSides" type="number" min="1" step="1" value="1"></div><div class="field"><label>Đơn giá/giờ</label><input name="laborRatePerHour" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Số người</label><input name="workerCount" type="number" min="1" step="any" value="1"></div>
  </div><div class="line-grid quote-row quote-row-9">
    <div class="field"><label>VT Tiêu hao/SP</label><input name="consumablesPerItem" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Khấu hao MMTB/giờ</label><input name="depreciationPerHour" type="text" inputmode="numeric" class="money-input"></div><div class="field"><label>Chi phí sơn tĩnh điện đ/m²</label><input name="coatingPricePerM2" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Điện (kWh)</label><input name="electricityKwh" type="number" min="0" step="any"></div><div class="field"><label>Giá điện/kWh</label><input name="electricityRate" type="text" inputmode="numeric" class="money-input"></div>
    <div class="field"><label>Hao hụt (%)</label><input name="wastePercent" type="number" min="0" step="any" value="0"></div><div class="field"><label>Lợi nhuận (%)</label><input name="profitPercent" type="number" min="0" step="any" value="15"></div><div class="field"><label>CK % khách (0–20)</label><input name="customerDiscountPercent" type="number" min="0" max="20" step="any" value="0"></div><div class="field"><label>VAT (%)</label><input name="vatPercent" type="number" min="0" step="any" value="10"></div>
  </div><div class="line-total"><span>KL vật liệu: <b data-result="weight">0</b> kg</span><span>KL sơn: <b data-result="paint-weight">0</b> kg</span><span>Giá vốn: <b data-result="cost">0</b> ₫</span><span>CK theo dõi: <b data-result="discount">0</b> ₫</span><span>Thành tiền: <strong data-result="total">0 ₫</strong></span></div></div>`;
}

function quoteItemFromDb(item) {
  const fields = { productId: 'product_id', paintProductId: 'paint_product_id', description: 'description', unit: 'unit', quantity: 'quantity', stockQuantity: 'stock_quantity',
    lengthMm: 'length_mm', widthMm: 'width_mm', thicknessMm: 'thickness_mm', density: 'density', materialPricePerKg: 'material_price_per_kg',
    paintMaterialPricePerKg: 'paint_material_price_per_kg', laborHours: 'labor_hours', paintLaborHours: 'paint_labor_hours', laborRatePerHour: 'labor_rate_per_hour', workerCount: 'worker_count', consumablesPerItem: 'consumables_per_item',
    electricityKwh: 'electricity_kwh', electricityRate: 'electricity_rate', depreciationPerHour: 'depreciation_per_hour', coatingSides: 'coating_sides',
    powderNormKgM2: 'powder_norm_kg_m2', coatingPricePerM2: 'coating_price_per_m2', wastePercent: 'waste_percent', profitPercent: 'profit_percent', customerDiscountPercent: 'customer_discount_percent', vatPercent: 'vat_percent' };
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
    <div class="field"><label>Loại báo giá</label><select name="quoteType"><option value="FULL_SERVICE" ${quote?.quote_type === 'FULL_SERVICE' || !quote ? 'selected' : ''}>Cung cấp vật tư + gia công + sơn</option><option value="CUSTOMER_MATERIAL" ${quote?.quote_type === 'CUSTOMER_MATERIAL' ? 'selected' : ''}>Gia công + sơn tĩnh điện</option><option value="PAINT_ONLY" ${quote?.quote_type === 'PAINT_ONLY' ? 'selected' : ''}>Chỉ sơn tĩnh điện</option></select></div>
    <div class="field"><label>Nhân viên Sale</label><select name="assignedEmployeeId"><option value="">Chưa phân công</option>${options(state.bootstrap.employees, quote?.assigned_employee_id)}</select></div>
    <div class="field"><label>Phí vận chuyển khách trả</label><input name="shippingCost" class="money-input" inputmode="numeric" value="${moneyInput(quote?.shipping_cost || 0)}"></div><div class="field"><label>VAT vận chuyển (%)</label><input name="shippingVatPercent" type="number" min="0" step="any" value="${quote?.shipping_vat_percent ?? 10}"></div>
    <div class="field span-2"><label>Thông tin vận chuyển</label><input name="shippingInfo" value="${esc(quote?.shipping_info || '')}" placeholder="Để trống nếu công ty trả"></div><div class="field span-2"><label>Ghi chú / điều khoản</label><input name="notes" value="${esc(quote?.notes || '')}"></div>
    <div id="quote-customer-info" class="field hint span-4"></div>
  </div><div class="hint">Khi xuất bán, vật tư chính được trừ theo khối lượng tính từ kích thước; bột sơn được trừ theo diện tích × định mức × số mặt sơn × số lượng. Chiết khấu khách chỉ theo dõi nội bộ, không trừ vào tổng tiền và không in trên phiếu xuất bán.</div><div class="section-title">Chi tiết giá thành</div><div id="quote-lines">${items.map((_, index) => quoteLine(index)).join('')}</div><button type="button" class="btn" id="add-quote-line">+ Thêm dòng</button><div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">${quote ? 'Lưu thay đổi' : 'Lưu báo giá'}</button></div></form>`);
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
  $('[data-result="paint-weight"]', node).textContent = calc.paintWeight.toFixed(3);
  $('[data-result="cost"]', node).textContent = money(calc.costBeforeProfit);
  $('[data-result="discount"]', node).textContent = money(calc.customerDiscount);
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
  state.bannerData = await window.crm.getBanner();
  const body = data.templates.map(row => `<tr><td>${esc(row.name)}</td><td>${esc(data.types[row.document_type])}</td><td>${row.is_default ? '<span class="badge RECEIVED">Mặc định</span>' : ''}</td><td><div class="actions"><button class="btn small" data-template-edit data-id="${row.id}">Sửa / Xem trước</button>${row.is_default ? '' : `<button class="btn small teal" data-template-default data-id="${row.id}">Chọn mặc định</button><button class="btn small danger" data-template-delete data-id="${row.id}">Xóa</button>`}</div></td></tr>`).join('');
  $('#content').innerHTML = `<div class="panel"><div class="panel-head"><div><h2>Thư viện mẫu in</h2><p>Chỉnh trực quan, xem trước tức thời và chèn biến bằng một lần bấm</p></div><button class="btn primary" id="new-print-template">+ Thêm mẫu</button></div><div class="table-wrap"><table><thead><tr><th>Tên mẫu</th><th>Loại chứng từ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${body}</tbody></table></div><div class="hint">Mở một mẫu để xem danh sách biến có mô tả và dữ liệu minh họa. Bảng dòng hàng dùng biến <strong>{{items_table}}</strong>.</div></div>`;
}

function showPrintTemplateForm(id) {
  const data = state.printTemplateData;
  const row = data.templates.find(item => item.id === Number(id)) || {};
  const initialType = row.document_type || Object.keys(data.types)[0];
  let layout;
  try { layout = row.layout_json ? JSON.parse(row.layout_json) : window.TemplateEditor.defaultLayout(initialType); }
  catch { layout = window.TemplateEditor.defaultLayout(initialType); }
  const help = window.TemplateEditor.variables.filter(item => data.variables.includes(item.name));
  const variableGroups = [...new Set(help.map(item => item.group))].map(group => `<section class="variable-group"><h4>${esc(group)}</h4>${help.filter(item => item.group === group).map(item => `<button type="button" class="variable-chip" data-insert-variable="${item.name}" data-variable-search="${esc(`${item.name} ${item.label}`.toLowerCase())}" title="Bấm để chèn {{${item.name}}}"><code>{{${item.name}}}</code><span>${esc(item.label)}</span><small>Ví dụ: ${esc(item.sample)}</small></button>`).join('')}</section>`).join('');
  openModal(`<h2>${id ? 'Sửa và xem trước mẫu in' : 'Tạo mẫu in'}</h2><form id="print-template-form" class="template-editor-form" data-id="${id || ''}"><div class="form-grid template-heading"><div class="field span-2"><label>Tên mẫu</label><input name="name" value="${esc(row.name || '')}" required></div><div class="field span-2"><label>Loại chứng từ</label><select name="documentType">${Object.entries(data.types).map(([key, label]) => `<option value="${key}" ${row.document_type === key ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div></div>
    <div class="template-editor-shell"><section class="template-compose"><div class="template-section-head"><div><strong>Chỉnh theo từng khối</strong><small>Bật/tắt khối và sửa nội dung; không cần biết HTML</small></div></div><div class="template-blocks">
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showBanner"> Hiển thị banner dùng chung</label><label class="toggle-line"><input type="checkbox" name="showWatermark"> Hiển thị logo chìm</label><div class="banner-editor-preview"><img src="${esc(state.bannerData?.dataUrl || '')}" alt="Banner dùng chung"></div><small>Đổi banner tại Cài đặt & sao lưu. Ảnh được giữ nguyên tỷ lệ trên giấy A5.</small></article>
      <article class="template-block-card"><div class="field"><label>Tiêu đề chứng từ</label><input name="title"></div><label class="toggle-line"><input type="checkbox" name="showMeta"> Hiển thị dòng số/ngày</label><div class="field"><label>Dòng số và ngày</label><textarea name="metaText" rows="2"></textarea></div></article>
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showInfo"> Hiển thị khối thông tin</label><div class="field"><label>Tiêu đề khối</label><input name="infoHeading"></div><div class="field"><label>Nội dung thông tin</label><textarea name="infoText" rows="6"></textarea></div></article>
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showTable"> Hiển thị bảng chi tiết hàng hóa</label><div class="field"><label>Tiêu đề bảng</label><input name="tableHeading"></div><div class="hint compact">Bảng được tạo tự động bằng biến <strong>{{items_table}}</strong>.</div></article>
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showSummary"> Hiển thị tổng tiền</label><div class="field"><label>Nội dung tổng hợp</label><textarea name="summaryText" rows="5"></textarea></div></article>
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showNotes"> Hiển thị ghi chú / điều khoản</label><div class="field"><label>Nội dung ghi chú</label><textarea name="notesText" rows="4"></textarea></div></article>
      <article class="template-block-card"><label class="toggle-line"><input type="checkbox" name="showSignatures"> Hiển thị phần ký tên</label><div class="field"><label>Các vị trí ký — mỗi dòng một vị trí</label><textarea name="signaturesText" rows="4"></textarea></div></article>
    </div></section>
      <aside class="template-side"><section class="template-preview-panel"><div class="template-section-head"><div><strong>Xem trước trực tiếp</strong><small>Dữ liệu minh họa, không phải chứng từ thật</small></div></div><div class="template-preview"><div id="template-preview-paper" class="template-preview-paper"></div></div></section><section class="variable-library"><div class="template-section-head"><div><strong>Danh sách biến</strong><small>Bấm vào một biến để chèn</small></div><input id="variable-search" type="search" placeholder="Tìm biến..."></div><div id="variable-list" class="variable-list">${variableGroups}</div></section></aside></div>
    <div class="form-actions"><button type="button" class="btn" data-close-modal>Đóng</button><button class="btn primary">Lưu mẫu</button></div></form>`);

  const form = $('#print-template-form');
  const type = $('[name="documentType"]', form);
  const layoutFields = ['title', 'metaText', 'infoHeading', 'infoText', 'tableHeading', 'summaryText', 'notesText', 'signaturesText'];
  const toggleFields = ['showBanner', 'showWatermark', 'showMeta', 'showInfo', 'showTable', 'showSummary', 'showNotes', 'showSignatures'];
  let activeTextField = $('[name="title"]', form);
  const readLayout = () => Object.fromEntries([
    ...layoutFields.map(name => [name, $(`[name="${name}"]`, form).value]),
    ...toggleFields.map(name => [name, $(`[name="${name}"]`, form).checked])
  ]);
  const writeLayout = values => {
    layoutFields.forEach(name => $(`[name="${name}"]`, form).value = values[name] || '');
    toggleFields.forEach(name => $(`[name="${name}"]`, form).checked = Boolean(values[name]));
  };
  const updatePreview = () => {
    const content = window.TemplateEditor.buildContent(readLayout());
    $('#template-preview-paper').innerHTML = window.TemplateEditor.render(content, type.value, { banner: state.bannerData?.dataUrl });
  };
  writeLayout(layout);
  $$('input,textarea', $('.template-blocks', form)).forEach(input => {
    input.addEventListener('focus', () => { if (input.type !== 'checkbox') activeTextField = input; });
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });
  type.addEventListener('change', () => { writeLayout(window.TemplateEditor.defaultLayout(type.value)); updatePreview(); });
  $$('.variable-chip', form).forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => {
      const token = `{{${button.dataset.insertVariable}}}`;
      const start = activeTextField.selectionStart ?? activeTextField.value.length;
      const end = activeTextField.selectionEnd ?? start;
      activeTextField.setRangeText(token, start, end, 'end');
      activeTextField.focus(); updatePreview();
    });
  });
  $('#variable-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    $$('.variable-chip', form).forEach(button => button.hidden = Boolean(query) && !button.dataset.variableSearch.includes(query));
    $$('.variable-group', form).forEach(group => group.hidden = !$$('.variable-chip:not([hidden])', group).length);
  });
  form.getTemplateLayout = readLayout;
  form.closest('.modal-card').classList.add('template-modal-card');
  updatePreview();
}

async function renderSettings() {
  const s = state.bootstrap?.settings || {};
  state.bannerData = await window.crm.getBanner();
  $('#content').innerHTML = `<div class="split"><div class="panel"><div class="panel-head"><div><h2>Thông tin doanh nghiệp</h2><p>Hiển thị trên chứng từ in</p></div></div><form id="settings-form"><div class="form-grid"><div class="field span-4"><label>Tên doanh nghiệp</label><input name="company_name" value="${esc(s.company_name)}"></div><div class="field span-4"><label>Địa chỉ</label><input name="company_address" value="${esc(s.company_address)}"></div><div class="field span-2"><label>Điện thoại</label><input name="company_phone" value="${esc(s.company_phone)}"></div><div class="field span-2"><label>Mã số thuế</label><input name="tax_code" value="${esc(s.tax_code)}"></div><div class="field span-2"><label>Tiền tố số hóa đơn</label><input name="invoice_prefix" value="${esc(s.invoice_prefix || 'HD')}" maxlength="10" required></div><div class="field span-2"><label>Số hóa đơn bắt đầu</label><input name="invoice_start" type="number" min="1" step="1" value="${esc(s.invoice_start || '1')}" required></div></div><div class="hint">Ví dụ tiền tố HD, số bắt đầu 1 sẽ tạo HD${new Date().getFullYear()}-0001 và tự chuyển về số bắt đầu khi sang năm mới.</div><div class="form-actions"><button class="btn primary">Lưu cài đặt</button></div></form></div><div class="panel"><div class="panel-head"><div><h2>Banner dùng chung</h2><p>Áp dụng cho toàn bộ mẫu in A5 dọc</p></div></div><div class="shared-banner-preview"><img src="${esc(state.bannerData.dataUrl)}" alt="Banner dùng chung"></div><button class="btn teal" id="pick-shared-banner">Thay banner</button><div class="hint">Ảnh JPG, PNG hoặc WebP. Hệ thống hiển thị đủ ảnh, giữ nguyên tỷ lệ và không cắt phần trên/dưới.</div></div><div class="panel"><div class="panel-head"><div><h2>Sao lưu dữ liệu</h2><p>Tạo bản sao cơ sở dữ liệu để cất ở ổ khác</p></div></div><p>Dữ liệu đang được lưu cục bộ trên máy. Nên sao lưu cuối mỗi ngày làm việc và chép bản sao sang OneDrive, USB hoặc ổ mạng.</p><button class="btn teal" id="backup-now">Sao lưu ngay</button><div class="hint">Bản sao không bao gồm file cài đặt; chỉ cần cài lại ứng dụng rồi khôi phục file dữ liệu khi có sự cố.</div></div><div class="panel"><div class="panel-head"><div><h2>Dữ liệu kiểm tra</h2><p>Khách hàng, hàng hóa, tồn kho, báo giá, đơn mua và phiếu thu mẫu</p></div></div><button class="btn primary" id="seed-demo">Tạo dữ liệu mẫu</button><div class="hint">Dữ liệu mẫu có mã bắt đầu bằng DEMO-. Nút này chạy lại không tạo trùng.</div></div><div class="panel"><div class="panel-head"><div><h2>Hướng dẫn sử dụng</h2><p>Quy trình từ danh mục đến báo cáo</p></div></div><button class="btn" id="open-guide">Mở hướng dẫn</button></div></div>`;
}

function showGuide() {
  openModal(`<h2>Hướng dẫn sử dụng nhanh</h2><ol><li>Vào <strong>Cài đặt & sao lưu</strong>, nhập thông tin doanh nghiệp và tạo dữ liệu mẫu nếu cần.</li><li>Kiểm tra các danh mục: hàng hóa, khách hàng, nhà cung cấp, kho, quỹ và nhân viên.</li><li>Vào <strong>Báo giá</strong> → Lập báo giá. Chọn riêng vật tư chính và bột sơn trừ kho; nhập kích thước, định mức sơn, giờ gia công, giờ sơn và các chi phí.</li><li>Khối lượng vật liệu và sơn được tính tự động. CK khách chỉ theo dõi nội bộ; phí vận chuyển khách trả được cộng trước VAT.</li><li>Dùng <strong>Chi tiết / Sửa</strong> để sửa toàn bộ dòng giá thành. Chốt báo giá rồi bấm <strong>Xuất bán</strong> để trừ tồn.</li><li>Dùng nhóm <strong>CRM Sale B2B</strong> để quản lý công việc, lịch chăm sóc, cơ hội, RFQ và KPI.</li><li>Mọi bảng có ô lọc nhanh, số dòng và tổng các cột số theo kết quả đang hiển thị.</li><li>Vào <strong>Đơn đặt hàng</strong> để đặt mua; chỉ khi bấm Nhận toàn bộ thì tồn kho và công nợ mới tăng.</li><li>Đối chiếu tại Tồn kho, Công nợ và Báo cáo. Sao lưu cuối ngày.</li></ol><div class="hint">Chứng từ kho/quỹ đã ghi sổ: xem Chi tiết; nếu nhập sai, Xóa để hệ thống đảo số liệu rồi lập lại. Dữ liệu xóa là vĩnh viễn.</div><div class="form-actions"><button class="btn primary" data-close-modal>Đã hiểu</button></div>`);
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
    if (target.dataset.customerCare !== undefined) return showCustomerCare(Number(target.dataset.customerCare));
    if (target.dataset.careLogDelete !== undefined) { if (!confirm('Xóa lịch sử chăm sóc này?')) return; await window.crm.deleteCareLog(Number(target.dataset.careLogDelete)); toast('Đã xóa lịch sử.'); return showCustomerCare(Number(target.dataset.customerId)); }
    if (target.id === 'new-sales-task') return showSalesTaskForm();
    if (target.dataset.salesTaskEdit !== undefined) return showSalesTaskForm(Number(target.dataset.salesTaskEdit));
    if (target.dataset.salesTaskDelete !== undefined) { if (!confirm('Xóa công việc này?')) return; await window.crm.deleteSalesTask(Number(target.dataset.salesTaskDelete)); toast('Đã xóa công việc.'); return navigate('sales-tasks'); }
    if (target.id === 'new-opportunity') return showOpportunityForm();
    if (target.dataset.opportunityEdit !== undefined) return showOpportunityForm(Number(target.dataset.opportunityEdit));
    if (target.dataset.opportunityDelete !== undefined) { if (!confirm('Xóa cơ hội bán hàng này?')) return; await window.crm.deleteOpportunity(Number(target.dataset.opportunityDelete)); toast('Đã xóa cơ hội.'); return navigate('opportunities'); }
    if (target.id === 'new-quote-request') return showQuoteRequestForm();
    if (target.dataset.quoteRequestEdit !== undefined) return showQuoteRequestForm(Number(target.dataset.quoteRequestEdit));
    if (target.dataset.quoteRequestDelete !== undefined) { if (!confirm('Xóa yêu cầu báo giá này?')) return; await window.crm.deleteQuoteRequest(Number(target.dataset.quoteRequestDelete)); toast('Đã xóa yêu cầu.'); return navigate('quote-requests'); }
    if (target.id === 'new-sales-kpi') return showSalesKpiForm();
    if (target.dataset.salesKpiEdit !== undefined) return showSalesKpiForm(Number(target.dataset.salesKpiEdit));
    if (target.dataset.salesKpiDelete !== undefined) { if (!confirm('Xóa KPI này?')) return; await window.crm.deleteSalesKpi(Number(target.dataset.salesKpiDelete)); toast('Đã xóa KPI.'); return navigate('sales-kpis'); }
    if (target.id === 'new-quote') return showQuoteForm();
    if (target.dataset.invoiceFilter) { state.quoteInvoiceFilter = target.dataset.invoiceFilter; return navigate('quotes'); }
    if (target.dataset.quoteInvoice !== undefined) return showQuoteInvoiceForm(Number(target.dataset.id));
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
    if (target.id === 'pick-shared-banner') { const banner = await window.crm.pickBanner(); if (banner) { state.bannerData = banner; await refreshBootstrap(); toast('Đã thay banner dùng chung.'); return renderSettings(); } return; }
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
  if (event.target.name === 'paintProductId' && event.target.closest('.quote-line')) {
    const product = state.bootstrap.products.find(item => item.id === Number(event.target.value));
    const line = event.target.closest('.quote-line');
    if (product && !$('[name="paintMaterialPricePerKg"]', line).value) {
      $('[name="paintMaterialPricePerKg"]', line).value = moneyInput(product.purchase_price);
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
      const payload = { date: head.date, customerId: Number(head.customerId), warehouseId: Number(head.warehouseId), quoteType: head.quoteType,
        assignedEmployeeId: Number(head.assignedEmployeeId) || null, shippingCost: number(head.shippingCost), shippingVatPercent: number(head.shippingVatPercent),
        shippingInfo: head.shippingInfo, notes: head.notes, items: $$('.quote-line', form).map(lineData) };
      const result = form.dataset.id ? await window.crm.updateQuote(Number(form.dataset.id), payload) : await window.crm.createQuote(payload);
      closeModal(); toast(form.dataset.id ? `Đã cập nhật ${result.number}.` : `Đã tạo báo giá ${result.number}.`); return navigate('quotes');
    }
    if (form.id === 'quote-invoice-form') {
      const fields = Object.fromEntries(new FormData(form));
      const result = await window.crm.setQuoteInvoice(Number(form.dataset.id), { status: fields.status, invoiceDate: fields.invoiceDate, notes: fields.notes });
      closeModal(); toast(result.invoice_status === 'ISSUED' ? `Đã ghi nhận hóa đơn ${result.invoice_number}.` : 'Đã cập nhật trạng thái hóa đơn.'); return navigate('quotes');
    }
    if (form.id === 'care-log-form') {
      const fields = Object.fromEntries(new FormData(form)); const customerId = Number(form.dataset.customerId);
      await window.crm.saveCareLog(null, { ...fields, customerId, employeeId: Number(fields.employeeId) || null }); toast('Đã lưu lịch sử chăm sóc.'); return showCustomerCare(customerId);
    }
    if (form.id === 'sales-task-form') {
      const fields = Object.fromEntries(new FormData(form));
      await window.crm.saveSalesTask(Number(form.dataset.id) || null, { ...fields, customerId: Number(fields.customerId) || null, employeeId: Number(fields.employeeId) || null }); closeModal(); toast('Đã lưu công việc.'); return navigate('sales-tasks');
    }
    if (form.id === 'opportunity-form') {
      const fields = Object.fromEntries(new FormData(form));
      await window.crm.saveOpportunity(Number(form.dataset.id) || null, { ...fields, customerId: Number(fields.customerId), employeeId: Number(fields.employeeId) || null, quoteId: Number(fields.quoteId) || null, expectedValue: number(fields.expectedValue) }); closeModal(); toast('Đã lưu cơ hội bán hàng.'); return navigate('opportunities');
    }
    if (form.id === 'quote-request-form') {
      const fields = Object.fromEntries(new FormData(form));
      await window.crm.saveQuoteRequest(Number(form.dataset.id) || null, { ...fields, customerId: Number(fields.customerId), employeeId: Number(fields.employeeId) || null, quantity: Number(fields.quantity) || 0 }); closeModal(); toast('Đã lưu yêu cầu báo giá.'); return navigate('quote-requests');
    }
    if (form.id === 'sales-kpi-form') {
      const fields = Object.fromEntries(new FormData(form));
      await window.crm.saveSalesKpi(Number(form.dataset.id) || null, { ...fields, employeeId: Number(fields.employeeId), targetCustomers: Number(fields.targetCustomers) || 0, targetCalls: Number(fields.targetCalls) || 0, targetMeetings: Number(fields.targetMeetings) || 0, targetRevenue: number(fields.targetRevenue), bonusPercent: Number(fields.bonusPercent) || 0 }); closeModal(); toast('Đã lưu KPI.'); return navigate('sales-kpis');
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
      fields.layout = form.getTemplateLayout();
      fields.content = window.TemplateEditor.buildContent(fields.layout);
      if (form.dataset.id) fields.id = Number(form.dataset.id);
      await window.crm.savePrintTemplate(fields); closeModal(); toast('Đã lưu mẫu in.'); return navigate('print-templates');
    }
    if (form.id === 'settings-form') { await window.crm.saveSettings(Object.fromEntries(new FormData(form))); await refreshBootstrap(); toast('Đã lưu cài đặt.'); return renderSettings(); }
  } catch (error) { toast(error.message, true); }
});

$('#today').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
refreshBootstrap().then(() => navigate('dashboard')).catch(error => toast(error.message, true));
