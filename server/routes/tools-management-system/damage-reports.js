// routes/damage-reports.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * GET /api/damage-reports
 * Returns all tools that are damaged, with tool details
 */
router.get('/', (req, res) => {
  const query = `
    SELECT 
      t.id,
      t.tool_id,
      t.tool_name,
      t.brand,
      t.quantity,
      t.min_stock,
      t.status,
      t.tool_condition,
      t.image_url,
      t.created_at,
      t.updated_at,

      -- From tool_damage_reports
      r.reported_by AS reportedBy,
      r.damaged_quantity AS damagedQuantity,
      r.damage_notes AS damageNotes,
      r.reported_at AS reportedAt,

      -- From tool_activity_log
      l.user AS activityUser,
      l.message AS activityMessage,
      l.created_at AS activityLoggedAt

    FROM tools t
    LEFT JOIN tool_damage_reports r 
      ON r.tool_id = t.id
    LEFT JOIN tool_activity_log l 
      ON l.tool_id = t.id 
    WHERE 
      t.status = 'Damaged' 
      OR t.tool_condition = 'Damaged'
    ORDER BY r.reported_at DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error('Error fetching damage reports:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch damage reports'
      });
    }

    res.status(200).json({
      success: true,
      data: rows
    });
  });
});




module.exports = router;