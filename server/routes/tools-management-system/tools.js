// routes/tools.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const IMAGE_BASE_URL = "https://ipasystem.bymsystem.com";
// Ensure upload directories exist
const imagesDir = path.join(__dirname, '../../uploads/tools/images');
const docsDir = path.join(__dirname, '../../uploads/tools/documents');

[imagesDir, docsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer config for multiple fields
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'imagePath') {
      cb(null, imagesDir);
    } else if (file.fieldname === 'documents') {
      cb(null, docsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'imagePath' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for tool image.'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'imagePath', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

// GET /api/tools/categories
router.get('/categories', async (req, res) => {
  try {
    const validCategories = [
      'Power Tools',
      'Hand Tools',
      'Measuring Instruments',
      'Safety Equipment',
      'Diagnostic Tools',
      'Pneumatic Tools',
      'Welding Equipment',
      'General'
    ];

    res.status(200).json({
      success: true,
      data: validCategories
    });
  } catch (error) {
    console.error('Error fetching tool categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/tools
router.get('/tools-get', async (req, res) => {
  try {
    const [tools] = await db.promise().execute(`
      SELECT 
        t.*,
        COALESCE(SUM(ta.assigned_quantity), 0) AS in_use
      FROM tools t
      LEFT JOIN tool_assignments ta ON t.id = ta.tool_id AND ta.status = 'In Use'
      GROUP BY t.id
    `);
    // Process tools to add image URL
    const processed = tools.map(tool => ({
      ...tool,
      image_url: tool.image_url
        ? `${IMAGE_BASE_URL}/uploads/tools/images/${encodeURIComponent(tool.image_url)}`
        : null  // Changed from imageUrl to image_url
    }));
    res.json({
      success: true,
      data: processed
    });
  } catch (error) {
    console.error("❌ Error fetching tools:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch tools' });
  }
});


// GET /api/tools/stats
// GET /api/tools/stats
router.get('/stats', async (req, res) => {
  try {
    // 1. Total & Available Tools
    const [rows] = await db.promise().execute(`
      SELECT 
        SUM(quantity) AS totalQuantity,
        COUNT(*) AS totalTools
      FROM tools
    `);

    const totalQuantity = rows[0]?.totalQuantity || 0;

    // 2. Tools In Use
    const [inUseRows] = await db.promise().execute(`
      SELECT 
        COALESCE(SUM(assigned_quantity), 0) AS toolsInUse
      FROM tool_assignments
      WHERE status = 'In Use'
    `);

    const toolsInUse = inUseRows[0]?.toolsInUse || 0;

    // 3. Available Tools
    const availableTools = totalQuantity - toolsInUse;

    // 4. Damaged Tools
    const [damagedRows] = await db.promise().execute(`
      SELECT COUNT(*) AS damagedCount 
      FROM tools 
      WHERE status = 'Damaged' OR tool_condition = 'Damaged'
    `);
    const damagedTools = damagedRows[0]?.damagedCount || 0;

    // 5. Returned Tools (all time)
    const [returnedRows] = await db.promise().execute(`
      SELECT COUNT(*) AS returnedCount 
      FROM tool_assignments
      WHERE status = 'Returned'
    `);
    const returnedTools = returnedRows[0]?.returnedCount || 0;

    // 6. Returned Today
    const [returnedTodayRows] = await db.promise().execute(`
      SELECT COUNT(*) AS returnedTodayCount 
      FROM tool_assignments
      WHERE status = 'Returned'
        AND DATE(returned_at) = CURDATE()
    `);
    const returnedToday = returnedTodayRows[0]?.returnedTodayCount || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalTools: parseInt(rows[0]?.totalTools) || 0,
        totalQuantity,
        toolsInUse: parseInt(toolsInUse),
        availableTools: Math.max(0, availableTools),
        damagedTools,
        returnedTools,
        returnedToday
      }
    });
  } catch (error) {
    console.error('Error fetching tool stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
});




// POST /api/tools/return
// Returns assigned tools and restores quantity
router.post('/return', async (req, res) => {
  const { assignmentId, toolId, toolID, quantity, returnedBy = 'Unknown' } = req.body;

  if (!assignmentId && !toolId && !toolID) {
  return res.status(400).json({
    success: false,
    message: 'Either assignmentId or toolId is required'
  });
}

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Get assignment
    const [[assignment]] = await connection.execute(
      'SELECT * FROM tool_assignments WHERE id = ? AND status = "In Use"',
      [assignmentId]
    );

    if (!assignment) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Assignment not found or already returned' });
    }

    // Update tool quantity
    await connection.execute(
      `UPDATE tools 
       SET quantity = quantity + ?, 
           status = CASE 
                      WHEN quantity + ? > min_stock THEN 'Available'
                      ELSE 'Low Stock'
                    END
       WHERE id = ?`,
      [quantity, quantity, assignment.tool_id]
    );

    // Mark assignment as returned
    await connection.execute(
      `UPDATE tool_assignments 
       SET status = 'Returned', 
           returned_at = NOW(), 
           updated_at = NOW() 
       WHERE id = ?`,
      [assignmentId]
    );

    await connection.execute(
  `INSERT INTO tool_activity_log (type, tool_id, ticket_id, user, message)
   VALUES ('return', ?, ?, ?, CONCAT('Tool returned by ', ?))`,
  [assignment.tool_id, assignment.ticket_id, returnedBy, returnedBy]
);

    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Tools returned successfully'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(console.error);
      connection.release();
    }
    console.error('Error returning tool:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during return'
    });
  }
});

// GET /api/tools/history/:ticketId
// GET /api/tools/history/by-ticket-number/:ticketNumber
// 📌 GET /api/tools/returned/:ticketNumber
// 📌 GET /api/tools/returned/:ticketNumber
router.get("/returned-tools", (req, res) => {
  const query = `
    SELECT 
      ta.id,
      ta.tool_id,
      ta.tool_name,
      ta.ticket_id,
      ta.ticket_number,
      ta.assigned_quantity,
      ta.assigned_by,
      ta.status,
      ta.assigned_at,
      ta.returned_at,
      ta.updated_at,
      st.customer_name,
      ma.mechanic_name AS mechanicName  -- ✅ fetch from mechanic_assignments
    FROM tool_assignments ta
    JOIN service_tickets st 
      ON ta.ticket_number = st.ticket_number
    LEFT JOIN mechanic_assignments ma
      ON st.ticket_number = ma.ticket_number
    WHERE ta.status = 'Returned'
    ORDER BY ta.returned_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching returned tools:", err);
      return res.status(500).json({ error: "Failed to fetch returned tools" });
    }
    res.json(results);
  });
});






// POST /api/tools
router.post('/tools-post', async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }

    const {
      toolName,
      brand,
      category,
      quantity,
      minStock,
      condition,
      cost,
      purchaseDate,
      supplier,
      warranty,
      notes
    } = req.body;

    // Validation
    if (!toolName || !quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Tool Name and valid Quantity are required.'
      });
    }

    const validCategories = [
      'Power Tools', 'Hand Tools', 'Measuring Instruments',
      'Safety Equipment', 'Diagnostic Tools', 'Pneumatic Tools',
      'Welding Equipment', 'General'
    ];
    const finalCategory = validCategories.includes(category) ? category : 'General';

    const qty = parseInt(quantity);
    const min = minStock ? parseInt(minStock) : 0;
    const price = cost ? parseFloat(cost) : null;

    if (isNaN(min) || min < 0) {
      return res.status(400).json({ success: false, message: 'Invalid minimum stock level' });
    }
    if (price !== null && isNaN(price)) {
      return res.status(400).json({ success: false, message: 'Invalid cost value' });
    }

    // Generate tool_id: TOL + 6-digit number
    const [rows] = await db.promise().execute(
      "SELECT MAX(CAST(SUBSTRING(tool_id, 4) AS UNSIGNED)) AS max_id FROM tools"
    );
    const nextNum = (rows[0]?.max_id || 0) + 1;
    const toolId = `TOL${String(nextNum).padStart(6, '0')}`;

    // File paths
    const imageUrl = req.files?.imagePath?.[0]
      ? `/uploads/tools/images/${req.files.imagePath[0].filename}`
      : null;

    const documentPaths = req.files?.documents?.map(f => `/uploads/tools/documents/${f.filename}`) || [];
    const documentPathsJson = JSON.stringify(documentPaths);

    // Default status
    let status = 'Available';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= min) status = 'Low Stock';

    const sql = `
      INSERT INTO tools (
        tool_id, tool_name, brand, category, quantity, min_stock,
        status, tool_condition, cost, purchase_date, supplier,
        warranty, notes, image_url, document_paths
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      toolId,
      toolName.trim(),
      brand || null,
      finalCategory,
      qty,
      min,
      status,
      condition || 'Good',
      price,
      purchaseDate || null,
      supplier || null,
      warranty || null,
      notes || null,
      imageUrl,
      documentPathsJson
    ];

    try {
      const [result] = await db.promise().execute(sql, values);

      res.status(201).json({
        success: true,
        message: 'Tool added successfully',
        data: {
          id: result.insertId,
          toolId,
          name: toolName,
          brand: brand || null,
          category: finalCategory,
          quantity: qty,
          minStock: min,
          status,
          condition: condition || 'Good',
          cost: price,
          purchaseDate: purchaseDate || null,
          supplier: supplier || null,
          warranty: warranty || null,
          notes: notes || null,
          imageUrl,
          documentPaths,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Tool ID or name already exists' });
      }
      console.error('Database error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});


// GET /api/tools/recent-activity
router.get('/recent-activity', async (req, res) => {
  try {
    const query = `
      SELECT 
        id AS activityId,
        type,
        message,
        user,
        created_at AS time,
        CASE 
          WHEN type = 'assignment' THEN 'info'
          WHEN type = 'return' THEN 'success'
          WHEN type = 'check-in' THEN 'warning'
          WHEN type = 'damage' THEN 'error'
        END AS status
      FROM tool_activity_log
      ORDER BY created_at DESC
      LIMIT 20
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching recent activity:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch recent activity'
        });
      }

      const formatted = results.map(item => ({
        ...item,
        time: new Date(item.time).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      res.status(200).json({
        success: true,
        data: formatted
      });
    });
  } catch (error) {
    console.error('Server error in /recent-activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// PUT /api/tools/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid tool ID' });
  }

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }

    const {
      toolName,
      brand,
      category,
      quantity,
      minStock,
      condition,
      cost,
      purchaseDate,
      supplier,
      warranty,
      notes
    } = req.body;

    if (!toolName || !quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tool Name and valid Quantity are required.'
      });
    }

    const validCategories = [
      'Power Tools', 'Hand Tools', 'Measuring Instruments',
      'Safety Equipment', 'Diagnostic Tools', 'Pneumatic Tools',
      'Welding Equipment', 'General'
    ];
    const finalCategory = validCategories.includes(category) ? category : 'General';

    const qty = parseInt(quantity);
    const min = minStock ? parseInt(minStock) : 0;
    const price = cost ? parseFloat(cost) : null;

    if (isNaN(min) || min < 0) {
      return res.status(400).json({ success: false, message: 'Invalid minimum stock level' });
    }
    if (price !== null && isNaN(price)) {
      return res.status(400).json({ success: false, message: 'Invalid cost value' });
    }

    try {
      const [[tool]] = await db.promise().execute('SELECT * FROM tools WHERE id = ?', [id]);
      if (!tool) {
        return res.status(404).json({ success: false, message: 'Tool not found' });
      }

      const imageUrl = req.files?.imagePath?.[0]
        ? `/uploads/tools/images/${req.files.imagePath[0].filename}`
        : tool.image_url;

      const oldImage = req.files?.imagePath?.[0] && tool.image_url;
      if (oldImage) {
        const fullPath = path.join(__dirname, '..', '..', '..', tool.image_url);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }

      const existingDocs = tool.document_paths ? JSON.parse(tool.document_paths) : [];
      const newDocs = req.files?.documents?.map(f => `/uploads/tools/documents/${f.filename}`) || [];
      const documentPaths = [...existingDocs, ...newDocs];
      const documentPathsJson = JSON.stringify(documentPaths);

      let status = tool.status;
      if (qty === 0) status = 'Out of Stock';
      else if (qty <= min) status = 'Low Stock';
      else if (status === 'Out of Stock' || status === 'Low Stock') status = 'Available';

      const sql = `
        UPDATE tools SET
          tool_name = ?, brand = ?, category = ?, quantity = ?, min_stock = ?,
          status = ?, tool_condition = ?, cost = ?, purchase_date = ?,
          supplier = ?, warranty = ?, notes = ?, image_url = ?, document_paths = ?
        WHERE id = ?
      `;

      const values = [
        toolName.trim(),
        brand || null,
        finalCategory,
        qty,
        min,
        status,
        condition || 'Good',
        price,
        purchaseDate || null,
        supplier || null,
        warranty || null,
        notes || null,
        imageUrl,
        documentPathsJson,
        id
      ];

      await db.promise().execute(sql, values);

      res.status(200).json({
        success: true,
        message: 'Tool updated successfully',
        data: {
          id,
          toolId: tool.tool_id,
          name: toolName,
          brand: brand || null,
          category: finalCategory,
          quantity: qty,
          minStock: min,
          status,
          condition: condition || 'Good',
          cost: price,
          purchaseDate: purchaseDate || null,
          supplier: supplier || null,
          warranty: warranty || null,
          notes: notes || null,
          imageUrl,
          documentPaths,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating tool:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

// DELETE /api/tools/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid tool ID' });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 1. Check if tool exists
    const [rows] = await connection.execute(
      'SELECT tool_name, image_url, document_paths FROM tools WHERE id = ?', 
      [id]
    );
    const tool = rows[0];
    if (!tool) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    // 2. Delete related activity logs
    await connection.execute('DELETE FROM tool_activity_log WHERE tool_id = ?', [id]);

    // 3. Delete image file
    if (tool.image_url) {
      const imagePath = path.join(__dirname, '..', '..', '..', tool.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // 4. Delete document files
    if (tool.document_paths) {
      const docs = JSON.parse(tool.document_paths);
      docs.forEach(filePath => {
        const docPath = path.join(__dirname, '..', '..', '..', filePath);
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
        }
      });
    }

    // 5. Delete the tool
    await connection.execute('DELETE FROM tools WHERE id = ?', [id]);

    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: `Tool "${tool.tool_name}" deleted successfully`
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(console.error);
      connection.release();
    }
    console.error('Error deleting tool:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: Cannot delete tool due to linked data'
    });
  }
});





// GET /api/tools/reports/summary
router.get('/reports/summary', async (req, res) => {
  try {
    const [[total]] = await db.promise().execute(
      'SELECT COUNT(*) as count, SUM(quantity) as totalQty FROM tools'
    );
    const [[lowStock]] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM tools WHERE quantity <= min_stock AND quantity > 0'
    );
    const [[outOfStock]] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM tools WHERE quantity = 0'
    );
    const [[underMaintenance]] = await db.promise().execute(
      'SELECT COUNT(*) as count FROM tools WHERE status = "Under Maintenance"'
    );

    res.status(200).json({
      success: true,
      data: {
        totalTools: total.count,
        totalQuantity: total.totalQty || 0,
        lowStock: lowStock.count,
        outOfStock: outOfStock.count,
        underMaintenance: underMaintenance.count
      }
    });
  } catch (error) {
    console.error('Error fetching tool summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/tools/reports/category-distribution
router.get('/reports/category-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT category, COUNT(*) as count, SUM(quantity) as quantity
      FROM tools
      GROUP BY category
      ORDER BY count DESC
    `;
    const [rows] = await db.promise().execute(sql);

    res.status(200).json({
      success: true,
      data: rows.map(r => ({
        category: r.category,
        count: r.count,
        quantity: r.quantity
      }))
    });
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET /api/tools/assigned
// GET /api/tools/assigned?ticketId=123
router.get('/assigned', async (req, res) => {
  const { ticketId, ticketNumber } = req.query;

  let sql = `
    SELECT 
      ta.id AS assignmentId,
      ta.tool_id,
      ta.assigned_quantity AS assignedQuantity,
      ta.status,
      ta.assigned_at,
      ta.ticket_id,
      t.tool_name,
      t.brand,
      t.category
    FROM tool_assignments ta
    JOIN tools t ON ta.tool_id = t.id
    WHERE ta.status = 'In Use'
  `;

  const params = [];

  if (ticketId) {
    sql += ' AND ta.ticket_id = ?';
    params.push(ticketId);
  }

  if (ticketNumber) {
    sql += ' AND ta.ticket_id = (SELECT id FROM service_tickets WHERE ticket_number = ?)';
    params.push(ticketNumber);
  }

  sql += ' ORDER BY ta.assigned_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching assigned tools:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    res.status(200).json({
      success: true,
      data: results
    });
  });
});


// POST /api/tools/check-in
router.post('/check-in', async (req, res) => {
  const { toolID, quantity, condition, notes } = req.body;

  if (!toolID || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Tool ID and valid quantity are required.',
    });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const [[tool]] = await connection.execute(
      'SELECT * FROM tools WHERE id = ? FOR UPDATE',
      [toolID]
    );

    if (!tool) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    const newQuantity = tool.quantity + quantity;

    await connection.execute(
      `UPDATE tools SET 
         quantity = ?, 
         tool_condition = ?, 
         status = CASE 
                    WHEN ? > min_stock THEN 'Available'
                    WHEN ? > 0 THEN 'Low Stock'
                    ELSE 'Out of Stock'
                  END,
         updated_at = NOW()
       WHERE id = ?`,
      [newQuantity, condition || tool.tool_condition, newQuantity, newQuantity, toolID]
    );

    if (notes) {
      await connection.execute(
        `UPDATE tools SET notes = CONCAT(COALESCE(notes, ''), '\n[Check-in] ${notes} - ${new Date().toISOString().split('T')[0]}') WHERE id = ?`,
        [toolID]
      );
    }

    await connection.execute(
  `INSERT INTO tool_activity_log (type, tool_id, user, message)
   VALUES ('check-in', ?, ?, CONCAT('Tool checked in: +', ?, ' units by ', ?))`,
  [toolID, req.body.checkedInBy || 'System', quantity, req.body.checkedInBy || 'System']
  );


    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: 'Tool checked in successfully' });
  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('Error in check-in:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// POST /api/tools/damage
// Report a tool as damaged
// POST /api/tools/damage
router.post('/damage', async (req, res) => {
  const { toolID, notes, reportedBy = 'Unknown' } = req.body;

  if (!toolID) {
    return res.status(400).json({
      success: false,
      message: 'Tool ID is required.'
    });
  }

  try {
    // Check if tool exists
    const [rows] = await db.promise().execute('SELECT * FROM tools WHERE id = ?', [toolID]);
    const tool = rows[0];

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    // Update tool as damaged
    await db.promise().execute(
      `UPDATE tools 
       SET tool_condition = 'Damaged',
           status = 'Damaged',
           notes = CONCAT(COALESCE(notes, ''), ?),
           updated_at = NOW()
       WHERE id = ?`,
      [
        `\n[Damage Report] ${notes || 'No details provided'} - ${reportedBy} - ${new Date().toISOString().split('T')[0]}`,
        toolID
      ]
    );

   
     await db.promise().execute(
       `INSERT INTO tool_activity_log (type, tool_id, user, message) 
        VALUES ('damage', ?, ?, ?)`,
       [toolID, reportedBy, `Reported damaged: ${notes || 'No details'}`]
     );

    return res.status(200).json({
      success: true,
      message: 'Tool marked as damaged successfully'
    });
  } catch (error) {
    console.error('Error reporting damage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report damage'
    });
  }
});


// POST /api/tools/assign
router.post('/assign', (req, res) => {
  const { toolID, ticketID, quantity, assignedBy = 'Unknown' } = req.body;

  if (!toolID || !ticketID || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid toolID, ticketID, or quantity'
    });
  }

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting DB connection:', err);
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error('Transaction start error:', err);
        return res.status(500).json({ success: false, message: 'Failed to start transaction' });
      }

      // Lock tool row and get tool_name
      connection.query(
        'SELECT id, tool_name, quantity FROM tools WHERE id = ? FOR UPDATE',
        [toolID],
        (err, toolRows) => {
          if (err) {
            return rollback(connection, res, 'Error checking tool', err);
          }

          if (toolRows.length === 0) {
            return rollback(connection, res, 'Tool not found');
          }

          const tool = toolRows[0];
          if (tool.quantity < quantity) {
            return rollback(connection, res, `Only ${tool.quantity} available. Cannot assign ${quantity}.`);
          }

          // Get ticket_number
          connection.query(
            'SELECT ticket_number FROM service_tickets WHERE id = ?',
            [ticketID],
            (err, ticketRows) => {
              if (err) {
                return rollback(connection, res, 'Error fetching ticket', err);
              }
              if (ticketRows.length === 0) {
                return rollback(connection, res, 'Service ticket not found');
              }

              const ticketNumber = ticketRows[0].ticket_number;

              // Update tool stock
              connection.query(
                `UPDATE tools 
                 SET quantity = quantity - ?, 
                     status = CASE 
                                WHEN quantity - ? <= 0 THEN 'Out of Stock'
                                WHEN quantity - ? <= min_stock THEN 'Low Stock'
                                ELSE 'Available'
                              END,
                     updated_at = NOW()
                 WHERE id = ?`,
                [quantity, quantity, quantity, toolID],
                (err) => {
                  if (err) {
                    return rollback(connection, res, 'Error updating tool quantity', err);
                  }

                  // Insert tool assignment with tool_name
                  connection.query(
                    `INSERT INTO tool_assignments 
                     (tool_id, tool_name, ticket_id, ticket_number, assigned_quantity, assigned_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [toolID, tool.tool_name, ticketID, ticketNumber, quantity, assignedBy],
                    (err) => {
                      if (err) {
                        return rollback(connection, res, 'Error inserting assignment', err);
                      }

                      // Insert activity log with tool_name
                      connection.query(
                        `INSERT INTO tool_activity_log 
                         (type, tool_id, tool_name, ticket_id, ticket_number, user, message)
                         VALUES ('assignment', ?, ?, ?, ?, ?, CONCAT('Tool assigned by ', ?))`,
                        [toolID, tool.tool_name, ticketID, ticketNumber, assignedBy, assignedBy],
                        (err) => {
                          if (err) {
                            return rollback(connection, res, 'Error inserting log', err);
                          }

                          // Commit transaction
                          connection.commit(err => {
                            if (err) {
                              return rollback(connection, res, 'Commit failed', err);
                            }

                            connection.release();
                            res.status(200).json({
                              success: true,
                              message: 'Tool assigned successfully'
                            });
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

// helper
function rollback(connection, res, message, err = null) {
  connection.rollback(() => {
    connection.release();
    if (err) console.error(message, err);
    res.status(400).json({ success: false, message });
  });
}



// GET /api/tools/tickets/in-progress
router.get('/tickets/in-progress', async (req, res) => {
  console.log('✅ /api/tools/tickets/in-progress - Request received'); // LOG

  const query = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_name,
      st.license_plate,
      st.title,
      st.description,
      st.priority,
      st.status,
      st.technician,
      st.created_at,
      st.vehicle_info,
      COALESCE(ic.phone, cc.phone) AS customer_phone,
      COALESCE(ic.email, cc.email) AS customer_email
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    WHERE st.status IN ('in-progress', 'assigned', 'pending', 'open', 'active')
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ SQL Error:', err); // LOG ERROR
      return res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
    }

    console.log('📊 Query Results:', results); // LOG RESULTS

    const parsedResults = results.map(ticket => {
      let vehicleInfo = ticket.vehicle_info;
      if (typeof vehicleInfo === 'string') {
        try {
          vehicleInfo = JSON.parse(vehicleInfo);
        } catch (e) {
          console.warn('⚠️ Failed to parse vehicle_info:', vehicleInfo);
          vehicleInfo = {};
        }
      }
      return { ...ticket, vehicle_info: vehicleInfo };
    });

    console.log('✅ Sending:', parsedResults);
    res.json(parsedResults);
  });
});

// GET /api/tools/service_tickets?status=in-progress
router.get('/service_tickets', (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT 
      st.*,
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
  `;

  const params = [];

  if (status) {
    // Support multiple values via comma
    const statuses = Array.isArray(status) ? status : status.split(',');
    query += ' WHERE st.status IN (' + statuses.map(() => '?').join(',') + ')';
    params.push(...statuses);
  } else {
    // Default: only in-progress
    query += ' WHERE st.status = ?';
    params.push('in-progress');
  }

  query += ' ORDER BY st.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching service tickets:', err);
      return res.status(500).json({ 
        message: 'Database query error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    // Parse vehicle_info safely
    const parsedResults = results.map(ticket => {
      let vehicle_info = ticket.vehicle_info;
      if (typeof vehicle_info === 'string') {
        try {
          vehicle_info = JSON.parse(vehicle_info);
        } catch (e) {
          vehicle_info = {};
        }
      }
      return { ...ticket, vehicle_info };
    });

    res.json(parsedResults);
  });
});


module.exports = router;