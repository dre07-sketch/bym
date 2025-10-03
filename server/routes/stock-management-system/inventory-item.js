const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const JWT_SECRET = 'f9b3d8c2a1e74f0d9b6c5a8e3f7d1c0b'; 

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/inventory');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/inventory/items
router.get('/items', async (req, res) => {
  try {
    const sql = `
      SELECT 
        item_id AS id,
        name,
        category,
        sku,
        price,
        quantity,
        min_stock_level AS minStock,
        supplier,
        location,
        description,
        image_url AS imageUrl,
        quality_type,       -- ✅ Added quality_type
        updated_at AS lastUpdated
      FROM inventory_items
      ORDER BY updated_at DESC
    `;

    const [rows] = await db.promise().execute(sql);

    const itemsWithStatus = rows.map(item => {
      let status = 'In Stock';
      if (item.quantity === 0) {
        status = 'Out of Stock';
      } else if (item.quantity <= item.minStock) {
        status = 'Low Stock';
      }
      return { 
        ...item,
        status
      };
    });

    res.status(200).json({
      success: true,
      data: itemsWithStatus
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/inventory/stock-history
router.get('/stock-history', async (req, res) => {
  try {
    const sql = `
      SELECT 
        sh.id,
        sh.item_id,
        ii.name AS item_name,
        sh.type,
        sh.quantity,
        sh.transaction_date AS transactionDate,
        sh.reference,
        sh.notes,
        sh.created_at AS createdAt
      FROM stock_history sh
      LEFT JOIN inventory_items ii ON sh.item_id = ii.item_id
      ORDER BY sh.transaction_date DESC, sh.created_at DESC
    `;

    const [rows] = await db.promise().execute(sql);

    // Format data for frontend
    const history = rows.map(record => ({
      id: record.id,
      itemId: record.item_id,
      itemName: record.item_name || 'Unknown Item',
      type: record.type,
      quantity: record.quantity,
      transactionDate: record.transactionDate,
      reference: record.reference,
      notes: record.notes,
      createdAt: record.createdAt
    }));

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/inventory/reports/stock-summary
router.get('/reports/stock-summary', async (req, res) => {
  try {
    const { dateRange = 'last-30-days' } = req.query;

    // Date logic
    let startDate;
    const now = new Date();
    switch (dateRange) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default: // last-30-days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Total Items
    const [totalItems] = await db.promise().execute(
      'SELECT COUNT(*) as count, SUM(quantity * price) as totalValue FROM inventory_items'
    );

    // Low Stock
    const [lowStock] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_stock_level'
    );

    // Out of Stock
    const [outOfStock] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM inventory_items WHERE quantity = 0'
    );

    // Recently Added
    const [recentlyAdded] = await db.promise().execute(
      `SELECT COUNT(*) as count FROM inventory_items WHERE created_at >= ?`,
      [startDate]
    );

    res.status(200).json({
      success: true,
      data: {
        totalItems: totalItems[0].count,
        totalValue: parseFloat(totalItems[0].totalValue) || 0,
        lowStock: lowStock[0].count,
        outOfStock: outOfStock[0].count,
        recentlyAdded: recentlyAdded[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET /api/inventory/reports/movement-analysis
router.get('/reports/movement-analysis', async (req, res) => {
  try {
    const { dateRange = 'last-30-days' } = req.query;

    let startDate;
    const now = new Date();
    switch (dateRange) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Incoming vs Outgoing
    const [movement] = await db.promise().execute(`
      SELECT 
        SUM(CASE WHEN type = 'restock' THEN quantity ELSE 0 END) as incoming,
        SUM(CASE WHEN type = 'sale' THEN quantity ELSE 0 END) as outgoing
      FROM stock_history 
      WHERE transaction_date >= ?
    `, [startDate]);

    // Top Moving Items
    const [topItems] = await db.promise().execute(`
      SELECT ii.item_name, sh.type, SUM(sh.quantity) as quantity
      FROM stock_history sh
      JOIN inventory_items ii ON sh.item_id = ii.item_id
      WHERE sh.transaction_date >= ?
      GROUP BY ii.item_name, sh.type
      ORDER BY quantity DESC
      LIMIT 5
    `, [startDate]);

    res.status(200).json({
      success: true,
      data: {
        incoming: movement[0].incoming || 0,
        outgoing: movement[0].outgoing || 0,
        topItems: topItems.map(item => ({
          itemName: item.item_name,
          type: item.type,
          quantity: item.quantity
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching movement analysis:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET /api/inventory/reports/supplier-performance
router.get('/reports/supplier-performance', async (req, res) => {
  try {
    const { dateRange = 'last-30-days' } = req.query;

    let startDate;
    const now = new Date();
    switch (dateRange) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Simulate supplier performance from purchase_orders
    const [rows] = await db.promise().execute(`
      SELECT 
        supplier,
        COUNT(*) as orders,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as onTime,
        AVG(total_amount) as avgValue,
        SUM(total_amount) as totalValue
      FROM purchase_orders 
      WHERE order_date >= ?
      GROUP BY supplier
      ORDER BY totalValue DESC
    `, [startDate]);

    const suppliers = rows.map(row => {
      const onTimePercentage = row.orders > 0 ? (row.onTime / row.orders) * 100 : 0;
      return {
        supplier: row.supplier,
        orders: row.orders,
        onTime: row.onTime,
        rating: 4.0 + Math.random() * 0.9, // Simulated rating
        totalValue: parseFloat(row.totalValue)
      };
    });

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/inventory/items
router.post('/items', upload.single('image'), (req, res) => {
  const {
    name,
    sku,
    unitPrice,
    quantity,
    minStock,
    supplier,
    location,
    description,
    category,
    qualityType
  } = req.body;

  console.log('Received body:', req.body); // Debug

  // Validate required fields
  if (!name || !sku || !category || !qualityType || unitPrice === undefined || minStock === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Validate category
  const validCategories = ['Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids', 'Tools','others'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  // Validate qualityType
  const validQualityTypes = ['original', 'local', 'high-copy'];
  if (!validQualityTypes.includes(qualityType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid quality type: "${qualityType}". Must be one of: ${validQualityTypes.join(', ')}`
    });
  }

  // Parse numbers
  const price = parseFloat(unitPrice);
  const qty = quantity === '' || isNaN(parseInt(quantity)) ? 0 : parseInt(quantity);
  const min = parseInt(minStock);

  if (isNaN(price)) return res.status(400).json({ success: false, message: 'Invalid price' });
  if (isNaN(min) || min < 0) return res.status(400).json({ success: false, message: 'Invalid minimum stock' });
  if (qty < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });

  const imageUrl = req.file ? `/uploads/inventory/${req.file.filename}` : null;

  // Generate next STK number using raw SQL with callback
  const maxIdSql = "SELECT MAX(CAST(SUBSTRING(item_id, 4) AS UNSIGNED)) AS max_id FROM inventory_items";

  db.query(maxIdSql, (err, results) => {
    if (err) {
      console.error('DB Error (max_id):', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const max_id = results[0].max_id;
    const nextNum = (max_id === null ? 0 : max_id) + 1;
    const item_id = `STK${String(nextNum).padStart(3, '0')}`;

    // Insert new item
    const insertSql = `
      INSERT INTO inventory_items 
      (item_id, name, category, sku, price, quantity, min_stock_level, supplier, location, description, image_url, quality_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      item_id,
      name.trim(),
      category,
      sku.trim(),
      price,
      qty,
      min,
      supplier || null,
      location || null,
      description || null,
      imageUrl,
      qualityType
    ];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'SKU already exists' });
        }
        console.error('Insert Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      // Success response
      let status = 'In Stock';
      if (qty === 0) status = 'Out of Stock';
      else if (qty <= min) status = 'Low Stock';

      res.status(201).json({
        success: true,
        message: 'Item added successfully',
        item: {
          id: result.insertId,
          item_id,
          name,
          category,
          sku,
          unitPrice: price,
          quantity: qty,
          minStock: min,
          supplier: supplier || null,
          location: location || null,
          description: description || null,
          imageUrl,
          qualityType,
          status,
          lastUpdated: new Date().toISOString()
        }
      });
    });
  });
});


// POST /api/inventory/stock-in
router.post('/stock-in', async (req, res) => {
  const { itemId, quantity, date, reference, notes } = req.body;

  // Validate required fields
  if (!itemId || !quantity || !date) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: itemId, quantity, or date'
    });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid quantity'
    });
  }

  if (isNaN(Date.parse(date))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date'
    });
  }

  try {
    // Check if item exists and get current stock
    const [[item]] = await db.promise().execute(
      'SELECT id, quantity FROM inventory_items WHERE item_id = ?', [itemId]
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Update stock
    const newQuantity = item.quantity + qty;
    await db.promise().execute(
      'UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE item_id = ?',
      [newQuantity, date, itemId]
    );

    // Optional: Insert into stock history log
    await db.promise().execute(
      `INSERT INTO stock_history (item_id, type, quantity, transaction_date, reference, notes)
       VALUES (?, 'IN', ?, ?, ?, ?)`,
      [itemId, qty, date, reference || null, notes || null]
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        itemId,
        newQuantity,
        date,
        reference,
        notes
      }
    });
  } catch (error) {
    console.error('Error in stock-in:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// PUT /api/inventory/items/:id
router.put('/items/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Invalid item ID' });
  }
  const itemId = id; // Keep as string, e.g., STK020

  const {
    name,
    sku,
    category,
    qualityType,
    unitPrice,
    quantity,
    minStock,
    supplier,
    location,
    description
  } = req.body;

  // Validate required fields
  if (!name || !sku || !category || !qualityType || unitPrice === undefined || minStock === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, sku, category, qualityType, unitPrice, or minStock'
    });
  }

  // Validate category
  const validCategories = ['Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids', 'Tools'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  // Validate qualityType
  const validQualityTypes = ['original', 'local', 'high-copy'];
  if (!validQualityTypes.includes(qualityType)) {
    return res.status(400).json({ success: false, message: 'Invalid quality type' });
  }

  // Parse numbers
  const price = parseFloat(unitPrice);
  const qty = quantity === '' || isNaN(parseInt(quantity)) ? 0 : parseInt(quantity);
  const min = parseInt(minStock);

  if (isNaN(price)) return res.status(400).json({ success: false, message: 'Invalid price' });
  if (isNaN(min) || min < 0) return res.status(400).json({ success: false, message: 'Invalid minimum stock level' });
  if (qty < 0) return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });

  try {
    // Fetch existing item
    const [[existingItem]] = await db.promise().execute(
      'SELECT image_url FROM inventory_items WHERE item_id = ?',
      [itemId]
    );

    if (!existingItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Determine image URL
    const imageUrl = req.file ? `/uploads/inventory/${req.file.filename}` : existingItem.image_url;

    // Update item
    const sql = `
      UPDATE inventory_items SET
        name = ?, category = ?, quality_type = ?, sku = ?, price = ?, quantity = ?,
        min_stock_level = ?, supplier = ?, location = ?, description = ?, image_url = ?
      WHERE item_id = ?
    `;
    const values = [
      name.trim(),
      category,
      qualityType,
      sku.trim(),
      price,
      qty,
      min,
      supplier || null,
      location || null,
      description || null,
      imageUrl,
      itemId
    ];

    await db.promise().execute(sql, values);

    // Determine stock status
    let status = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= min) status = 'Low Stock';

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: {
        itemId,
        name,
        category,
        qualityType,
        sku,
        unitPrice: price,
        quantity: qty,
        minStock: min,
        supplier: supplier || null,
        location: location || null,
        description: description || null,
        imageUrl,
        status,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// DELETE /api/inventory/items/:id
router.delete('/items/:item_id', (req, res) => {
  const { item_id } = req.params;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: "Item ID is required",
    });
  }

  console.log("Attempting to delete item with item_id:", item_id);

  const query = "DELETE FROM inventory_items WHERE item_id = ?";

  db.query(query, [item_id], (err, result) => {
    if (err) {
      console.error("Database error while deleting item:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${item_id} not found`,
      });
    }

    return res.json({
      success: true,
      message: `Item with ID ${item_id} deleted successfully`,
    });
  });
});




// GET /api/inventory/top-moving
router.get('/top-moving', async (req, res) => {
  try {
    const sql = `
      SELECT 
        name,
        quantity,
        price,
        updated_at AS lastUpdated
      FROM inventory_items
      WHERE quantity > 0
      ORDER BY updated_at DESC
      LIMIT 5
    `;
    const [rows] = await db.promise().execute(sql);
    const topMoving = rows.map((item, index) => ({
      id: index + 1,
      name: item.name,
      moved: item.quantity,
      trend: item.quantity > 50 ? 'up' : item.quantity > 10 ? 'stable' : 'down',
      stock: item.quantity,
      price: item.price,
      lastUpdated: item.lastUpdated
    }));

    res.status(200).json({
      success: true,
      data: topMoving
    });
  } catch (error) {
    console.error('Error fetching top moving items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// NEW: GET /api/inventory/categories/stock
router.get('/categories/stock', async (req, res) => {
  try {
    const sql = `
      SELECT 
        category,
        SUM(quantity) AS total_stock
      FROM inventory_items
      GROUP BY category
      ORDER BY total_stock DESC
    `;
    const [rows] = await db.promise().execute(sql);

    const data = rows.map(row => ({
      category: row.category,
      stock: parseInt(row.total_stock)
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching category stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/inventory/report/summary
router.get('/report/summary', async (req, res) => {
  try {
    const sql = `
      SELECT 
        category,
        COUNT(*) as item_count,
        SUM(quantity) as total_quantity,
        SUM(price * quantity) as total_value
      FROM inventory_items
      GROUP BY category
    `;
    const [rows] = await db.promise().execute(sql);
    const summary = rows.map(row => ({
      category: row.category,
      items: parseInt(row.item_count),
      value: `$${parseFloat(row.total_value).toFixed(2)}`,
      lowStock: 0
    }));

    const lowStockSql = `
      SELECT 
        category,
        COUNT(*) as low_count
      FROM inventory_items
      WHERE quantity <= min_stock_level AND quantity > 0
      GROUP BY category
    `;
    const [lowRows] = await db.promise().execute(lowStockSql);
    lowRows.forEach(row => {
      const cat = summary.find(s => s.category === row.category);
      if (cat) cat.lowStock = parseInt(row.low_count);
    });
    summary.forEach(cat => {
      if (cat.lowStock === undefined) cat.lowStock = 0;
    });

    const [[totalItems]] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM inventory_items'
    );
    const [[totalValue]] = await db.promise().execute(
      'SELECT SUM(price * quantity) as value FROM inventory_items'
    );
    const [[lowStockTotal]] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_stock_level AND quantity > 0'
    );

    res.status(200).json({
      success: true,
      data: {
        summary,
        totalItems: totalItems.count,
        totalValue: `$${parseFloat(totalValue.value || 0).toFixed(2)}`,
        lowStockItems: lowStockTotal.count
      }
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/inventory/report/sales-trend
router.get('/report/sales-trend', async (req, res) => {
  try {
    const sql = `
      SELECT 
        DATE_FORMAT(updated_at, '%Y-%m') as month,
        DATE_FORMAT(updated_at, '%b') as month_name,
        COUNT(*) as update_count,
        SUM(quantity) as total_quantity_moved
      FROM inventory_items
      WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month, month_name
      ORDER BY month
    `;
    const [rows] = await db.promise().execute(sql);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const trendData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), currentMonth - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const monthName = months[date.getMonth()].slice(0, 3);
      const row = rows.find(r => r.month === monthStr);
      trendData.push({
        month: monthName,
        sales: row ? row.total_quantity_moved * 100 : 0,
        orders: row ? row.update_count * 2 : 0
      });
    }

    res.status(200).json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// GET /purchase-orders
// ideally from process.env

// 🔓 helper to extract user id from Authorization header
function getUserIdFromToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
}


// POST /api/inventory/purchase-orders
router.post('/purchase-orders', async (req, res) => {
  try {
    const { createdBy, supplier, orderDate, expectedDate, totalAmount, itemCount, notes, priority, items } = req.body;

    console.log('Received request to create purchase order');
    console.log('Request body:', req.body);
    
    // Log the createdBy object specifically
    console.log('Received createdBy:', createdBy);
    console.log('Type of createdBy.full_name:', typeof createdBy.full_name);
    console.log('Value of createdBy.full_name:', createdBy.full_name);

    // Validate creator info
    if (!createdBy || !createdBy.full_name) {
      console.error('Missing creator info');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing creator info. createdBy must include full_name.' 
      });
    }

    // Validate required fields
    if (!supplier || !orderDate || !totalAmount || !itemCount || !items?.length) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: supplier, orderDate, totalAmount, itemCount, items' 
      });
    }

    // Generate unique PO number
    const poNumber = `PO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log('Generated PO number:', poNumber);

    // Insert purchase order - now using createdBy.full_name instead of ID
    console.log('Inserting purchase order with createdBy.full_name:', createdBy.full_name);
    const [result] = await db.promise().execute(
      `INSERT INTO purchase_orders 
        (po_number, supplier, status, order_date, expected_date, total_amount, item_count, created_by, notes, priority) 
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [poNumber, supplier, orderDate, expectedDate, totalAmount, itemCount, createdBy.full_name, notes || '', priority || 'medium']
    );

    console.log('Purchase order inserted with ID:', result.insertId);

    // Insert items in bulk
    const itemValues = items.map(item => [poNumber, item.name, item.quantity, item.price]);
    console.log('Inserting items:', itemValues);
    
    await db.promise().query(
      `INSERT INTO purchase_order_items (po_number, name, quantity, price) VALUES ?`,
      [itemValues]
    );

    console.log('Items inserted successfully');

    // Respond with success
    res.json({
      success: true,
      message: 'Purchase order created successfully',
      poNumber,
      createdBy,
      items
    });

  } catch (error) {
    console.error('❌ Error creating PO:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create purchase order',
      error: error.message 
    });
  }
});




// GET all purchase orders


// ✅ GET all purchase orders
router.get('/purchase-orders', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT 
        po.po_number AS poNumber,
        po.supplier,
        po.status,
        po.order_date AS orderDate,
        po.expected_date AS expectedDate,
        po.received_date AS receivedDate,
        po.total_amount AS totalAmount,
        po.item_count AS itemCount,
        po.created_by AS createdBy,   -- now using varchar field
        po.notes,
        po.priority,
        po.created_at AS createdAt
      FROM purchase_orders po
      ORDER BY po.created_at DESC
    `);

    // fetch items for each PO
    const formattedRows = await Promise.all(
      rows.map(async (row) => {
        const [items] = await db.promise().execute(
          `SELECT id, name, quantity, price 
           FROM purchase_order_items 
           WHERE po_number = ?`,
          [row.poNumber]
        );

        return {
          ...row,
          totalAmount: parseFloat(row.totalAmount) || 0,
          itemCount: parseInt(row.itemCount) || 0,
          createdAt: row.createdAt?.toISOString().split('T')[0],
          expectedDate: row.expectedDate || null,
          receivedDate: row.receivedDate ? row.receivedDate.toISOString().split('T')[0] : null,
          notes: row.notes || '',
          items: items.map(item => ({
            id: item.id.toString(),
            name: item.name,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price)
          }))
        };
      })
    );

    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Error fetching POs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders' });
  }
});

// POST new purchase order



// PUT /api/inventory/purchase-orders/:poNumber - Update PO status
router.put('/purchase-orders/:poNumber', async (req, res) => {
  const { poNumber } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'ordered', 'received'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing status'
    });
  }

  try {

    let receivedDate = null;
if (status === 'received') {
  receivedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

await db.promise().execute(
  `UPDATE purchase_orders 
   SET status = ?, updated_at = CURRENT_TIMESTAMP, received_date = ?
   WHERE po_number = ?`,
  [status, receivedDate, poNumber]
);
    // Check if PO exists
    const [[existing]] = await db.promise().execute(
      'SELECT * FROM purchase_orders WHERE po_number = ?',
      [poNumber]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Prevent invalid transitions (optional)
    if (existing.status === 'rejected' && status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a rejected PO'
      });
    }
    if (existing.status === 'received' && status !== 'received') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a received PO'
      });
    }

    // Update status
    await db.promise().execute(
      'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE po_number = ?',
      [status, poNumber]
    );

    res.status(200).json({
      success: true,
      message: `Purchase order ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// GET /api/inventory/suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT 
        id,
        name,
        contact_person AS contactPerson,
        email,
        phone,
        address,
        payment_terms AS paymentTerms,
        lead_time AS leadTime,
        categories,
        created_at AS createdAt
      FROM suppliers 
      ORDER BY created_at DESC
    `);

    // Format categories into array
    const suppliers = rows.map(supplier => ({
      ...supplier,
      categories: supplier.categories ? supplier.categories.split(',').map(c => c.trim()) : []
    }));

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
});


// POST /api/inventory/suppliers
router.post('/suppliers', async (req, res) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    address,
    paymentTerms,
    leadTime,
    categories = []
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Company Name and Email are required'
    });
  }

  try {
    const categoriesStr = Array.isArray(categories) ? categories.join(',') : '';

    const sql = `
      INSERT INTO suppliers 
      (name, contact_person, email, phone, address, payment_terms, lead_time, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      contactPerson || null,
      email,
      phone || null,
      address || null,
      paymentTerms || null,
      leadTime ? parseInt(leadTime) : null,
      categoriesStr
    ];

    await db.promise().execute(sql, values);

    res.status(201).json({
      success: true,
      message: 'Supplier added successfully'
    });
  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


router.get('/ordered-parts/:ticketNumber', (req, res) => {
  const { ticketNumber } = req.params;

  const query = `
    SELECT 
      st.id AS ticket_id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.mechanic_assign,
      st.inspector_assign,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,
      st.estimated_completion_date,
      op.id AS ordered_part_id,
      op.item_id,
      op.name,
      op.category,
      op.sku,
      op.price,
      op.quantity,
      op.status AS part_status,
      op.ordered_at
    FROM service_tickets st
    LEFT JOIN ordered_parts op
      ON st.ticket_number = op.ticket_number
    WHERE st.ticket_number = ?
    ORDER BY op.ordered_at DESC
  `;

  db.query(query, [ticketNumber], (err, results) => {
    if (err) {
      console.error('Error fetching ordered parts with ticket:', err);
      return res.status(500).json({ error: 'Failed to fetch ordered parts' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No ticket found' });
    }

    // ✅ Format response: ticket info + ordered_parts[]
    const ticket = {
      ticket_id: results[0].ticket_id,
      ticket_number: results[0].ticket_number,
      customer_type: results[0].customer_type,
      customer_id: results[0].customer_id,
      customer_name: results[0].customer_name,
      vehicle_id: results[0].vehicle_id,
      vehicle_info: results[0].vehicle_info,
      license_plate: results[0].license_plate,
      title: results[0].title,
      mechanic_assign: results[0].mechanic_assign,
      inspector_assign: results[0].inspector_assign,
      description: results[0].description,
      priority: results[0].priority,
      type: results[0].type,
      urgency_level: results[0].urgency_level,
      status: results[0].status,
      appointment_id: results[0].appointment_id,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at,
      completion_date: results[0].completion_date,
      estimated_completion_date: results[0].estimated_completion_date,
      ordered_parts: []
    };

    results.forEach(row => {
      if (row.ordered_part_id) {
        ticket.ordered_parts.push({
          id: row.ordered_part_id,
          item_id: row.item_id,
          name: row.name,
          category: row.category,
          sku: row.sku,
          price: row.price,
          quantity: row.quantity,
          status: row.part_status,
          ordered_at: row.ordered_at
        });
      }
    });

    res.json(ticket);
  });
});

// GET /ordered-parts - Get all tickets with their ordered parts
router.get('/ordered-parts', (req, res) => {
  const query = `
    SELECT 
      st.id AS ticket_id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      ma.mechanic_name AS mechanicName,  -- ✅ get from mechanic_assignments
      st.inspector_assign,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,
      st.estimated_completion_date,
      op.id AS ordered_part_id,
      op.item_id,
      op.name,
      op.category,
      op.sku,
      op.price,
      op.quantity,
      op.status AS part_status,
      op.ordered_at
    FROM service_tickets st
    LEFT JOIN ordered_parts op 
      ON st.ticket_number = op.ticket_number
    LEFT JOIN mechanic_assignments ma
      ON st.ticket_number = ma.ticket_number
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching all tickets with parts:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Group rows by ticket_number
    const ticketsMap = new Map();

    results.forEach(row => {
      const key = row.ticket_number;

      if (!ticketsMap.has(key)) {
        ticketsMap.set(key, {
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          customer_type: row.customer_type,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          vehicle_id: row.vehicle_id,
          vehicle_info: row.vehicle_info,
          license_plate: row.license_plate,
          title: row.title,
          mechanicName: row.mechanicName,   // ✅ updated
          inspector_assign: row.inspector_assign,
          description: row.description,
          priority: row.priority,
          type: row.type,
          urgency_level: row.urgency_level,
          status: row.status,
          appointment_id: row.appointment_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          completion_date: row.completion_date,
          estimated_completion_date: row.estimated_completion_date,
          ordered_parts: []
        });
      }

      // Only push part if it exists
      if (row.ordered_part_id) {
        ticketsMap.get(key).ordered_parts.push({
          id: row.ordered_part_id,
          item_id: row.item_id,
          name: row.name,
          category: row.category,
          sku: row.sku,
          price: parseFloat(row.price),
          quantity: row.quantity,
          status: row.part_status,
          ordered_at: row.ordered_at
        });
      }
    });

    res.json(Array.from(ticketsMap.values()));
  });
});


router.put('/ordered-parts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'given'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const query = `UPDATE ordered_parts SET status = ? WHERE id = ?`;

  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ error: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

router.get('/order-history', (req, res) => {
  const query = `
    SELECT 
      st.id AS ticket_id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      ma.mechanic_name AS mechanicName,  -- ✅ from mechanic_assignments
      st.inspector_assign,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,
      st.estimated_completion_date,
      op.id AS ordered_part_id,
      op.item_id,
      op.name,
      op.category,
      op.sku,
      op.price,
      op.quantity,
      op.status AS part_status,
      op.ordered_at
    FROM service_tickets st
    LEFT JOIN ordered_parts op 
      ON st.ticket_number = op.ticket_number
    LEFT JOIN mechanic_assignments ma
      ON st.ticket_number = ma.ticket_number
    WHERE st.ticket_number IN (
      SELECT ticket_number
      FROM ordered_parts
      GROUP BY ticket_number
      HAVING COUNT(*) = COUNT(CASE WHEN status = 'given' THEN 1 END)
         AND COUNT(*) > 0  -- at least one part
    )
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Transform flat results into grouped orders
    const grouped = results.reduce((acc, row) => {
      const { ordered_part_id, ...orderData } = row;

      let order = acc.find(o => o.ticket_id === row.ticket_id);
      if (!order) {
        order = {
          ...orderData,
          ordered_parts: []
        };
        acc.push(order);
      }

      if (ordered_part_id) {
        order.ordered_parts.push({
          id: ordered_part_id,
          item_id: row.item_id,
          name: row.name,
          category: row.category,
          sku: row.sku,
          price: row.price,
          quantity: row.quantity,
          status: row.part_status,
          ordered_at: row.ordered_at,
        });
      }

      return acc;
    }, []);

    res.json(grouped);
  });
});

router.post("/outsource-parts-get", (req, res) => {
  const { ticketNumbers } = req.body;

  // Validate request
  if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "ticketNumbers (array) is required",
    });
  }

  const outsourceStockQuery = `
    SELECT 
      id,
      ticket_number,
      name,
      category,
      sku,
      price,
      quantity,
      source_shop,
      status,
      requested_at,
      received_at,
      notes,
      updated_at,
      (quantity * price) AS total_cost
    FROM outsource_stock 
    WHERE ticket_number IN (?) 
    ORDER BY requested_at DESC
  `;

  db.query(outsourceStockQuery, [ticketNumbers], (err, results) => {
    if (err) {
      console.error("❌ Error fetching outsource stock:", err);
      return res.status(500).json({
        success: false,
        message: "Database error while fetching outsource stock",
      });
    }

    return res.json({
      success: true,
      count: results.length,
      data: results,
    });
  });
});

router.get('/names', (req, res) => {
  const query = `
    SELECT id, name 
    FROM suppliers 
    ORDER BY name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching supplier names:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching supplier names'
      });
    }

    return res.json({
      success: true,
      data: results
    });
  });
});

module.exports = router;