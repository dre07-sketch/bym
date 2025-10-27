// routes/marketing-activity.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const imagesDir = path.join(__dirname, '../../uploads/marketing/images');
const docsDir = path.join(__dirname, '../../uploads/marketing/documents');

[imagesDir, docsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer config for file uploads (if needed later)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, imagesDir);
    } else if (file.fieldname === 'documents') {
      cb(null, docsDir);
    } else {
      cb(null, imagesDir); // default
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
    if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
}).any(); // Accept any fields (flexible for future)

// GET /api/marketing-activities
// Fetch all marketing activities with contacts
router.get('/get-activities', async (req, res) => {
  try {
    const { employeeName } = req.query; // 👈 read employee name from query

    if (!employeeName) {
      return res.status(400).json({
        success: false,
        message: 'Employee name is required in query parameters.'
      });
    }

    const query = `
      SELECT 
        ma.id,
        ma.employee_name,
        ma.date,
        ma.activities,
        ma.location,
        ma.follow_up_required,
        ma.follow_up_date,
        ma.follow_up_notes,
        ma.status,
        ma.created_at,
        ma.updated_at,
        mac.id AS contact_id,
        mac.name AS contact_name,
        mac.phone AS contact_phone,
        mac.address AS contact_address,
        mac.company AS contact_company,
        mac.email AS contact_email
      FROM marketing_activities ma
      LEFT JOIN marketing_activity_contacts mac 
        ON ma.id = mac.marketing_activity_id
      WHERE ma.employee_name = ?    -- 👈 filter by employeeName
      ORDER BY ma.date DESC, mac.id
    `;

    const [rows] = await db.promise().execute(query, [employeeName]);

    const activitiesMap = {};

    rows.forEach(row => {
      if (!activitiesMap[row.id]) {
        activitiesMap[row.id] = {
          id: row.id,
          employeeName: row.employee_name,
          date: row.date ? row.date.toISOString().split('T')[0] : null,
          activities: row.activities,
          location: row.location,
          followUpRequired: Boolean(row.follow_up_required),
          followUpDate: row.follow_up_date
            ? row.follow_up_date.toISOString().split('T')[0]
            : null,
          followUpNotes: row.follow_up_notes,
          status: row.status || 'completed',
          contacts: [],
          createdAt: row.created_at ? row.created_at.toISOString() : null,
          updatedAt: row.updated_at ? row.updated_at.toISOString() : null
        };
      }

      if (row.contact_id) {
        activitiesMap[row.id].contacts.push({
          id: row.contact_id,
          name: row.contact_name,
          phone: row.contact_phone,
          address: row.contact_address,
          company: row.contact_company,
          email: row.contact_email
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(activitiesMap)
    });
  } catch (error) {
    console.error('❌ Error fetching marketing activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch marketing activities'
    });
  }
});



// GET /api/marketing-activities/:id
// Get single marketing activity by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  try {
    const [rows] = await db.promise().execute(`
      SELECT 
        ma.*,
        mac.id AS contact_id,
        mac.name,
        mac.phone,
        mac.address,
        mac.company,
        mac.email
      FROM marketing_activities ma
      LEFT JOIN marketing_activity_contacts mac ON ma.id = mac.marketing_activity_id
      WHERE ma.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    if (!activities[row.id]) {
  activities[row.id] = {
    id: row.id,
    date: row.date.toISOString().split('T')[0],
    activities: row.activities,
    location: row.location,
    followUpRequired: Boolean(row.follow_up_required),
    followUpDate: row.follow_up_date ? row.follow_up_date.toISOString().split('T')[0] : null,
    followUpNotes: row.follow_up_notes,
    status: row.status || 'completed', // ✅ Add this line
    contacts: [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

    rows.forEach(row => {
      if (row.contact_id) {
        activity.contacts.push({
          id: row.contact_id,
          name: row.name,
          phone: row.phone,
          address: row.address,
          company: row.company,
          email: row.email
        });
      }
    });

    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/marketing-activities
// Log a new marketing activity (with contacts)
router.post('/activity-post', upload, async (req, res) => {
  const {
    employeeName, // 👈 added field
    date,
    activities,
    location,
    contacts = [],
    followUpRequired = false,
    followUpDate,
    followUpNotes,
    status = 'completed'
  } = req.body;

  // Validation
  if (!employeeName || !date || !activities || !location) {
    return res.status(400).json({
      success: false,
      message: 'Employee name, date, activities, and location are required.'
    });
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one contact is required.'
    });
  }

  // Validate each contact
  for (const c of contacts) {
    if (!c.name || !c.phone || !c.address) {
      return res.status(400).json({
        success: false,
        message: 'Each contact must have name, phone, and address.'
      });
    }
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 🧱 Insert main activity (with employee name)
    const [result] = await connection.execute(
      `INSERT INTO marketing_activities 
        (employee_name, date, activities, location, follow_up_required, follow_up_date, follow_up_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeName,
        date,
        activities,
        location,
        Boolean(followUpRequired),
        followUpDate || null,
        followUpNotes || null,
        status
      ]
    );

    const activityId = result.insertId;

    // 🧩 Insert contacts
    const contactPromises = contacts.map(contact => {
      return connection.execute(
        `INSERT INTO marketing_activity_contacts 
          (marketing_activity_id, name, phone, address, company, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          activityId,
          contact.name,
          contact.phone,
          contact.address,
          contact.company || null,
          contact.email || null
        ]
      );
    });

    await Promise.all(contactPromises);

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Marketing activity logged successfully.',
      data: { id: activityId, ...req.body }
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('Error creating marketing activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log marketing activity.'
    });
  } finally {
    if (connection) connection.release();
  }
});


// PUT /api/marketing-activities/:id
// Update existing marketing activity
router.put('/:id', upload, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const {
    date,
    activities,
    location,
    contacts = [],
    followUpRequired = false,
    followUpDate,
    followUpNotes
  } = req.body;

  if (!date || !activities || !location) {
    return res.status(400).json({
      success: false,
      message: 'Date, activities, and location are required.'
    });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Check if activity exists
    const [[existing]] = await connection.execute(
      'SELECT * FROM marketing_activities WHERE id = ?', [id]
    );
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    // Update main activity
    await connection.execute(
  `UPDATE marketing_activities 
   SET date = ?, 
       activities = ?, 
       location = ?,
       follow_up_required = ?, 
       follow_up_date = ?, 
       follow_up_notes = ?,
       status = ?  -- ← Add this
   WHERE id = ?`,
  [
    date,
    activities,
    location,
    Boolean(followUpRequired),
    followUpDate || null,
    followUpNotes || null,
    req.body.status || 'completed', // ← Use from body
    id
  ]
);

    // Delete old contacts
    await connection.execute(
      'DELETE FROM marketing_activity_contacts WHERE marketing_activity_id = ?', [id]
    );

    // Insert updated contacts
    if (contacts.length > 0) {
      const contactPromises = contacts.map(c =>
        connection.execute(
          `INSERT INTO marketing_activity_contacts 
           (marketing_activity_id, name, phone, address, company, email)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            c.name,
            c.phone,
            c.address,
            c.company || null,
            c.email || null
          ]
        )
      );
      await Promise.all(contactPromises);
    }

    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Marketing activity updated successfully.'
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('Error updating marketing activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update marketing activity.'
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/marketing-activities/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Check if exists
    const [rows] = await connection.execute(
      'SELECT id FROM marketing_activities WHERE id = ?', [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    // Delete contacts (cascade would do this, but explicit is safe)
    await connection.execute(
      'DELETE FROM marketing_activity_contacts WHERE marketing_activity_id = ?', [id]
    );

    // Delete main activity
    await connection.execute('DELETE FROM marketing_activities WHERE id = ?', [id]);

    await connection.commit();
    connection.release();

    return res.status(200).json({
      success: true,
      message: 'Marketing activity deleted successfully.'
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(console.error);
    console.error('Error deleting activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete marketing activity.'
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/marketing-activities/stats
// Summary stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const [[total]] = await db.promise().execute(
      'SELECT COUNT(*) AS count FROM marketing_activities'
    );
    const [[followUpCount]] = await db.promise().execute(
      'SELECT COUNT(*) AS count FROM marketing_activities WHERE follow_up_required = 1 AND (follow_up_date IS NULL OR follow_up_date >= CURDATE())'
    );
    const [[today]] = await db.promise().execute(
      'SELECT COUNT(*) AS count FROM marketing_activities WHERE date = CURDATE()'
    );

    const [[awaitingFollowUp]] = await db.promise().execute(
  'SELECT COUNT(*) AS count FROM marketing_activities WHERE status = "awaiting-follow-up"'
);

    return res.status(200).json({
      success: true,
      data: {
        totalActivities: total.count,
        todayActivities: today.count,
        pendingFollowUps: followUpCount.count
      }
    });
  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// GET /api/marketing-activities/recent
// Recent 10 activities
router.get('/recent', async (req, res) => {
  try {
    const query = `
      SELECT id, date, activities, location, follow_up_required AS followUpRequired, follow_up_date AS followUpDate, status
    `;
    const [rows] = await db.promise().execute(query);

    const data = rows.map(row => ({
      ...row,
      date: row.date.toISOString().split('T')[0],
      followUpDate: row.followUpDate ? row.followUpDate.toISOString().split('T')[0] : null
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;