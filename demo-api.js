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
    const consumablesCost = n(input.consumablesPerItem) * quantity;
    const electricityCost = n(input.electricityKwh) * n(input.electricityRate);
    const depreciationCost = n(input.depreciationPerHour) * n(input.laborHours);
    const coatingArea = areaEach * Math.max(1, n(input.coatingSides)) * quantity;
    const coatingCost = coatingArea * n(input.coatingPricePerM2);
    const wasteCost = (materialCost + coatingCost) * n(input.wastePercent) / 100;
    const costBeforeProfit = materialCost + laborCost + consumablesCost + electricityCost + depreciationCost + coatingCost + wasteCost;
    const profit = costBeforeProfit * n(input.profitPercent) / 100;
    const priceBeforeVat = costBeforeProfit + profit;
    const vat = priceBeforeVat * n(input.vatPercent) / 100;
    const round = value => Math.round(value + Number.EPSILON);
    return { areaEach, weightEach, totalWeight, materialCost: round(materialCost), laborCost: round(laborCost), consumablesCost: round(consumablesCost),
      electricityCost: round(electricityCost), depreciationCost: round(depreciationCost), coatingCost: round(coatingCost), wasteCost: round(wasteCost),
      costBeforeProfit: round(costBeforeProfit), profit: round(profit), priceBeforeVat: round(priceBeforeVat), vat: round(vat), total: round(priceBeforeVat + vat) };
  }

  function quoteItem(quoteId, input, id) {
    const calc = calculateCost(input);
    return { id, quote_id: quoteId, product_id: Number(input.productId) || null, description: input.description, unit: input.unit || 'cái', quantity: n(input.quantity),
      stock_quantity: n(input.stockQuantity), length_mm: n(input.lengthMm), width_mm: n(input.widthMm), thickness_mm: n(input.thicknessMm), density: n(input.density) || 7.85,
      material_price_per_kg: n(input.materialPricePerKg), labor_hours: n(input.laborHours), labor_rate_per_hour: n(input.laborRatePerHour), worker_count: n(input.workerCount) || 1,
      consumables_per_item: n(input.consumablesPerItem), electricity_kwh: n(input.electricityKwh), electricity_rate: n(input.electricityRate), depreciation_per_hour: n(input.depreciationPerHour),
      coating_sides: n(input.coatingSides) || 1, coating_price_per_m2: n(input.coatingPricePerM2), waste_percent: n(input.wastePercent), profit_percent: n(input.profitPercent),
      vat_percent: n(input.vatPercent), cost_before_profit: calc.costBeforeProfit, price_before_vat: calc.priceBeforeVat, vat_amount: calc.vat, line_total: calc.total, formula_json: '{}' };
  }

  function makeDb() {
    const db = {
      settings: { company_name: 'CÔNG TY TNHH SẢN XUẤT TM-DV MẠNH HÙNG', company_address: 'TP.HCM', company_phone: '0901 234 567', tax_code: '0312345678' },
      customers: [{ id: 1, code: 'DEMO-KH01', name: 'Công ty Nội thất An Phát', phone: '0901 234 567', address: '125 Nguyễn Văn Linh, Quận 7, TP.HCM', tax_code: '0312345678', active: 1 }],
      suppliers: [{ id: 1, code: 'DEMO-NCC01', name: 'Công ty Thép Việt', phone: '028 3822 6688', address: 'KCN Sóng Thần, Bình Dương', tax_code: '3700123456', active: 1 }],
      products: [{ id: 1, code: 'DEMO-INOX304', name: 'Tấm inox 304 dày 1mm', unit: 'kg', purchase_price: 45000, sale_price: 65000, vat_rate: 10, active: 1 },
        { id: 2, code: 'DEMO-SON01', name: 'Sơn tĩnh điện', unit: 'kg', purchase_price: 85000, sale_price: 110000, vat_rate: 10, active: 1 }],
      warehouses: [{ id: 1, code: 'KHO01', name: 'Kho chính', address: 'TP.HCM', active: 1 }, { id: 2, code: 'KHO02', name: 'Kho thành phẩm', address: 'TP.HCM', active: 1 }],
      employees: [{ id: 1, code: 'DEMO-NV01', name: 'Nguyễn Văn Minh', phone: '0912 345 678', address: 'TP.HCM', active: 1 }],
      cash_accounts: [{ id: 1, code: 'TM', name: 'Tiền mặt', opening_balance: 22500000, active: 1 }, { id: 2, code: 'VCB', name: 'Vietcombank', opening_balance: 100000000, active: 1 }],
      income_expense_categories: [{ id: 1, code: 'THUKHAC', name: 'Thu khác', transaction_type: 'RECEIPT', affects_profit: 1, active: 1 },
        { id: 2, code: 'CHIKHAC', name: 'Chi khác', transaction_type: 'PAYMENT', affects_profit: 1, active: 1 }],
      quotes: [], sales: [], purchase_orders: [], stock_documents: [], cash_transactions: [], movements: [], counters: { quote: 1, sale: 0, po: 1, receipt: 0, stock: 1, cash: 1 }
    };
    const input = { productId: 1, description: 'Bàn inox gia công 1200 x 600', unit: 'cái', quantity: 2, stockQuantity: 18, lengthMm: 1200, widthMm: 600,
      thicknessMm: 1, density: 7.85, materialPricePerKg: 45000, laborHours: 3, laborRatePerHour: 80000, workerCount: 2, consumablesPerItem: 50000,
      electricityKwh: 8, electricityRate: 3500, depreciationPerHour: 25000, coatingSides: 1, coatingPricePerM2: 90000, wastePercent: 5, profitPercent: 20, vatPercent: 10 };
    db.quotes.push({ id: 1, number: 'BG2026-0001', quote_date: date(), customer_id: 1, warehouse_id: 1, status: 'SENT', notes: 'DEMO: Báo giá mẫu đầy đủ', items: [quoteItem(1, input, 1)] });
    db.purchase_orders.push({ id: 1, number: 'PO2026-0001', order_date: date(), supplier_id: 1, warehouse_id: 1, status: 'DRAFT', notes: 'DEMO: Đơn mua mẫu',
      items: [{ id: 1, product_id: 2, quantity: 20, unit_price: 85000, vat_percent: 10, received_quantity: 0 }] });
    db.stock_documents.push({ id: 1, number: 'NH2026-0001', document_date: date(), type: 'DIRECT_RECEIPT', warehouse_from_id: null, warehouse_to_id: 1,
      customer_id: null, supplier_id: 1, notes: 'DEMO: Tồn đầu', status: 'POSTED', items: [{ id: 1, product_id: 1, quantity: 200, unit_price: 45000, vat_percent: 10 }, { id: 2, product_id: 2, quantity: 50, unit_price: 85000, vat_percent: 10 }] });
    db.stock_documents[0].total = total(db.stock_documents[0].items);
    db.movements.push({ id: 1, movement_date: date(), warehouse_id: 1, product_id: 1, quantity: 200, unit_cost: 45000, source_type: 'DIRECT_RECEIPT', source_id: 1, note: 'NH2026-0001' },
      { id: 2, movement_date: date(), warehouse_id: 1, product_id: 2, quantity: 50, unit_cost: 85000, source_type: 'DIRECT_RECEIPT', source_id: 1, note: 'NH2026-0001' });
    db.cash_transactions.push({ id: 1, number: 'PT2026-0001', transaction_date: date(), type: 'OTHER_RECEIPT', account_id: 1, target_account_id: null, customer_id: null,
      supplier_id: null, employee_id: null, category_id: 1, amount: 2000000, reference: 'DEMO-THU01', notes: 'Khoản thu mẫu' });
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
    return db.quotes.map(row => ({ ...copy(row), customer_name: find('customers', row.customer_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name, total: total(row.items) })).sort((a, b) => b.id - a.id);
  }
  function getQuote(id) {
    const row = db.quotes.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy báo giá.');
    const customer = find('customers', row.customer_id); return { ...copy(row), customer_name: customer.name, customer_phone: customer.phone, customer_address: customer.address,
      customer_tax_code: customer.tax_code, warehouse_name: find('warehouses', row.warehouse_id).name, total: total(row.items) };
  }
  function saveQuote(payload, id) {
    if (!payload.customerId || !payload.warehouseId || !payload.items?.length) throw new Error('Báo giá chưa đủ thông tin.');
    let row = id ? db.quotes.find(item => item.id === Number(id)) : null;
    if (row?.status === 'CONVERTED') throw new Error('Báo giá đã xuất bán nên không thể sửa.');
    if (!row) { const newId = nextId(db.quotes); row = { id: newId, number: numberFor('quote', 'BG'), status: 'DRAFT' }; db.quotes.push(row); }
    Object.assign(row, { quote_date: payload.date, customer_id: Number(payload.customerId), warehouse_id: Number(payload.warehouseId), notes: payload.notes || '' });
    row.items = payload.items.map((item, index) => quoteItem(row.id, item, index + 1)); return { id: row.id, number: row.number };
  }

  function listPurchaseOrders() {
    return db.purchase_orders.map(row => ({ ...copy(row), supplier_name: find('suppliers', row.supplier_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name, total: total(row.items) })).sort((a, b) => b.id - a.id);
  }
  function getPurchaseOrder(id) {
    const row = db.purchase_orders.find(item => item.id === Number(id)); if (!row) throw new Error('Không tìm thấy đơn đặt hàng.'); const supplier = find('suppliers', row.supplier_id);
    return { ...copy(row), supplier_name: supplier.name, supplier_phone: supplier.phone, supplier_address: supplier.address, supplier_tax_code: supplier.tax_code,
      warehouse_name: find('warehouses', row.warehouse_id).name, total: total(row.items), items: row.items.map(item => ({ ...copy(item), product_code: find('products', item.product_id).code, product_name: find('products', item.product_id).name, unit: find('products', item.product_id).unit })) };
  }
  function savePo(payload, id) {
    if (!payload.supplierId || !payload.warehouseId || !payload.items?.length) throw new Error('Đơn đặt hàng chưa đủ thông tin.'); let row = id ? db.purchase_orders.find(item => item.id === Number(id)) : null;
    if (row?.status !== 'DRAFT') throw new Error('Đơn đã nhận hàng nên không thể sửa.'); if (!row) { row = { id: nextId(db.purchase_orders), number: numberFor('po', 'PO'), status: 'DRAFT' }; db.purchase_orders.push(row); }
    Object.assign(row, { order_date: payload.date, supplier_id: Number(payload.supplierId), warehouse_id: Number(payload.warehouseId), notes: payload.notes || '' });
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
      employees: db.cash_transactions.some(row => row.employee_id === id), cash_accounts: db.cash_transactions.some(row => row.account_id === id || row.target_account_id === id),
      income_expense_categories: db.cash_transactions.some(row => row.category_id === id)
    }; return checks[type];
  }

  function printDocument(type, id) {
    const doc = type === 'quote' ? getQuote(id) : type === 'sale' ? db.sales.find(row => row.id === Number(id)) : getPurchaseOrder(id);
    const popup = window.open('', '_blank'); if (!popup) return true;
    const lines = (doc.items || getQuote(doc.quote_id).items).map(item => `<tr><td>${item.description || item.product_name}</td><td>${item.quantity}</td><td>${new Intl.NumberFormat('vi-VN').format(item.line_total || item.quantity * item.unit_price)} ₫</td></tr>`).join('');
    popup.document.write(`<!doctype html><meta charset="utf-8"><title>${doc.number}</title><h1>${db.settings.company_name}</h1><h2>${doc.number}</h2><p>Bản in từ hệ thống demo Internet</p><table border="1" cellspacing="0" cellpadding="8"><tr><th>Nội dung</th><th>SL</th><th>Thành tiền</th></tr>${lines}</table><script>window.print()<\/script>`); popup.document.close(); return true;
  }

  window.crm = {
    bootstrap: async () => copy(bootstrap()), calculateCost: async input => calculateCost(input),
    listMaster: async type => { if (!masterTypes.includes(type)) throw new Error('Danh mục không hợp lệ.'); return copy(active(type).sort((a, b) => a.name.localeCompare(b.name))); },
    saveMaster: async (type, record) => { if (!masterTypes.includes(type) || !record.code?.trim() || !record.name?.trim()) throw new Error('Mã và tên không được để trống.'); let row = record.id ? find(type, record.id) : null;
      if (!row) { row = { id: nextId(db[type]), active: 1 }; db[type].push(row); } Object.assign(row, copy(record)); for (const key of ['purchase_price', 'sale_price', 'vat_rate', 'opening_balance', 'affects_profit']) if (key in row) row[key] = n(row[key]); return row.id; },
    deleteMaster: async (type, id) => { if (masterUsed(type, id)) throw new Error('Dữ liệu đã được dùng trong chứng từ nên không thể xóa.'); db[type] = db[type].filter(row => row.id !== Number(id)); },
    listQuotes: async () => copy(listQuotes()), getQuote: async id => copy(getQuote(id)), createQuote: async payload => saveQuote(payload), updateQuote: async (id, payload) => saveQuote(payload, id),
    setQuoteStatus: async (id, status) => { const row = db.quotes.find(item => item.id === Number(id)); if (!row || row.status === 'CONVERTED') throw new Error('Không thể đổi trạng thái.'); row.status = status; },
    convertQuote: async id => { const quote = getQuote(id); if (quote.status === 'CONVERTED') throw new Error('Báo giá đã được chuyển.'); for (const item of quote.items) if (item.product_id && balance(item.product_id, quote.warehouse_id) < item.stock_quantity) throw new Error(`Không đủ tồn kho cho ${item.description}.`);
      const sale = { id: nextId(db.sales), number: numberFor('sale', 'BH'), sale_date: date(), quote_id: quote.id, customer_id: quote.customer_id, warehouse_id: quote.warehouse_id, total: quote.total, status: 'POSTED' }; db.sales.push(sale);
      quote.items.forEach(item => { if (item.product_id && item.stock_quantity > 0) db.movements.push({ id: nextId(db.movements), movement_date: date(), warehouse_id: quote.warehouse_id, product_id: item.product_id, quantity: -item.stock_quantity, unit_cost: item.cost_before_profit / Math.max(1, item.stock_quantity), source_type: 'SALE', source_id: sale.id, note: sale.number }); });
      db.quotes.find(row => row.id === quote.id).status = 'CONVERTED'; return { id: sale.id, number: sale.number }; },
    deleteQuote: async id => { const row = db.quotes.find(item => item.id === Number(id)); if (row?.status === 'CONVERTED') throw new Error('Hãy xóa phiếu xuất trước.'); db.quotes = db.quotes.filter(item => item.id !== Number(id)); },
    listSales: async () => copy(db.sales.map(row => ({ ...row, customer_name: find('customers', row.customer_id)?.name, warehouse_name: find('warehouses', row.warehouse_id)?.name })).sort((a, b) => b.id - a.id)),
    deleteSale: async id => { const sale = db.sales.find(row => row.id === Number(id)); if (!sale) throw new Error('Không tìm thấy phiếu xuất.'); db.movements = db.movements.filter(row => !(row.source_type === 'SALE' && row.source_id === sale.id)); const quote = db.quotes.find(row => row.id === sale.quote_id); if (quote) quote.status = 'WON'; db.sales = db.sales.filter(row => row.id !== sale.id); },
    listPurchaseOrders: async () => copy(listPurchaseOrders()), getPurchaseOrder: async id => copy(getPurchaseOrder(id)), createPurchaseOrder: async payload => savePo(payload), updatePurchaseOrder: async (id, payload) => savePo(payload, id),
    receivePurchaseOrder: async id => { const po = db.purchase_orders.find(row => row.id === Number(id)); if (!po || po.status === 'RECEIVED') throw new Error('Đơn đã được nhận.'); po.status = 'RECEIVED'; po.items.forEach(item => { item.received_quantity = item.quantity; db.movements.push({ id: nextId(db.movements), movement_date: date(), warehouse_id: po.warehouse_id, product_id: item.product_id, quantity: item.quantity, unit_cost: item.unit_price, source_type: 'RECEIPT', source_id: po.id, note: po.number }); }); return { id: po.id, number: numberFor('receipt', 'NH') }; },
    deletePurchaseOrder: async id => { db.movements = db.movements.filter(row => !(row.source_type === 'RECEIPT' && row.source_id === Number(id))); db.purchase_orders = db.purchase_orders.filter(row => row.id !== Number(id)); },
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
        customer_id: Number(payload.customerId) || null, supplier_id: Number(payload.supplierId) || null, employee_id: Number(payload.employeeId) || null, category_id: Number(payload.categoryId) || null, amount: n(payload.amount), reference: payload.reference || '', notes: payload.notes || '' }; db.cash_transactions.push(row); return { id: row.id, number: row.number }; },
    deleteCashTransaction: async id => { db.cash_transactions = db.cash_transactions.filter(row => row.id !== Number(id)); },
    getDebts: async () => ({ customers: copy(active('customers').map(customer => ({ id: customer.id, code: customer.code, name: customer.name, balance: db.sales.filter(row => row.customer_id === customer.id).reduce((sum, row) => sum + row.total, 0) + db.stock_documents.filter(row => row.customer_id === customer.id && row.type === 'DIRECT_SALE').reduce((sum, row) => sum + row.total, 0) - db.stock_documents.filter(row => row.customer_id === customer.id && row.type === 'CUSTOMER_RETURN').reduce((sum, row) => sum + row.total, 0) - db.cash_transactions.filter(row => row.customer_id === customer.id && row.type === 'CUSTOMER_RECEIPT').reduce((sum, row) => sum + row.amount, 0) }))),
      suppliers: copy(active('suppliers').map(supplier => ({ id: supplier.id, code: supplier.code, name: supplier.name, balance: db.purchase_orders.filter(row => row.supplier_id === supplier.id && row.status === 'RECEIVED').reduce((sum, row) => sum + total(row.items), 0) + db.stock_documents.filter(row => row.supplier_id === supplier.id && row.type === 'DIRECT_RECEIPT').reduce((sum, row) => sum + row.total, 0) - db.stock_documents.filter(row => row.supplier_id === supplier.id && row.type === 'SUPPLIER_RETURN').reduce((sum, row) => sum + row.total, 0) - db.cash_transactions.filter(row => row.supplier_id === supplier.id && row.type === 'SUPPLIER_PAYMENT').reduce((sum, row) => sum + row.amount, 0) }))) }),
    getReports: async () => copy(reports()), saveSettings: async values => { Object.assign(db.settings, values); },
    seedDemoData: async () => { db = makeDb(); return { created: 9 }; },
    backup: async () => { const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'CRM-demo-backup.json'; link.click(); URL.revokeObjectURL(link.href); return 'CRM-demo-backup.json'; },
    previewDocument: async (type, id) => printDocument(type, id), exportPdf: async (type, id) => { printDocument(type, id); return null; }
  };
})();
