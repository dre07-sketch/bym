// routes/damage-reports.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

/**
 * GET /api/damage-reports
 * Returns all tools that are damaged, with tool details
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
  SELECT 
    t.id,
    t.tool_id AS toolId,
    t.tool_name AS name,
    t.brand,
    t.quantity,
    t.status,
    t.tool_condition AS toolCondition,
    t.image_url AS imageUrl,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    t.notes,
    dr.reported_by AS reportedBy,
    dr.notes AS damageNotes,
    dr.reported_at AS reportedAt
  FROM tools t
  LEFT JOIN (
    SELECT tool_id, reported_by, notes, reported_at
    FROM tool_damage_reports
    WHERE (tool_id, reported_at) IN (
      SELECT tool_id, MAX(reported_at)
      FROM tool_damage_reports
      GROUP BY tool_id
    )
  ) dr ON t.id = dr.tool_id
  WHERE t.status = 'Damaged' OR t.tool_condition = 'Damaged'
  ORDER BY dr.reported_at DESC, t.updated_at DESC
`;

    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching damaged tools:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch damaged tools'
        });
      }

      const data = results.map(row => ({
        id: row.id,
        toolId: row.toolId,
        name: row.name,
        brand: row.brand,
        quantity: row.quantity,
        status: row.status,
        condition: row.condition,
        imageUrl: row.imageUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        notes: row.notes,
        reportedBy: row.reportedBy || 'Unknown',
        damageNotes: row.damageNotes,
        reportedAt: row.reportedAt
      }));

      res.status(200).json({
        success: true,
        data
      });
    });
  } catch (error) {
    console.error('Server error in /damage-reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;