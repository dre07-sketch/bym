// routes/purchaseOrders.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // adjust path to your DB connection

// ✅ 1. Get all purchase orders
router.get('/purchase-orders-get', (req, res) => {
  const sql = `
    SELECT 
      po.id AS order_id,
      po.po_number,
      po.status,
      po.created_at AS order_created_at,
      i.id AS item_id,
      i.name AS item_name,
      i.quantity,
      i.price,
      i.created_at AS item_created_at
    FROM purchase_orders po
    LEFT JOIN purchase_order_items i 
      ON po.po_number = i.po_number
    ORDER BY po.created_at DESC, i.created_at ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching purchase orders:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const grouped = results.reduce((acc, row) => {
      if (!acc[row.po_number]) {
        acc[row.po_number] = {
          order_id: row.order_id,
          po_number: row.po_number,
          status: row.status,
          order_created_at: row.order_created_at,
          items: []
        };
      }

      if (row.item_id) {
        acc[row.po_number].items.push({
          item_id: row.item_id,
          name: row.item_name,
          quantity: row.quantity,
          price: row.price,
          created_at: row.item_created_at
        });
      }

      return acc;
    }, {});

    res.json(Object.values(grouped));
  });
});




// ✅ 2. Approve purchase order
router.put('/:id/approve', (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE purchase_orders SET status = 'approved' WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error approving order:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    res.json({ message: 'Purchase order approved successfully' });
  });
});

// ✅ 3. Reject purchase order
router.put('/:id/reject', (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE purchase_orders SET status = 'rejected' WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error rejecting order:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    res.json({ message: 'Purchase order rejected successfully' });
  });
});

module.exports = router;
