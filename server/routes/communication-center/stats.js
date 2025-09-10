// routes/communication-center/stats.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// Helper: Send JSON response
const sendResponse = (res, success, data = null, message = '', status = 200) => {
  return res.status(status).json({ success, data, message });
};

// GET /api/communication-center/stats
// Fetch proforma invoice statistics
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

module.exports = router;