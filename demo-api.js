'use strict';

(() => {
  const copy = value => structuredClone(value);
  const n = value => Number(value) || 0;
  const date = () => new Date().toISOString().slice(0, 10);
  const nextId = rows => Math.max(0, ...rows.map(row => Number(row.id))) + 1;
  const total = items => Math.round(items.reduce((sum, item) => sum + n(item.line_total ?? item.quantity * item.unit_price * (1 + n(item.vat_percent) / 100)), 0));

  function calculateCost(input = {}) {
    const areaEach = n(input.lengthMm) * n(input.widthMm) / 1_000_000;
    const weightEach = areaEach * n(input.thicknessMm) * (n(input.density) || 7.85);
    const quantity = Math.max(0, n(input.quantity));
    const totalWeight = weightEach * quantity;
    const materialCost = totalWeight * n(input.materialPricePerKg);
    const laborCost = n(input.laborHours) * n(input.laborRatePerHour) * Math.max(1, n(input.workerCount));
    const paintLaborCost = n(input.paintLaborHours) * n(input.laborRatePerHour) * Math.max(1, n(input.workerCount));
    const consumablesCost = n(input.consumablesPerItem) * quantity;
    const electricityCost = n(input.electricityKwh) * n(input.electricityRate);
    const depreciationCost = n(input.depreciationPerHour) * n(input.laborHours);
    const coatingArea = areaEach * Math.max(1, n(input.coatingSides)) * quantity;
    const paintWeight = coatingArea * n(input.powderNormKgM2);
    const paintMaterialCost = paintWeight * n(input.paintMaterialPricePerKg);
    const coatingCost = coatingArea * n(input.coatingPricePerM2);
    const wasteCost = (materialCost + coatingCost) * n(input.wastePercent) / 100;
    const costBeforeProfit = materialCost + paintMaterialCost + laborCost + paintLaborCost + consumablesCost + electricityCost + depreciationCost + coatingCost + wasteCost;
    const profit = costBeforeProfit * n(input.profitPercent) / 100;
    const priceBeforeVat = costBeforeProfit + profit;
    const customerDiscount = priceBeforeVat * Math.min(20, Math.max(0, n(input.customerDiscountPercent))) / 100;
    const vat = priceBeforeVat * n(input.vatPercent) / 100;
    const round = value => Math.round(value + Number.EPSILON);
    return { areaEach, weightEach, totalWeight, coatingArea, paintWeight, materialCost: round(materialCost), paintMaterialCost: round(paintMaterialCost), laborCost: round(laborCost), paintLaborCost: round(paintLaborCost), consumablesCost: round(consumablesCost),
      electricityCost: round(electricityCost), depreciationCost: round(depreciationCost), coatingCost: round(coatingCost), wasteCost: round(wasteCost),
      costBeforeProfit: round(costBeforeProfit), profit: round(profit), priceBeforeVat: round(priceBeforeVat), customerDiscount: round(customerDiscount), vat: round(vat), total: round(priceBeforeVat + vat) };
  }

  function quoteItem(quoteId, input, id) {
    const calc = calculateCost(input);
    if (n(input.customerDiscountPercent) < 0 || n(input.customerDiscountPercent) > 20) throw new Error('Chiết khấu khách hàng phải từ 0 đến 20%.');
    return { id, quote_id: quoteId, product_id: Number(input.productId) || null, paint_product_id: Number(input.paintProductId) || null, description: input.description, unit: input.unit || 'cái', quantity: n(input.quantity),
      stock_quantity: calc.totalWeight || n(input.stockQuantity), paint_weight: calc.paintWeight, length_mm: n(input.lengthMm), width_mm: n(input.widthMm), thickness_mm: n(input.thicknessMm), density: n(input.density) || 7.85,
      material_price_per_kg: n(input.materialPricePerKg), paint_material_price_per_kg: n(input.paintMaterialPricePerKg), labor_hours: n(input.laborHours), paint_labor_hours: n(input.paintLaborHours), powder_norm_kg_m2: n(input.powderNormKgM2), labor_rate_per_hour: n(input.laborRatePerHour), worker_count: n(input.workerCount) || 1,
      consumables_per_item: n(input.consumablesPerItem), electricity_kwh: n(input.electricityKwh), electricity_rate: n(input.electricityRate), depreciation_per_hour: n(input.depreciationPerHour),
      coating_sides: n(input.coatingSides) || 1, coating_price_per_m2: n(input.coatingPricePerM2), waste_percent: n(input.wastePercent), profit_percent: n(input.profitPercent),
      customer_discount_percent: n(input.customerDiscountPercent), customer_discount_amount: calc.customerDiscount, vat_percent: n(input.vatPercent), cost_before_profit: calc.costBeforeProfit, price_before_vat: calc.priceBeforeVat, vat_amount: calc.vat, line_total: calc.total, formula_json: '{}' };
  }

  function makeDb() {
    const db = {
      settings: { company_name: 'CÔNG TY TNHH SẢN XUẤT TM-DV MẠNH HÙNG', company_address: 'TP.HCM', company_phone: '0901 234 567', tax_code: '0312345678', invoice_prefix: 'HD', invoice_start: '1', banner_data: 'logo.jpg' },
      customers: [{ id: 1, code: 'DEMO-KH01', name: 'Công ty Nội thất An Phát', phone: '0901 234 567', address: '125 Nguyễn Văn Linh, Quận 7, TP.HCM', tax_code: '0312345678', industrial_zone: 'KCN Tân Tạo', contact_name: 'Trần Thanh An', contact_position: 'Trưởng phòng mua hàng', contact_phone: '0909 111 222', industry: 'Nội thất kim loại', interested_services: 'Gia công, sơn tĩnh điện', assigned_employee_id: 1, active: 1 }],
      suppliers: [{ id: 1, code: 'DEMO-NCC01', name: 'Công ty Thép Việt', phone: '028 3822 6688', address: 'KCN Sóng Thần, Bình Dương', tax_code: '3700123456', active: 1 }],
      products: [{ id: 1, code: 'DEMO-INOX304', name: 'Tấm inox 304 dày 1mm', unit: 'kg', purchase_price: 45000, sale_price: 65000, vat_rate: 10, active: 1 },
        { id: 2, code: 'DEMO-SON01', name: 'Sơn tĩnh điện', unit: 'kg', purchase_price: 85000, sale_price: 110000, vat_rate: 10, active: 1 }],
      warehouses: [{ id: 1, code: 'KHO01', name: 'Kho chính', address: 'TP.HCM', active: 1 }, { id: 2, code: 'KHO02', name: 'Kho thành phẩm', address: 'TP.HCM', active: 1 }],
      employees: [{ id: 1, code: 'DEMO-NV01', name: 'Nguyễn Văn Minh', phone: '0912 345 678', address: 'TP.HCM', active: 1 }],
      cash_accounts: [{ id: 1, code: 'TM', name: 'Tiền mặt', opening_balance: 22500000, active: 1 }, { id: 2, code: 'VCB', name: 'Vietcombank', opening_balance: 100000000, active: 1 }],
      income_expense_categories: [{ id: 1, code: 'THUKHAC', name: 'Thu khác', transaction_type: 'RECEIPT', affects_profit: 1, active: 1 },
        { id: 2, code: 'CHIKHAC', name: 'Chi khác', transaction_type: 'PAYMENT', affects_profit: 1, active: 1 },
        { id: 3, code: 'MUAVT', name: 'Mua vật tư, thiết bị', transaction_type: 'PAYMENT', affects_profit: 1, active: 1 },
        { id: 4, code: 'TAMUNG', name: 'Tạm ứng', transaction_type: 'PAYMENT', affects_profit: 0, active: 1 },
        { id: 5, code: 'HOANUNG', name: 'Thanh toán / hoàn ứng', transaction_type: 'PAYMENT', affects_profit: 1, active: 1 }],
      quotes: [], sales: [], purchase_orders: [], purchase_requests: [], invoice_files: [], print_templates: [], stock_documents: [], cash_transactions: [], movements: [],
      customer_care_logs: [], sales_tasks: [], opportunities: [], quote_requests: [], sales_kpis: [],
      counters: { quote: 1, sale: 0, po: 1, request: 1, receipt: 0, stock: 1, cash: 1 }
    };
    const input = { productId: 1, paintProductId: 2, description: 'Bàn inox gia công 1200 x 600', unit: 'cái', quantity: 2, lengthMm: 1200, widthMm: 600,
      thicknessMm: 1, density: 7.85, materialPricePerKg: 45000, paintMaterialPricePerKg: 85000, laborHours: 3, paintLaborHours: 2, powderNormKgM2: 0.18, laborRatePerHour: 80000, workerCount: 2, consumablesPerItem: 50000,
      electricityKwh: 8, electricityRate: 3500, depreciationPerHour: 25000, coatingSides: 2, coatingPricePerM2: 90000, wastePercent: 5, profitPercent: 20, customerDiscountPercent: 5, vatPercent: 10 };
    db.quotes.push({ id: 1, number: 'BG2026-0001', quote_date: date(), customer_id: 1, warehouse_id: 1, assigned_employee_id: 1, quote_type: 'FULL_SERVICE', shipping_cost: 150000, shipping_vat_percent: 10, shipping_info: 'Giao tại xưởng khách hàng', status: 'SENT', invoice_status: 'PENDING', invoice_number: '', invoice_date: '', invoice_notes: '', notes: 'DEMO: Báo giá mẫu đầy đủ', items: [quoteItem(1, input, 1)] });
    db.purchase_orders.push({ id: 1, number: 'PO2026-0001', order_date: date(), supplier_id: 1, warehouse_id: 1, status: 'DRAFT', notes: 'DEMO: Đơn mua mẫu',
      project: 'Xưởng sản xuất', delivery_date: date(), delivery_location: 'Kho chính', payment_terms: 'Chuyển khoản sau khi nhận hàng', quality_requirements: 'Hàng đúng quy cách', warranty: '', documents_required: 'Hóa đơn GTGT, phiếu giao hàng', shipping_cost: 0,
      items: [{ id: 1, product_id: 2, quantity: 20, unit_price: 85000, vat_percent: 10, received_quantity: 0 }] });
    db.purchase_requests.push({ id: 1, number: 'DN2026-0001', request_date: date(), employee_id: 1, requester_name: '', department: 'Sản xuất', project: 'Đơn hàng DEMO', purpose: 'Mua vật tư sản xuất', needed_date: date(), proposed_supplier: 'Công ty Thép Việt', technical_requirements: 'Đúng quy cách', reason: 'Bổ sung tồn kho', notes: 'Có báo giá kèm theo', status: 'DRAFT', items: [{ id: 1, item_name: 'Tấm inox 304', specification: 'Dày 1mm', unit: 'kg', quantity: 50, estimated_unit_price: 45000, notes: '' }] });
    db.invoice_files.push({ id: 1, invoice_type: 'INPUT', invoice_month: date().slice(0, 7), invoice_number: 'DEMO-HĐ01', partner_name: 'Công ty Thép Việt', notes: 'File minh họa trong demo', file_path: 'demo://hoa-don.pdf', original_name: 'Hoa-don-demo.pdf' });
    const types = { QUOTE_FULL: 'Báo giá cung cấp vật tư, gia công và sơn', QUOTE_PROCESSING: 'Báo giá gia công và sơn', QUOTE_PAINT: 'Báo giá sơn tĩnh điện', SALE: 'Phiếu xuất bán', PURCHASE_ORDER: 'Đơn đặt hàng', PURCHASE_REQUEST: 'Phiếu đề nghị mua vật tư, thiết bị', ADVANCE_REQUEST: 'Giấy đề nghị tạm ứng', ADVANCE_SETTLEMENT: 'Giấy thanh toán / hoàn ứng' };
    db.print_template_types = types;
    Object.keys(types).forEach((type, index) => db.print_templates.push({ id: index + 1, name: types[type], document_type: type, content: '<div class="brand-images">{{banner}}{{watermark}}</div><h1>{{title}}</h1><div class="meta">Số: {{number}} · Ngày: {{date}}</div>{{items_table}}<div class="totals"><div class="grand">TỔNG CỘNG: {{total}} đồng</div></div><div class="notes">{{notes}}</div>', layout_json: '', is_default: 1 }));
    db.stock_documents.push({ id: 1, number: 'NH2026-0001', document_date: date(), type: 'DIRECT_RECEIPT', warehouse_from_id: null, warehouse_to_id: 1,
      customer_id: null, supplier_id: 1, notes: 'DEMO: Tồn đầu', status: 'POSTED', items: [{ id: 1, product_id: 1, quantity: 200, unit_price: 45000, vat_percent: 10 }, { id: 2, product_id: 2, quantity: 50, unit_price: 85000, vat_percent: 10 }] });
    db.stock_documents[0].total = total(db.stock_documents[0].items);
    db.movements.push({ id: 1, movement_date: date(), warehouse_id: 1, product_id: 1, quantity: 200, unit_cost: 45000, source_type: 'DIRECT_RECEIPT', source_id: 1, note: 'NH2026-0001' },
      { id: 2, movement_date: date(), warehouse_id: 1, product_id: 2, quantity: 50, unit_cost: 85000, source_type: 'DIRECT_RECEIPT', source_id: 1, note: 'NH2026-0001' });
    db.cash_transactions.push({ id: 1, number: 'PT2026-0001', transaction_date: date(), type: 'OTHER_RECEIPT', account_id: 1, target_account_id: null, customer_id: null,
      supplier_id: null, employee_id: null, category_id: 1, amount: 2000000, reference: 'DEMO-THU01', notes: 'Khoản thu mẫu' });
    db.customer_care_logs.push({ id: 1, customer_id: 1, employee_id: 1, care_date: date(), care_type: 'CALL', content: 'Đã gọi xác nhận nhu cầu sơn tĩnh điện', next_action_date: date() });
    db.sales_tasks.push({ id: 1, title: 'Gọi lại chốt quy cách', customer_id: 1, employee_id: 1, task_type: 'CALL', due_date: date(), status: 'TODO', notes: 'Khách đang chờ báo giá' });
    db.opportunities.push({ id: 1, code: 'CH2026-0001', customer_id: 1, employee_id: 1, quote_id: 1, stage: 'QUOTED', service: 'Gia công và sơn tĩnh điện', expected_value: 25000000, expected_close_date: date(), notes: '' });
    db.quote_requests.push({ id: 1, number: 'RFQ2026-0001', request_date: date(), customer_id: 1, employee_id: 1, contact_name: 'Trần Thanh An', drawing_reference: 'BV-DEMO-01', specification: 'Theo bản vẽ khách gửi', material: 'Inox 304', quantity: 20, status: 'QUOTED', notes: '' });
    db.sales_kpis.push({ id: 1, employee_id: 1, period: date().slice(0, 7), target_customers: 10, target_calls: 30, target_meetings: 8, target_revenue: 200000000, bonus_percent: 2, notes: 'KPI demo' });
    return db;
  }

  let db = makeDb();
  const masterTypes = ['customers', 'suppliers', 'products', 'warehouses', 'employees', 'cash_accounts', 'income_expense_categories'];
  const find = (type, id) => db[type].find(row => row.id === Number(id));
  const numberFor = (key, prefix) => `${prefix}2026-${String(++db.counters[key]).padStart(4, '0')}`;
  const balance = (productId, warehouseId) => db.movements.filter(row => row.product_id === Number(productId) && row.warehouse_id === Number(warehouseId)).reduce((sum, row) => sum + row.quantity, 0);
  const active = type => db[type].filter(row => row.active !== 0);

  function bootstrap() {
    return { settings: copy(db.settings), customers: copy(active('customers')), suppliers: copy(active('suppliers')), products: copy(active('products')),
      warehouses: copy(active('warehouses')), employees: copy(active('employees')), cashAccounts: copy(active('cash_accounts')), categories: copy(active('income_expense_categories')),
      stats: { quotes: db.quotes.length, purchaseOrders: db.purchase_orders.length, sales: db.sales.length,
        stockValue: db.products.reduce((sum, product) => sum + db.warehouses.reduce((inside, warehouse) => inside + balance(product.id, warehouse.id) * product.purchase_price, 0), 0), cashBalance: finance().accounts.reduce((sum, row) => sum + row.balance, 0) } };
  }

  function listQuotes() {
    return db.quotes.map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name, employee_name: find('employees', row.assigned_employee_id)?.name, total: total(row.items) + n(row.shipping_cost) * (1 + n(row.shipping_vat_percent) / 100) })).sort((a, b) => b.id - a.id);
  }
  function getQuote(id) {
    const row = db.quotes.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy báo giá.');
    const customer = find('customers', row.customer_id); return { ...copy(row), customer_name: customer.name, customer_phone: customer.phone, customer_address: customer.address,
      customer_tax_code: customer.tax_code, warehouse_name: find('warehouses', row.warehouse_id).name, employee_name: find('employees', row.assigned_employee_id)?.name, total: total(row.items) + n(row.shipping_cost) * (1 + n(row.shipping_vat_percent) / 100) };
  }
  function saveQuote(payload, id) {
    if (!payload.customerId || !payload.warehouseId || !payload.items?.length) throw new Error('Báo giá chưa đủ thông tin.');
    let row = id ? db.quotes.find(item => item.id === Number(id)) : null;
    if (row?.status === 'CONVERTED') throw new Error('Báo giá đã xuất bán nên không thể sửa.');
    if (!row) { const newId = nextId(db.quotes); row = { id: newId, number: numberFor('quote', 'BG'), status: 'DRAFT', invoice_status: 'PENDING', invoice_number: '', invoice_date: '', invoice_notes: '' }; db.quotes.push(row); }
    Object.assign(row, { quote_date: payload.date, customer_id: Number(payload.customerId), warehouse_id: Number(payload.warehouseId), assigned_employee_id: Number(payload.assignedEmployeeId) || null, quote_type: payload.quoteType || 'FULL_SERVICE', shipping_cost: n(payload.shippingCost), shipping_vat_percent: n(payload.shippingVatPercent), shipping_info: payload.shippingInfo || '', notes: payload.notes || '' });
    row.items = payload.items.map((item, index) => quoteItem(row.id, item, index + 1)); return { id: row.id, number: row.number };
  }

  function listPurchaseOrders() {
    return db.purchase_orders.map(row => ({ ...copy(row), supplier_name: find('suppliers', row.supplier_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name, total: total(row.items) + n(row.shipping_cost) })).sort((a, b) => b.id - a.id);
  }
  function getPurchaseOrder(id) {
    const row = db.purchase_orders.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy đơn đặt hàng.'); const supplier = find('suppliers', row.supplier_id);
    return { ...copy(row), supplier_name: supplier.name, supplier_phone: supplier.phone, supplier_address: supplier.address, supplier_tax_code: supplier.tax_code,
      warehouse_name: find('warehouses', row.warehouse_id).name, total: total(row.items) + n(row.shipping_cost), items: row.items.map(item => ({ ...copy(item), product_code: find('products', item.product_id).code, product_name: find('products', item.product_id).name, unit: find('products', item.product_id).unit })) };
  }
  function savePo(payload, id) {
    if (!payload.supplierId || !payload.warehouseId || !payload.items?.length) throw new Error('Đơn đặt hàng chưa đủ thông tin.'); let row = id ? db.purchase_orders.find(item => item.id === Number(id)) : null;
    if (row?.status !== 'DRAFT') throw new Error('Đơn đã nhận hàng nên không thể sửa.'); if (!row) { row = { id: nextId(db.purchase_orders), number: numberFor('po', 'PO'), status: 'DRAFT' }; db.purchase_orders.push(row); }
    Object.assign(row, { order_date: payload.date, supplier_id: Number(payload.supplierId), warehouse_id: Number(payload.warehouseId), project: payload.project || '', delivery_date: payload.deliveryDate || '', delivery_location: payload.deliveryLocation || '', payment_terms: payload.paymentTerms || '', quality_requirements: payload.qualityRequirements || '', warranty: payload.warranty || '', documents_required: payload.documentsRequired || '', shipping_cost: n(payload.shippingCost), notes: payload.notes || '' });
    row.items = payload.items.map((item, index) => ({ id: index + 1, product_id: Number(item.productId), quantity: n(item.quantity), unit_price: n(item.unitPrice), vat_percent: n(item.vatPercent), received_quantity: 0 }));
    return { id: row.id, number: row.number };
  }

  function stockDocuments() {
    return db.stock_documents.map(row => ({ ...copy(row), warehouse_from_name: find('warehouses', row.warehouse_from_id)?.name || '', warehouse_to_name: find('warehouses', row.warehouse_to_id)?.name || '',
      customer_name: find('customers', row.customer_id)?.name || '', supplier_name: find('suppliers', row.supplier_id)?.name || '' })).sort((a, b) => b.id - a.id);
  }
  function getStockDocument(id) {
    const row = stockDocuments().find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy chứng từ kho.');
    row.items = row.items.map(item => ({ ...item, product_code: find('products', item.product_id).code, product_name: find('products', item.product_id).name, unit: find('products', item.product_id).unit })); return row;
  }

  function finance() {
    const signed = (transaction, accountId) => transaction.type === 'FUND_TRANSFER' ? (transaction.account_id === accountId ? -transaction.amount : transaction.target_account_id === accountId ? transaction.amount : 0)
      : transaction.account_id !== accountId ? 0 : ['CUSTOMER_RECEIPT', 'OTHER_RECEIPT', 'ADVANCE_REFUND'].includes(transaction.type) ? transaction.amount
        : ['SUPPLIER_PAYMENT', 'OTHER_PAYMENT', 'ADVANCE'].includes(transaction.type) ? -transaction.amount : 0;
    const accounts = active('cash_accounts').map(account => ({ ...copy(account), balance: account.opening_balance + db.cash_transactions.reduce((sum, row) => sum + signed(row, account.id), 0) }));
    const transactions = db.cash_transactions.map(row => ({ ...copy(row), account_name: find('cash_accounts', row.account_id)?.name, target_account_name: find('cash_accounts', row.target_account_id)?.name,
      customer_name: find('customers', row.customer_id)?.name, supplier_name: find('suppliers', row.supplier_id)?.name, employee_name: find('employees', row.employee_id)?.name,
      category_name: find('income_expense_categories', row.category_id)?.name })).sort((a, b) => b.id - a.id);
    const advances = active('employees').map(employee => ({ ...copy(employee), balance: db.cash_transactions.filter(row => row.employee_id === employee.id).reduce((sum, row) => sum + (row.type === 'ADVANCE' ? row.amount : ['ADVANCE_SETTLEMENT', 'ADVANCE_REFUND'].includes(row.type) ? -row.amount : 0), 0) }));
    return { accounts, transactions, advances };
  }

  function reports() {
    const direct = type => db.stock_documents.filter(row => row.type === type).reduce((sum, row) => sum + row.total, 0);
    const revenue = db.sales.reduce((sum, row) => sum + row.total, 0) + direct('DIRECT_SALE') - direct('CUSTOMER_RETURN');
    const cogs = db.movements.reduce((sum, row) => sum + (['SALE', 'DIRECT_SALE'].includes(row.source_type) && row.quantity < 0 ? -row.quantity * row.unit_cost : row.source_type === 'CUSTOMER_RETURN' && row.quantity > 0 ? -row.quantity * row.unit_cost : 0), 0);
    const otherIncome = db.cash_transactions.filter(row => row.type === 'OTHER_RECEIPT' && find('income_expense_categories', row.category_id)?.affects_profit).reduce((sum, row) => sum + row.amount, 0);
    const expenses = db.cash_transactions.filter(row => ['OTHER_PAYMENT', 'ADVANCE_SETTLEMENT'].includes(row.type) && (!row.category_id || find('income_expense_categories', row.category_id)?.affects_profit)).reduce((sum, row) => sum + row.amount, 0);
    return { revenue: Math.round(revenue), cogs: Math.round(cogs), otherIncome, expenses, profit: Math.round(revenue - cogs + otherIncome - expenses) };
  }

  function masterUsed(type, id) {
    id = Number(id); const checks = {
      customers: db.quotes.some(row => row.customer_id === id) || db.sales.some(row => row.customer_id === id) || db.stock_documents.some(row => row.customer_id === id) || db.cash_transactions.some(row => row.customer_id === id),
      suppliers: db.purchase_orders.some(row => row.supplier_id === id) || db.stock_documents.some(row => row.supplier_id === id) || db.cash_transactions.some(row => row.supplier_id === id),
      products: [...db.quotes.flatMap(row => row.items), ...db.purchase_orders.flatMap(row => row.items), ...db.stock_documents.flatMap(row => row.items)].some(row => row.product_id === id),
      warehouses: db.quotes.some(row => row.warehouse_id === id) || db.purchase_orders.some(row => row.warehouse_id === id) || db.movements.some(row => row.warehouse_id === id),
      employees: db.cash_transactions.some(row => row.employee_id === id) || db.purchase_requests.some(row => row.employee_id === id), cash_accounts: db.cash_transactions.some(row => row.account_id === id || row.target_account_id === id),
      income_expense_categories: db.cash_transactions.some(row => row.category_id === id)
    }; return checks[type];
  }

  function listPurchaseRequests() {
    return db.purchase_requests.map(row => ({ ...copy(row), employee_name: find('employees', row.employee_id)?.name || '', total: row.items.reduce((sum, item) => sum + item.quantity * item.estimated_unit_price, 0) })).sort((a, b) => b.id - a.id);
  }
  function getPurchaseRequest(id) {
    const row = listPurchaseRequests().find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy phiếu đề nghị mua.'); return row;
  }
  function savePurchaseRequest(id, payload) {
    let row = id ? db.purchase_requests.find(item => item.id === Number(id)) : null;
    if (!payload.items?.length) throw new Error('Phiếu cần ít nhất một dòng vật tư.');
    if (!row) { row = { id: nextId(db.purchase_requests), number: numberFor('request', 'DN'), status: 'DRAFT' }; db.purchase_requests.push(row); }
    Object.assign(row, { request_date: payload.date, employee_id: Number(payload.employeeId) || null, requester_name: payload.requesterName || '', department: payload.department || '', project: payload.project || '', purpose: payload.purpose || '', needed_date: payload.neededDate || '', proposed_supplier: payload.proposedSupplier || '', technical_requirements: payload.technicalRequirements || '', reason: payload.reason || '', notes: payload.notes || '' });
    row.items = payload.items.map((item, index) => ({ id: index + 1, item_name: item.itemName, specification: item.specification || '', unit: item.unit || '', quantity: n(item.quantity), estimated_unit_price: n(item.estimatedUnitPrice), notes: item.notes || '' }));
    return { id: row.id, number: row.number };
  }

  function getCashDocument(id) {
    const row = finance().transactions.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy giao dịch.');
    row.advance_balance_before = db.cash_transactions.filter(item => item.employee_id === row.employee_id && item.id < row.id).reduce((sum, item) => sum + (item.type === 'ADVANCE' ? item.amount : ['ADVANCE_SETTLEMENT', 'ADVANCE_REFUND'].includes(item.type) ? -item.amount : 0), 0);
    row.settlement_difference = row.type === 'ADVANCE' ? row.advance_balance_before + row.amount : row.advance_balance_before - row.amount;
    return row;
  }

  function setQuoteInvoice(id, payload) {
    const row = db.quotes.find(item => item.id === Number(id));
    if (!row) throw new Error('Không tìm thấy báo giá.');
    if (!['PENDING', 'ISSUED', 'RETAIL_NO_INVOICE'].includes(payload.status)) throw new Error('Trạng thái hóa đơn không hợp lệ.');
    row.invoice_status = payload.status;
    row.invoice_notes = payload.notes || '';
    if (payload.status === 'ISSUED') {
      row.invoice_date = payload.invoiceDate || date();
      if (!row.invoice_number) {
        const year = row.invoice_date.slice(0, 4);
        const prefix = String(db.settings.invoice_prefix || 'HD').toUpperCase();
        const used = db.quotes.map(item => item.invoice_number).filter(value => value?.startsWith(`${prefix}${year}-`)).map(value => Number(value.split('-').at(-1)));
        row.invoice_number = `${prefix}${year}-${String(used.length ? Math.max(...used) + 1 : Number(db.settings.invoice_start) || 1).padStart(4, '0')}`;
      }
    }
    return copy({ invoice_status: row.invoice_status, invoice_number: row.invoice_number, invoice_date: row.invoice_date, invoice_notes: row.invoice_notes });
  }

  const htmlEscape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const formatMoney = value => new Intl.NumberFormat('vi-VN').format(Math.round(n(value)));
  const sanitizeTemplate = content => String(content || '')
    .replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|svg)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|link|meta|form|input|button|svg)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s(on\w+|src|href|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  function printDocument(type, id) {
    const doc = type === 'quote' ? getQuote(id) : type === 'sale' ? db.sales.find(row => row.id === Number(id)) : type === 'po' ? getPurchaseOrder(id) : type === 'purchase_request' ? getPurchaseRequest(id) : getCashDocument(id);
    const popup = window.open('', '_blank'); if (!popup) return true;
    const quote = doc.quote_id ? getQuote(doc.quote_id) : null;
    if (quote) Object.assign(doc, { ...quote, number: doc.number, sale_date: doc.sale_date });
    const sourceItems = doc.items || [{ description: doc.notes || doc.reference, quantity: 1, line_total: doc.amount }];
    const rows = sourceItems.map((item, index) => `<tr><td>${index + 1}</td><td class="left">${htmlEscape(item.description || item.product_name || item.item_name)}</td><td>${htmlEscape(item.unit || '')}</td><td>${n(item.quantity) || 1}</td><td>${formatMoney(item.line_total || item.quantity * (item.unit_price || item.estimated_unit_price) || doc.amount)}</td></tr>`).join('');
    const itemsTable = `<table><thead><tr><th>STT</th><th>Nội dung</th><th>ĐVT</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table>`;
    const documentType = type === 'quote' ? (doc.quote_type === 'PAINT_ONLY' ? 'QUOTE_PAINT' : doc.quote_type === 'CUSTOMER_MATERIAL' ? 'QUOTE_PROCESSING' : 'QUOTE_FULL') : type === 'sale' ? 'SALE' : type === 'po' ? 'PURCHASE_ORDER' : type === 'purchase_request' ? 'PURCHASE_REQUEST' : doc.type === 'ADVANCE' ? 'ADVANCE_REQUEST' : 'ADVANCE_SETTLEMENT';
    const template = db.print_templates.find(row => row.document_type === documentType && row.is_default) || db.print_templates.find(row => row.document_type === documentType);
    const titles = { QUOTE_FULL: 'BÁO GIÁ', QUOTE_PROCESSING: 'BÁO GIÁ GIA CÔNG', QUOTE_PAINT: 'BÁO GIÁ SƠN TĨNH ĐIỆN', SALE: 'PHIẾU XUẤT BÁN', PURCHASE_ORDER: 'ĐƠN ĐẶT HÀNG', PURCHASE_REQUEST: 'PHIẾU ĐỀ NGHỊ MUA VẬT TƯ, THIẾT BỊ', ADVANCE_REQUEST: 'GIẤY ĐỀ NGHỊ TẠM ỨNG', ADVANCE_SETTLEMENT: 'GIẤY THANH TOÁN TIỀN TẠM ỨNG' };
    const sum = sourceItems.reduce((value, item) => value + n(item.line_total || item.quantity * (item.unit_price || item.estimated_unit_price)), 0) || n(doc.amount);
    const raw = { banner: `<img class="banner" src="${htmlEscape(db.settings.banner_data || 'logo.jpg')}" alt="Banner">`, watermark: '', company_name: db.settings.company_name, company_address: db.settings.company_address, company_phone: db.settings.company_phone, company_tax_code: db.settings.tax_code,
      title: titles[documentType], number: doc.number, date: doc.quote_date || doc.sale_date || doc.order_date || doc.request_date || doc.transaction_date, partner_label: type === 'po' ? 'Nhà cung cấp' : 'Khách hàng', partner_name: doc.customer_name || doc.supplier_name || doc.employee_name || doc.requester_name,
      partner_address: doc.customer_address || doc.supplier_address, partner_phone: doc.customer_phone || doc.supplier_phone, partner_tax_code: doc.customer_tax_code || doc.supplier_tax_code, warehouse: doc.warehouse_name, items_table: itemsTable,
      subtotal: formatMoney(sum), vat_total: formatMoney(0), total: formatMoney(doc.total || doc.amount || sum), total_words: '', notes: doc.notes, employee_name: doc.employee_name || doc.requester_name, department: doc.department, purpose: doc.purpose || doc.notes, reference: doc.reference,
      needed_date: doc.needed_date, project: doc.project, proposed_supplier: doc.proposed_supplier, technical_requirements: doc.technical_requirements, reason: doc.reason, delivery_date: doc.delivery_date, delivery_location: doc.delivery_location, payment_terms: doc.payment_terms,
      quality_requirements: doc.quality_requirements, warranty: doc.warranty, documents_required: doc.documents_required, shipping_cost: formatMoney(doc.shipping_cost), shipping_vat_amount: formatMoney(n(doc.shipping_cost) * n(doc.shipping_vat_percent) / 100), shipping_info: doc.shipping_info, use_from_date: doc.use_from_date, use_to_date: doc.use_to_date, due_date: doc.due_date, payment_method: doc.payment_method,
      bank_name: doc.bank_name, bank_account: doc.bank_account, document_count: doc.document_count, advance_balance_before: formatMoney(doc.advance_balance_before), settlement_difference: formatMoney(doc.settlement_difference) };
    const variables = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, ['banner', 'watermark', 'items_table'].includes(key) ? String(value || '') : htmlEscape(value)]));
    const body = sanitizeTemplate(template?.content || '<h1>{{title}}</h1>{{items_table}}').replace(/\{\{([a-z_]+)\}\}/g, (_match, key) => variables[key] ?? '');
    popup.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${htmlEscape(doc.number)}</title><style>@page{size:A5 portrait;margin:7mm}body{font:10px Arial;color:#17202a}.banner{display:block;width:100%;height:auto;object-fit:contain}h1{text-align:center;font-weight:700;color:#9c1d23}table{width:100%;border-collapse:collapse;font-size:8px}th,td{padding:3px;border:1px solid #555;text-align:center}.left{text-align:left}.totals{margin:8px 0 0 auto;width:62%}.grand{font-weight:700}.signatures{display:flex;justify-content:space-between;text-align:center;margin-top:24px}.signatures div{flex:1}.signatures small{display:block}</style></head><body>${body}<script>window.print()<\/script></body></html>`); popup.document.close(); return true;
  }

  const careLogs = customerId => db.customer_care_logs.filter(row => !customerId || row.customer_id === Number(customerId)).map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, employee_name: find('employees', row.employee_id)?.name })).sort((a, b) => b.id - a.id);
  const salesTasks = () => db.sales_tasks.map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, employee_name: find('employees', row.employee_id)?.name })).sort((a, b) => a.status.localeCompare(b.status) || a.due_date.localeCompare(b.due_date));
  const opportunities = () => db.opportunities.map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, employee_name: find('employees', row.employee_id)?.name, quote_number: db.quotes.find(quote => quote.id === row.quote_id)?.number })).sort((a, b) => b.id - a.id);
  const quoteRequests = () => db.quote_requests.map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, employee_name: find('employees', row.employee_id)?.name })).sort((a, b) => b.id - a.id);
  const salesKpis = () => db.sales_kpis.map(row => ({ ...copy(row), employee_name: find('employees', row.employee_id)?.name })).sort((a, b) => b.period.localeCompare(a.period));
  const upsert = (rows, id, values) => { let row = id ? rows.find(item => item.id === Number(id)) : null; if (!row) { row = { id: nextId(rows) }; rows.push(row); } Object.assign(row, values); return row.id; };

  function salesDashboard() {
    const month = date().slice(0, 7);
    const open = db.opportunities.filter(row => !['WON', 'LOST'].includes(row.stage));
    const kpis = salesKpis().filter(row => row.period === month).map(row => ({ ...row,
      actual_customers: db.customers.filter(customer => customer.assigned_employee_id === row.employee_id).length,
      actual_calls: db.customer_care_logs.filter(log => log.employee_id === row.employee_id && log.care_type === 'CALL' && log.care_date.startsWith(month)).length,
      actual_meetings: db.customer_care_logs.filter(log => log.employee_id === row.employee_id && log.care_type === 'MEETING' && log.care_date.startsWith(month)).length,
      actual_revenue: db.sales.filter(sale => db.quotes.find(quote => quote.id === sale.quote_id)?.assigned_employee_id === row.employee_id && sale.sale_date.startsWith(month)).reduce((sum, sale) => sum + n(sale.total), 0) }));
    return { customers: active('customers').length, dueTasks: db.sales_tasks.filter(row => row.status !== 'DONE').length, openOpportunities: open.length,
      pipelineValue: open.reduce((sum, row) => sum + n(row.expected_value), 0), pendingQuotes: db.quotes.filter(row => row.status === 'SENT').length,
      kpis, tasks: salesTasks().filter(row => row.status !== 'DONE').slice(0, 10) };
  }

  window.crm = {
    bootstrap: async () => copy(bootstrap()), calculateCost: async input => calculateCost(input),
    listMaster: async type => { if (!masterTypes.includes(type)) throw new Error('Danh mục không hợp lệ.'); const rows = active(type).map(row => type === 'customers' ? { ...row, assigned_employee_name: find('employees', row.assigned_employee_id)?.name || '' } : row); return copy(rows.sort((a, b) => a.name.localeCompare(b.name))); },
    saveMaster: async (type, record) => { if (!masterTypes.includes(type) || !record.code?.trim() || !record.name?.trim()) throw new Error('Mã và tên không được để trống.'); let row = record.id ? find(type, record.id) : null;
      if (!row) { row = { id: nextId(db[type]), active: 1 }; db[type].push(row); } Object.assign(row, copy(record)); for (const key of ['purchase_price', 'sale_price', 'vat_rate', 'opening_balance', 'affects_profit']) if (key in row) row[key] = n(row[key]); if ('assigned_employee_id' in row) row.assigned_employee_id = n(row.assigned_employee_id) || null; return row.id; },
    deleteMaster: async (type, id) => { if (masterUsed(type, id)) throw new Error('Dữ liệu đã được dùng trong chứng từ nên không thể xóa.'); db[type] = db[type].filter(row => row.id !== Number(id)); },
    listQuotes: async () => copy(listQuotes()), getQuote: async id => copy(getQuote(id)), createQuote: async payload => saveQuote(payload), updateQuote: async (id, payload) => saveQuote(payload, id),
    setQuoteStatus: async (id, status) => { const row = db.quotes.find(item => item.id === Number(id)); if (!row || row.status === 'CONVERTED') throw new Error('Không thể đổi trạng thái.'); row.status = status; },
    setQuoteInvoice: async (id, payload) => setQuoteInvoice(id, payload),
    convertQuote: async id => { const quote = getQuote(id); if (quote.status === 'CONVERTED') throw new Error('Báo giá đã được chuyển.'); const needs = new Map(); quote.items.forEach(item => { if (item.product_id) needs.set(item.product_id, (needs.get(item.product_id) || 0) + n(item.stock_quantity)); if (item.paint_product_id) needs.set(item.paint_product_id, (needs.get(item.paint_product_id) || 0) + n(item.paint_weight)); }); for (const [productId, quantity] of needs) if (balance(productId, quote.warehouse_id) < quantity) throw new Error(`Không đủ tồn kho cho ${find('products', productId)?.name}.`);
      const sale = { id: nextId(db.sales), number: numberFor('sale', 'BH'), sale_date: date(), quote_id: quote.id, customer_id: quote.customer_id, warehouse_id: quote.warehouse_id, total: quote.total, status: 'POSTED' }; db.sales.push(sale);
      quote.items.forEach(item => { if (item.product_id && item.stock_quantity > 0) db.movements.push({ id: nextId(db.movements), movement_date: date(), warehouse_id: quote.warehouse_id, product_id: item.product_id, quantity: -item.stock_quantity, unit_cost: item.cost_before_profit / Math.max(1, item.stock_quantity), source_type: 'SALE', source_id: sale.id, note: sale.number }); });
      quote.items.forEach(item => { if (item.paint_product_id && item.paint_weight > 0) db.movements.push({ id: nextId(db.movements), movement_date: date(), warehouse_id: quote.warehouse_id, product_id: item.paint_product_id, quantity: -item.paint_weight, unit_cost: find('products', item.paint_product_id)?.purchase_price || 0, source_type: 'SALE', source_id: sale.id, note: sale.number }); });
      db.quotes.find(row => row.id === quote.id).status = 'CONVERTED'; return { id: sale.id, number: sale.number }; },
    deleteQuote: async id => { const row = db.quotes.find(item => item.id === Number(id)); if (row?.status === 'CONVERTED') throw new Error('Hãy xóa phiếu xuất trước.'); db.quotes = db.quotes.filter(item => item.id !== Number(id)); },
    listSales: async () => copy(db.sales.map(row => ({ ...row, customer_name: find('customers', row.customer_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name })).sort((a, b) => b.id - a.id)),
    deleteSale: async id => { const sale = db.sales.find(row => row.id === Number(id)); if (!sale) throw new Error('Không tìm thấy phiếu xuất.'); db.movements = db.movements.filter(row => !(row.source_type === 'SALE' && row.source_id === sale.id)); const quote = db.quotes.find(row => row.id === sale.quote_id); if (quote) quote.status = 'WON'; db.sales = db.sales.filter(row => row.id !== sale.id); },
    listPurchaseOrders: async () => copy(listPurchaseOrders()), getPurchaseOrder: async id => copy(getPurchaseOrder(id)), createPurchaseOrder: async payload => savePo(payload), updatePurchaseOrder: async (id, payload) => savePo(payload, id),
    receivePurchaseOrder: async id => { const po = db.purchase_orders.find(row => row.id === Number(id)); if (!po || po.status === 'RECEIVED') throw new Error('Đơn đã được nhận.'); po.status = 'RECEIVED'; po.items.forEach(item => { item.received_quantity = item.quantity; db.movements.push({ id: nextId(db.movements), movement_date: date(), warehouse_id: po.warehouse_id, product_id: item.product_id, quantity: item.quantity, unit_cost: item.unit_price, source_type: 'RECEIPT', source_id: po.id, note: po.number }); }); return { id: po.id, number: numberFor('receipt', 'NH') }; },
    deletePurchaseOrder: async id => { db.movements = db.movements.filter(row => !(row.source_type === 'RECEIPT' && row.source_id === Number(id))); db.purchase_orders = db.purchase_orders.filter(row => row.id !== Number(id)); },
    listPurchaseRequests: async () => copy(listPurchaseRequests()), getPurchaseRequest: async id => copy(getPurchaseRequest(id)), savePurchaseRequest: async (id, payload) => savePurchaseRequest(id, payload),
    deletePurchaseRequest: async id => { db.purchase_requests = db.purchase_requests.filter(row => row.id !== Number(id)); },
    getInventory: async () => ({
      inventory: copy(db.products.flatMap(product => db.warehouses.map(warehouse => ({
        id: product.id, code: product.code, name: product.name, unit: product.unit, warehouse_id: warehouse.id, warehouse_name: warehouse.name,
        balance: balance(product.id, warehouse.id), purchase_price: product.purchase_price, stock_value: balance(product.id, warehouse.id) * product.purchase_price
      })))),
      movements: copy(db.movements.map(row => ({ ...row, code: find('products', row.product_id).code, product_name: find('products', row.product_id).name,
        unit: find('products', row.product_id).unit, warehouse_name: find('warehouses', row.warehouse_id).name })).sort((a, b) => b.id - a.id))
    }),
    listStockDocuments: async () => copy(stockDocuments()), getStockDocument: async id => copy(getStockDocument(id)),
    createStockDocument: async payload => { if (!payload.items?.length) throw new Error('Chứng từ cần ít nhất một dòng.'); const prefixes = { DIRECT_RECEIPT: 'NH', DIRECT_SALE: 'BH', TRANSFER: 'CK', SUPPLIER_RETURN: 'TNCC', CUSTOMER_RETURN: 'KHT' };
      const row = { id: nextId(db.stock_documents), number: numberFor('stock', prefixes[payload.type]), document_date: payload.date, type: payload.type, warehouse_from_id: payload.warehouseFromId, warehouse_to_id: payload.warehouseToId,
        customer_id: payload.customerId, supplier_id: payload.supplierId, notes: payload.notes || '', status: 'POSTED', items: payload.items.map((item, index) => ({ id: index + 1, product_id: Number(item.productId), quantity: n(item.quantity), unit_price: n(item.unitPrice), vat_percent: n(item.vatPercent) })) };
      row.total = total(row.items); const outgoing = ['DIRECT_SALE', 'SUPPLIER_RETURN', 'TRANSFER'].includes(row.type); for (const item of row.items) { if (outgoing && balance(item.product_id, row.warehouse_from_id) < item.quantity) throw new Error('Không đủ tồn kho.');
        if (['DIRECT_RECEIPT', 'CUSTOMER_RETURN'].includes(row.type)) db.movements.push({ id: nextId(db.movements), movement_date: row.document_date, warehouse_id: row.warehouse_to_id, product_id: item.product_id, quantity: item.quantity, unit_cost: item.unit_price || find('products', item.product_id).purchase_price, source_type: row.type, source_id: row.id, note: row.number });
        if (['DIRECT_SALE', 'SUPPLIER_RETURN', 'TRANSFER'].includes(row.type)) db.movements.push({ id: nextId(db.movements), movement_date: row.document_date, warehouse_id: row.warehouse_from_id, product_id: item.product_id, quantity: -item.quantity, unit_cost: find('products', item.product_id).purchase_price, source_type: row.type, source_id: row.id, note: row.number });
        if (row.type === 'TRANSFER') db.movements.push({ id: nextId(db.movements), movement_date: row.document_date, warehouse_id: row.warehouse_to_id, product_id: item.product_id, quantity: item.quantity, unit_cost: find('products', item.product_id).purchase_price, source_type: row.type, source_id: row.id, note: row.number }); }
      db.stock_documents.push(row); return { id: row.id, number: row.number }; },
    deleteStockDocument: async id => { const row = db.stock_documents.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy chứng từ.'); db.movements = db.movements.filter(item => !(item.source_type === row.type && item.source_id === row.id)); db.stock_documents = db.stock_documents.filter(item => item.id !== row.id); },
    getFinance: async () => copy(finance()), createCashTransaction: async payload => { if (!payload.accountId || n(payload.amount) <= 0) throw new Error('Cần chọn quỹ và số tiền.'); const incoming = ['CUSTOMER_RECEIPT', 'OTHER_RECEIPT', 'ADVANCE_REFUND'].includes(payload.type);
      const row = { id: nextId(db.cash_transactions), number: numberFor('cash', incoming ? 'PT' : payload.type === 'FUND_TRANSFER' ? 'CQ' : 'PC'), transaction_date: payload.date, type: payload.type, account_id: Number(payload.accountId), target_account_id: Number(payload.targetAccountId) || null,
        customer_id: Number(payload.customerId) || null, supplier_id: Number(payload.supplierId) || null, employee_id: Number(payload.employeeId) || null, category_id: Number(payload.categoryId) || null, amount: n(payload.amount), reference: payload.reference || '', notes: payload.notes || '', department: payload.department || '', use_from_date: payload.useFromDate || '', use_to_date: payload.useToDate || '', due_date: payload.dueDate || '', payment_method: payload.paymentMethod || '', bank_name: payload.bankName || '', bank_account: payload.bankAccount || '', document_count: n(payload.documentCount) }; db.cash_transactions.push(row); return { id: row.id, number: row.number }; },
    deleteCashTransaction: async id => { db.cash_transactions = db.cash_transactions.filter(row => row.id !== Number(id)); },
    listInvoiceFiles: async () => copy(db.invoice_files.sort((a, b) => b.id - a.id)), pickInvoiceFile: async () => ({ path: 'demo://Hoa-don-demo.pdf', name: 'Hoa-don-demo.pdf' }),
    saveInvoiceFile: async payload => { const row = { id: nextId(db.invoice_files), invoice_type: payload.invoiceType, invoice_month: payload.invoiceMonth, invoice_number: payload.invoiceNumber || '', partner_name: payload.partnerName || '', notes: payload.notes || '', file_path: payload.sourcePath, original_name: payload.originalName }; db.invoice_files.push(row); return { id: row.id }; },
    openInvoiceFile: async () => true, deleteInvoiceFile: async id => { db.invoice_files = db.invoice_files.filter(row => row.id !== Number(id)); },
    listPrintTemplates: async () => ({ templates: copy(db.print_templates), types: copy(db.print_template_types), variables: ['banner','watermark','company_name','company_address','company_phone','company_tax_code','title','number','date','partner_label','partner_name','partner_address','partner_phone','partner_tax_code','warehouse','items_table','subtotal','vat_total','total','total_words','notes','employee_name','department','purpose','reference','needed_date','project','proposed_supplier','technical_requirements','reason','delivery_date','delivery_location','payment_terms','quality_requirements','warranty','documents_required','shipping_cost','shipping_vat_amount','shipping_info','use_from_date','use_to_date','due_date','payment_method','bank_name','bank_account','document_count','advance_balance_before','settlement_difference'] }),
    savePrintTemplate: async record => { let row = record.id ? db.print_templates.find(item => item.id === Number(record.id)) : null; if (!row) { row = { id: nextId(db.print_templates), is_default: 0 }; db.print_templates.push(row); } Object.assign(row, { name: record.name, document_type: record.documentType, content: record.content, layout_json: JSON.stringify(record.layout || {}) }); return row.id; },
    setDefaultPrintTemplate: async id => { const row = db.print_templates.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy mẫu in.'); db.print_templates.filter(item => item.document_type === row.document_type).forEach(item => item.is_default = item.id === row.id ? 1 : 0); },
    deletePrintTemplate: async id => { const row = db.print_templates.find(item => item.id === Number(id)); if (row?.is_default) throw new Error('Không thể xóa mẫu mặc định.'); db.print_templates = db.print_templates.filter(item => item.id !== Number(id)); },
    getDebts: async () => ({ customers: copy(active('customers').map(customer => ({ id: customer.id, code: customer.code, name: customer.name, balance: db.sales.filter(row => row.customer_id === customer.id).reduce((sum, row) => sum + row.total, 0) + db.stock_documents.filter(row => row.customer_id === customer.id && row.type === 'DIRECT_SALE').reduce((sum, row) => sum + row.total, 0) - db.stock_documents.filter(row => row.customer_id === customer.id && row.type === 'CUSTOMER_RETURN').reduce((sum, row) => sum + row.total, 0) - db.cash_transactions.filter(row => row.customer_id === customer.id && row.type === 'CUSTOMER_RECEIPT').reduce((sum, row) => sum + row.amount, 0) }))),
      suppliers: copy(active('suppliers').map(supplier => ({ id: supplier.id, code: supplier.code, name: supplier.name, balance: db.purchase_orders.filter(row => row.supplier_id === supplier.id && row.status === 'RECEIVED').reduce((sum, row) => sum + total(row.items) + n(row.shipping_cost), 0) + db.stock_documents.filter(row => row.supplier_id === supplier.id && row.type === 'DIRECT_RECEIPT').reduce((sum, row) => sum + row.total, 0) - db.stock_documents.filter(row => row.supplier_id === supplier.id && row.type === 'SUPPLIER_RETURN').reduce((sum, row) => sum + row.total, 0) - db.cash_transactions.filter(row => row.supplier_id === supplier.id && row.type === 'SUPPLIER_PAYMENT').reduce((sum, row) => sum + row.amount, 0) }))) }),
    getReports: async () => copy(reports()),
    getSalesDashboard: async () => copy(salesDashboard()),
    listCareLogs: async customerId => copy(careLogs(customerId)),
    saveCareLog: async (id, payload) => { if (!payload.customerId || !String(payload.content || '').trim()) throw new Error('Lịch sử chăm sóc cần khách hàng và nội dung.'); return upsert(db.customer_care_logs, id, { customer_id: Number(payload.customerId), employee_id: Number(payload.employeeId) || null, care_date: payload.careDate, care_type: payload.careType || 'CALL', content: String(payload.content).trim(), next_action_date: payload.nextActionDate || '' }); },
    deleteCareLog: async id => { db.customer_care_logs = db.customer_care_logs.filter(row => row.id !== Number(id)); },
    listSalesTasks: async () => copy(salesTasks()),
    saveSalesTask: async (id, payload) => { if (!String(payload.title || '').trim() || !payload.dueDate) throw new Error('Công việc cần tiêu đề và hạn thực hiện.'); return upsert(db.sales_tasks, id, { title: String(payload.title).trim(), customer_id: Number(payload.customerId) || null, employee_id: Number(payload.employeeId) || null, task_type: payload.taskType || 'CALL', due_date: payload.dueDate, status: payload.status || 'TODO', notes: payload.notes || '' }); },
    deleteSalesTask: async id => { db.sales_tasks = db.sales_tasks.filter(row => row.id !== Number(id)); },
    listOpportunities: async () => copy(opportunities()),
    saveOpportunity: async (id, payload) => { if (!payload.customerId) throw new Error('Cơ hội bán hàng cần khách hàng.'); const code = id ? db.opportunities.find(row => row.id === Number(id))?.code : `CH${new Date().getFullYear()}-${String(nextId(db.opportunities)).padStart(4, '0')}`; return upsert(db.opportunities, id, { code, customer_id: Number(payload.customerId), employee_id: Number(payload.employeeId) || null, quote_id: Number(payload.quoteId) || null, stage: payload.stage || 'APPROACH', service: payload.service || '', expected_value: n(payload.expectedValue), expected_close_date: payload.expectedCloseDate || '', notes: payload.notes || '' }); },
    deleteOpportunity: async id => { db.opportunities = db.opportunities.filter(row => row.id !== Number(id)); },
    listQuoteRequests: async () => copy(quoteRequests()),
    saveQuoteRequest: async (id, payload) => { if (!payload.customerId || !payload.requestDate) throw new Error('Yêu cầu báo giá cần khách hàng và ngày tiếp nhận.'); const number = id ? db.quote_requests.find(row => row.id === Number(id))?.number : `RFQ${new Date().getFullYear()}-${String(nextId(db.quote_requests)).padStart(4, '0')}`; return upsert(db.quote_requests, id, { number, request_date: payload.requestDate, customer_id: Number(payload.customerId), employee_id: Number(payload.employeeId) || null, contact_name: payload.contactName || '', drawing_reference: payload.drawingReference || '', specification: payload.specification || '', material: payload.material || '', quantity: n(payload.quantity), status: payload.status || 'NEW', notes: payload.notes || '' }); },
    deleteQuoteRequest: async id => { db.quote_requests = db.quote_requests.filter(row => row.id !== Number(id)); },
    listSalesKpis: async () => copy(salesKpis()),
    saveSalesKpi: async (id, payload) => { if (!payload.employeeId || !/^\d{4}-\d{2}$/.test(String(payload.period || ''))) throw new Error('KPI cần nhân viên và tháng hợp lệ.'); return upsert(db.sales_kpis, id, { employee_id: Number(payload.employeeId), period: payload.period, target_customers: n(payload.targetCustomers), target_calls: n(payload.targetCalls), target_meetings: n(payload.targetMeetings), target_revenue: n(payload.targetRevenue), bonus_percent: n(payload.bonusPercent), notes: payload.notes || '' }); },
    deleteSalesKpi: async id => { db.sales_kpis = db.sales_kpis.filter(row => row.id !== Number(id)); },
    saveSettings: async values => { Object.assign(db.settings, values); },
    getBanner: async () => ({ dataUrl: db.settings.banner_data || 'logo.jpg', name: 'Banner dùng chung', custom: db.settings.banner_data !== 'logo.jpg' }),
    pickBanner: async () => new Promise(resolve => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.onchange = () => { const file = input.files?.[0]; if (!file) return resolve(null); const reader = new FileReader(); reader.onload = () => { db.settings.banner_data = reader.result; resolve({ dataUrl: reader.result, name: file.name, custom: true }); }; reader.readAsDataURL(file); }; input.click(); }),
    seedDemoData: async () => { db = makeDb(); return { created: 9 }; },
    backup: async () => { const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'CRM-demo-backup.json'; link.click(); URL.revokeObjectURL(link.href); return 'CRM-demo-backup.json'; },
    previewDocument: async (type, id) => printDocument(type, id), exportPdf: async (type, id) => { printDocument(type, id); return null; }
  };
})();
