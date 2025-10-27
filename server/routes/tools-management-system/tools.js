// routes/tools.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const events = require('../../utils/events');


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
        t.id,
        t.tool_id,
        t.tool_name,
        t.brand,
        t.category,
        t.quantity,
        t.min_stock,
        t.status,
        t.tool_condition,
        t.cost,
        t.purchase_date,
        t.supplier,
        t.warranty,
        t.notes,
        t.image_url,
        t.document_paths,
        t.created_at,
        t.updated_at,
        COALESCE(SUM(ta.assigned_quantity), 0) AS in_use
      FROM tools t
      LEFT JOIN tool_assignments ta 
        ON t.id = ta.tool_id AND ta.status = 'In Use'
      GROUP BY t.id
      ORDER BY t.tool_name ASC
    `);

    // Add full image URL if image exists
    const processed = tools.map(tool => ({
      ...tool,
      image_url: tool.image_url
        ? `${IMAGE_BASE_URL}/uploads/tools/images/${encodeURIComponent(tool.image_url)}`
        : null
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
      WHERE tool_condition = 'Damaged'
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
    if (qty <= min) {
    events.emit('tool_stock_low', {
      toolId: result.insertId,
      toolName: toolName,
      remaining: qty
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

      if (qty <= min) {
    events.emit('tool_stock_low', {
      toolId: result.insertId,
      toolName: toolName,
      remaining: qty
    });
  }


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
  const { quantity } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid tool ID' });
  }

  if (quantity === undefined || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
    return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
  }

  try {
    // Fetch tool first
    const [[tool]] = await db.promise().execute('SELECT * FROM tools WHERE id = ?', [id]);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    const qty = parseInt(quantity);
    const min = tool.min_stock || 0; // Use min_stock from DB
    const toolName = tool.tool_name; // Adjust field name if different

    // Determine status
    let status;
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= min) status = 'Low Stock';
    else status = 'Available'; // Always Available if enough stock

    // Update tool quantity and status
    await db.promise().execute(
      'UPDATE tools SET quantity = ?, status = ? WHERE id = ?',
      [qty, status, id]
    );

    // Emit event after defining all variables
    if (qty <= min) {
      events.emit('tool_stock_low', {
        toolId: id,
        toolName,
        remaining: qty
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tool quantity and status updated successfully',
      data: {
        id: tool.id,
        tool_id: tool.tool_id,
        quantity: qty,
        status
      }
    });

  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
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
// router.post('/damage', async (req, res) => {
//   const { toolID, notes, reportedBy = 'Unknown' } = req.body;

//   if (!toolID) {
//     return res.status(400).json({
//       success: false,
//       message: 'Tool ID is required.'
//     });
//   }

//   try {
//     // 1. Check if tool exists
//     const [rows] = await db.promise().execute('SELECT * FROM tools WHERE id = ?', [toolID]);
//     const tool = rows[0];

//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Tool not found' });
//     }

//     // 2. Update tool condition/status only (no notes here anymore)
//     await db.promise().execute(
//       `UPDATE tools 
//        SET tool_condition = 'Damaged',
//            status = 'Damaged',
//            updated_at = NOW()
//        WHERE id = ?`,
//       [toolID]
//     );

//     // 3. Insert damage report into tool_damage_reports
//     const damageNote = `[Damage Report] ${notes || 'No details provided'} - ${reportedBy} - ${new Date().toISOString().split('T')[0]}`;
//     await db.promise().execute(
//       `INSERT INTO tool_damage_reports (tool_id, notes, reported_at)
//        VALUES (?, ?, NOW())`,
//       [toolID, damageNote]
//     );

//     // 4. Emit event for real-time notifications or logging
//     events.emit('tool_damaged', {
//       toolId: toolID,
//       toolName: tool.tool_name,
//       reportedBy: reportedBy,
//       reportedByRole: 'mechanic' // can be dynamic
//     });

//     // 5. Log activity in tool_activity_log
//     await db.promise().execute(
//       `INSERT INTO tool_activity_log (type, tool_id, user, message)
//        VALUES ('damage', ?, ?, ?)`,
//       [toolID, reportedBy, `Reported damaged: ${notes || 'No details'}`]
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Tool marked as damaged successfully'
//     });
//   } catch (error) {
//     console.error('Error reporting damage:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to report damage'
//     });
//   }
// });

router.post('/damage', (req, res) => {
  const { toolID, damagedQuantity, damageNotes, reportedBy = 'Unknown' } = req.body;

  if (!toolID || !damagedQuantity || damagedQuantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid toolID or damagedQuantity'
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

      // Lock tool and get details
      connection.query(
        'SELECT id, tool_name, quantity, min_stock FROM tools WHERE id = ? FOR UPDATE',
        [toolID],
        (err, toolRows) => {
          if (err) {
            return rollback(connection, res, 'Error checking tool', err);
          }

          if (toolRows.length === 0) {
            return rollback(connection, res, 'Tool not found');
          }

          const tool = toolRows[0];

          if (tool.quantity < damagedQuantity) {
            return rollback(connection, res, `Only ${tool.quantity} available. Cannot report ${damagedQuantity} as damaged.`);
          }

          // Update tool stock and mark as damaged
          connection.query(
            `UPDATE tools
             SET quantity = quantity - ?,
                 tool_condition = 'Damaged',
                 status = CASE
                            WHEN quantity - ? <= 0 THEN 'Out of Stock'
                            WHEN quantity - ? <= min_stock THEN 'Low Stock'
                            ELSE 'Damaged'
                          END,
                 updated_at = NOW()
             WHERE id = ?`,
            [damagedQuantity, damagedQuantity, damagedQuantity, toolID],
            (err) => {
              if (err) {
                return rollback(connection, res, 'Error updating tool quantity', err);
              }

              // Insert into tool_damage_reports
              connection.query(
                `INSERT INTO tool_damage_reports 
                 (tool_id, reported_by, damaged_quantity, damage_notes, reported_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [toolID, reportedBy, damagedQuantity, damageNotes],
                (err) => {
                  if (err) {
                    return rollback(connection, res, 'Error inserting damage report', err);
                  }

                  // Insert into tool_activity_log
                  connection.query(
                    `INSERT INTO tool_activity_log
                     (type, tool_id, tool_name, user, message)
                     VALUES ('damage', ?, ?, ?, CONCAT('Reported damage: ', ?))`,
                    [toolID, tool.tool_name, reportedBy, damageNotes || 'No details provided'],
                    (err) => {
                      if (err) {
                        return rollback(connection, res, 'Error inserting activity log', err);
                      }
                      events.emit('tool_damaged', {
                        toolId: toolID,
                        toolName: tool.tool_name,
                        reportedBy: reportedBy,
                        reportedByRole: 'mechanic' // This could be dynamic based on the user role
                      });
                      // Commit transaction
                      connection.commit(err => {
                        if (err) {
                          return rollback(connection, res, 'Commit failed', err);
                        }

                        connection.release();
                        res.status(200).json({
                          success: true,
                          message: 'Tool damage reported successfully'
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
    });
  });
});

// Helper rollback function




// POST /api/tools/assign
const rollback = (connection, res, message, error) => {
  connection.rollback(() => {
    connection.release();
    console.error('❌ Transaction failed:', message, error);
    res.status(500).json({ 
      success: false, 
      message: message || 'Transaction failed',
      error: error?.message || 'Unknown error'
    });
  });
};

// Tool Assignment API
router.post('/assign', async (req, res) => {
  const { toolID, ticketID, quantity, assignedBy = 'Unknown' } = req.body;

  // Validate input
  if (!toolID || !ticketID || !quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid toolID, ticketID, or quantity'
    });
  }

  // Get database connection
  db.getConnection(async (err, connection) => {
    if (err) {
      console.error('❌ Error getting DB connection:', err);
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    // Start transaction
    connection.beginTransaction(async (err) => {
      if (err) {
        connection.release();
        console.error('❌ Transaction start error:', err);
        return res.status(500).json({ success: false, message: 'Failed to start transaction' });
      }

      try {
        // 1️⃣ Lock tool row
        const [toolRows] = await connection.promise().query(
          'SELECT id, tool_name, quantity, min_stock FROM tools WHERE id = ? FOR UPDATE',
          [toolID]
        );
        if (toolRows.length === 0) throw new Error('Tool not found');
        const tool = toolRows[0];

        if (tool.quantity < quantity) {
          throw new Error(`Only ${tool.quantity} available. Cannot assign ${quantity}.`);
        }

        // 2️⃣ Get ticket number
        const [ticketRows] = await connection.promise().query(
          'SELECT ticket_number FROM service_tickets WHERE id = ?',
          [ticketID]
        );
        if (ticketRows.length === 0) throw new Error('Service ticket not found');
        const ticketNumber = ticketRows[0].ticket_number;

        // 3️⃣ Update tool stock
        await connection.promise().query(
          `UPDATE tools 
           SET quantity = quantity - ?, 
               status = CASE 
                          WHEN quantity - ? <= 0 THEN 'Out of Stock'
                          WHEN quantity - ? <= min_stock THEN 'Low Stock'
                          ELSE 'Available'
                        END,
               updated_at = NOW()
           WHERE id = ?`,
          [quantity, quantity, quantity, toolID]
        );

        // 4️⃣ Insert tool assignment
        const [assignmentResult] = await connection.promise().query(
          `INSERT INTO tool_assignments 
           (tool_id, tool_name, ticket_id, ticket_number, assigned_quantity, assigned_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [toolID, tool.tool_name, ticketID, ticketNumber, quantity, assignedBy]
        );

        // 5️⃣ Insert activity log
        await connection.promise().query(
          `INSERT INTO tool_activity_log 
           (type, tool_id, tool_name, ticket_id, ticket_number, user, message)
           VALUES ('assignment', ?, ?, ?, ?, ?, CONCAT('Tool assigned by ', ?))`,
          [toolID, tool.tool_name, ticketID, ticketNumber, assignedBy, assignedBy]
        );

        // 6️⃣ Commit transaction
        await connection.promise().commit();
        connection.release();

        // 7️⃣ Emit event AFTER commit
        events.emit('tool_assigned', {
          toolId: toolID,
          toolName: tool.tool_name,
          ticketId: ticketID,
          ticketNumber,
          assignmentId: assignmentResult.insertId,
          assignedBy,
          quantity
        });

        // 8️⃣ Send response
        res.status(200).json({ 
          success: true, 
          message: 'Tool assigned successfully',
          assignmentId: assignmentResult.insertId
        });

      } catch (err) {
        rollback(connection, res, err.message, err);
      }
    });
  });
});
// // helper
// function rollback(connection, res, message, err = null) {
//   connection.rollback(() => {
//     connection.release();
//     if (err) console.error(message, err);
//     res.status(400).json({ success: false, message });
//   });
// }



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

router.put('/update-quantity/:id', (req, res) => {
  const toolId = req.params.id;
  const { quantity, purchaseDate } = req.body;

  if (quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Quantity is required' });
  }

  // Step 1: Check if tool exists
  db.query('SELECT * FROM tools WHERE id = ?', [toolId], (err, results) => {
    if (err) {
      console.error('Database error (select):', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    const existingTool = results[0];
    const finalPurchaseDate = purchaseDate || existingTool.purchase_date;

    // Step 2: Update quantity & purchase date
    db.query(
      `UPDATE tools 
       SET quantity = ?, 
           purchase_date = ?, 
           updated_at = NOW()
       WHERE id = ?`,
      [quantity, finalPurchaseDate, toolId],
      (updateErr, updateResult) => {
        if (updateErr) {
          console.error('Database error (update):', updateErr);
          return res.status(500).json({ success: false, message: 'Error updating tool' });
        }

        return res.status(200).json({
          success: true,
          message: 'Tool updated successfully',
        });
      }
    );
  });
});


module.exports = router;