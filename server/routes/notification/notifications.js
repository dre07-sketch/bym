// routes/notifications.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// Get notifications for a role
router.get('/notifiy/:role', async (req, res) => {
  const { role } = req.params;
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM notifications 
       WHERE FIND_IN_SET(?, receiver_roles) 
       ORDER BY created_at DESC`,
      [role]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/read/:id', async (req, res) => {
  try {
    await db.promise().query(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
