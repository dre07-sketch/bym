  const express = require('express');
  const router = express.Router();
  const db = require('../../db/connection');

  // Helper: Send JSON response with optional pagination
  const sendResponse = (
    res,
    success,
    data = null,
    message = '',
    status = 200,
    pagination = null
  ) => {
    const response = { success, data, message };
    if (pagination) response.pagination = pagination;
    return res.status(status).json(response);
  };

  // ====== PROFORMA INVOICES ======

 
router.post('/proformas-post', async (req, res) => {
  const {
    proforma_number,
    proforma_date,
    notes,
    items,
    customer_name,
    company_name,
    company_address,
    company_phone,
    company_vat_number
  } = req.body;

  // Required fields validation
  if (!proforma_number || !proforma_date || !items || !Array.isArray(items) || items.length === 0) {
    return sendResponse(res, false, null, 'Missing required fields: proforma_number, proforma_date, or items', 400);
  }

  for (const item of items) {
    if (!item.description) {
      return sendResponse(res, false, null, 'Each item must have a description.', 400);
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return sendResponse(res, false, null, 'Item quantity must be a positive number.', 400);
    }
    if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
      return sendResponse(res, false, null, 'Item unit price must be a non-negative number.', 400);
    }
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const vat_rate = 15; // default VAT rate
    const vat_amount = parseFloat((subtotal * (vat_rate / 100)).toFixed(2));
    const total = subtotal + vat_amount;

    // Insert proforma (now including customer & company info)
    const [proformaResult] = await connection.execute(
      `INSERT INTO proformas 
      (proforma_number, proforma_date, customer_name, company_name, company_address, company_phone, company_vat_number, notes, status, subtotal, vat_rate, vat_amount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proforma_number,
        proforma_date,
        customer_name || null,
        company_name || null,
        company_address || null,
        company_phone || null,
        company_vat_number || null,
        notes || null,
        'Awaiting Send',
        subtotal,
        vat_rate,
        vat_amount,
        total,
      ]
    );

    const proformaId = proformaResult.insertId;

    // Insert items
    const itemValues = items.map(item => [
      proformaId,
      item.description,
      item.size || null,
      item.quantity,
      item.unit_price,
    ]);

    await connection.query(
      `INSERT INTO proforma_items (proforma_id, description, size, quantity, unit_price) VALUES ?`,
      [itemValues]
    );

    await connection.commit();

    return sendResponse(res, true, {
      id: proformaId,
      proforma_number,
      proforma_date,
      subtotal,
      vat_rate,
      vat_amount,
      total,
      item_count: items.length,
    }, 'Proforma invoice saved successfully!', 201);

  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('❌ Proforma save error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return sendResponse(res, false, null, `Proforma number "${proforma_number}" already exists.`, 409);
    }

    return sendResponse(res, false, null, 'Failed to save proforma invoice.', 500);
  } finally {
    if (connection) connection.release();
  }
});


  // GET /api/communication-center/proformas
  // List all proformas with pagination, search, and filters
router.get('/proformas', async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    date,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page)) || 1;
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 10;
  const offset = (pageNum - 1) * limitNum;

  let connection;
  try {
    connection = await db.promise().getConnection();

    // Base query with all fields you want
    let query = `
      SELECT 
        id,
        proforma_number,
        proforma_date,
        customer_name,
        company_name,
        company_address,
        company_phone,
        company_vat_number,
        notes,
        status,
        subtotal,
        vat_rate,
        vat_amount,
        total,
        created_at,
        updated_at
      FROM proformas
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) AS total FROM proformas WHERE 1=1`;
    const params = [];

    // Apply filters
    if (search) {
      query += ` AND (proforma_number LIKE ? OR notes LIKE ? OR customer_name LIKE ? OR company_name LIKE ?)`;
      countQuery += ` AND (proforma_number LIKE ? OR notes LIKE ? OR customer_name LIKE ? OR company_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND DATE(proforma_date) = DATE(?)`;
      countQuery += ` AND DATE(proforma_date) = DATE(?)`;
      params.push(date);
    }

    // Add sorting and pagination
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    // Execute both queries
    const [rows] = await connection.execute(query, params);
    const [[{ total }]] = await connection.execute(countQuery, params.slice(0, -2)); // exclude LIMIT/OFFSET

    const totalPages = Math.ceil(total / limitNum);

    connection.release();

    return sendResponse(res, true, rows, 'Proforma list retrieved successfully.', 200, {
      page: pageNum,
      pages: totalPages,
      total,
      limit: limitNum,
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Fetch proformas error:', error);
    return sendResponse(res, false, null, 'Could not retrieve proforma invoices.', 500);
  }
});


  // GET /api/communication-center/proformas/:id
  // Get single proforma with items
  // GET /api/communication-center/proformas/:id
// Get single proforma with items
// GET /api/communication-center/proformas/:id
router.get('/proformas/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || isNaN(parseInt(id))) {
    return sendResponse(res, false, null, 'Invalid or missing proforma ID.', 400);
  }

  let connection;
  try {
    // Use connection from pool
    connection = await db.promise().getConnection();

    // Get proforma
    const [proformaRows] = await connection.execute(
      `SELECT * FROM proformas WHERE id = ?`,
      [id]
    );

    if (proformaRows.length === 0) {
      await connection.release();
      return sendResponse(res, false, null, 'Proforma not found.', 404);
    }

    // Get items
    const [itemRows] = await connection.execute(
      `SELECT * FROM proforma_items WHERE proforma_id = ?`,
      [id]
    );

    // Release connection
    await connection.release();

    // Build response
    const proforma = proformaRows[0];
    const items = Array.isArray(itemRows) ? itemRows : [];

    const responseData = {
      ...proforma,
      items: items,
      // Add dummy customer/vehicle for now (you can join later)
      customer_name: 'John Doe',        // TODO: JOIN with customers
      customer_email: 'john@example.com',
      customer_phone: '+123 456 7890',
      customer_address: '123 Main St, Colombo',
      vehicle: 'Toyota Corolla - ABC-123',
    };

    return sendResponse(res, true, responseData, 'Proforma invoice retrieved successfully.');

  } catch (error) {
    // Safely handle errors
    console.error('❌ Fetch proforma by ID error:', error);

    // Release connection on error
    if (connection) {
      await connection.release().catch(console.error);
    }

    return sendResponse(res, false, null, 'Could not retrieve proforma invoice.', 500);
  }
});

  // ====== STATS ENDPOINT ======
  // GET /api/communication-center/stats
  router.get('/stats', async (req, res) => {
    try {
      const [rows] = await db.promise().execute(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN status = 'Awaiting Send' THEN 1 ELSE 0 END) AS awaiting_send,
          SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) AS sent,
          SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted,
          SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
          SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) AS expired
        FROM proformas
      `);

      const stats = rows[0];

      const result = {
        total: parseInt(stats.total),
        awaitingSend: parseInt(stats.awaiting_send) || 0,
        draft: parseInt(stats.draft) || 0,
        accepted: parseInt(stats.accepted) || 0,
        cancelled: parseInt(stats.cancelled) || 0,
      };

      return sendResponse(res, true, result, 'Stats retrieved successfully.');
    } catch (error) {
      console.error('❌ Fetch stats error:', error);
      return sendResponse(res, false, null, 'Could not retrieve statistics.', 500);
    }
  });


  // GET /api/communication-center/outsource-stock
// List outsourced stock with pagination, search, and filters
router.get('/outsource-stock', async (req, res) => {
  console.log('✅ HIT: /outsource-stock route triggered');
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page)) || 1;
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))) || 10;
  const offset = (pageNum - 1) * limitNum;

  let connection;
  try {
    connection = await db.promise().getConnection();

    // Base query
    let query = `
      SELECT 
        id,
        name,
        category,
        sku,
        price,
        quantity,
        source_shop,
        status,
        requested_at,
        received_at,
        notes
      FROM outsource_stock
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) AS total FROM outsource_stock WHERE 1=1`;
    const params = [];
    const countParams = [];

    // Apply filters
    if (search) {
      query += ` AND (name LIKE ? OR sku LIKE ? OR source_shop LIKE ?)`;
      countQuery += ` AND (name LIKE ? OR sku LIKE ? OR source_shop LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (category) {
      query += ` AND category = ?`;
      countQuery += ` AND category = ?`;
      params.push(category);
      countParams.push(category);
    }

    // Add sorting and pagination
    query += ` ORDER BY requested_at DESC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    // Execute both queries
    const [rows] = await connection.execute(query, params);
    const [[{ total }]] = await connection.execute(countQuery, countParams);

    const totalPages = Math.ceil(total / limitNum);

    connection.release();

    return sendResponse(res, true, rows, 'Outsource stock list retrieved successfully.', 200, {
      page: pageNum,
      pages: totalPages,
      total,
      limit: limitNum,
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Fetch outsource stock error:', error);
    return sendResponse(res, false, null, 'Could not retrieve outsource stock.', 500);
  }
});


// GET /api/communication-center/outsource-stock-stats
// Get summary stats for outsource stock
router.get('/outsource-stock-stats', async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received
      FROM outsource_stock
    `);

    const data = rows[0];

    const result = {
      total: parseInt(data.total) || 0,
      pending: parseInt(data.pending) || 0,
      accepted: parseInt(data.accepted) || 0,
      received: parseInt(data.received) || 0,
    };

    return sendResponse(res, true, result, 'Outsource stock stats retrieved successfully.');
  } catch (error) {
    console.error('❌ Fetch outsource stock stats error:', error);
    return sendResponse(res, false, null, 'Could not retrieve outsource stock statistics.', 500);
  }
});

// PATCH /api/communication-center/outsource-stock/:id/status
// Update status of an outsource stock item
router.patch('/outsource-stock/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status
const validStatuses = ['awaiting_request', 'requested', 'received', 'cancelled'];
if (!status || !validStatuses.includes(status)) {
  return sendResponse(res, false, null, 'Invalid or missing status.', 400);
}

  // Validate ID
  if (!id) {
  return sendResponse(res, false, null, 'Missing ID.', 400);
}

// Optional: Validate it's a valid format (e.g., OS001 or number)
const isValidId = /^\d+$/.test(id) || /^[A-Z0-9-]+$/.test(id); // Allows numbers or codes like OS001
if (!isValidId) {
  return sendResponse(res, false, null, 'Invalid ID format.', 400);
}

  let connection;
  try {
    connection = await db.promise().getConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT id FROM outsource_stock WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.release();
      return sendResponse(res, false, null, 'Stock item not found.', 404);
    }

    // Update status
    await connection.execute(
      'UPDATE outsource_stock SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    await connection.release();

    return sendResponse(res, true, { id, status }, 'Status updated successfully.', 200);
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Update outsource stock status error:', error);
    return sendResponse(res, false, null, 'Could not update status.', 500);
  }
});

  // ====== EXPORT ======
  module.exports = router;