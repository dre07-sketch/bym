const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

router.post('/', (req, res) => {
  const {
    customer_Name,
    customerId,
    vehicle_Model,
    license_Plate,
    date,
    time,
    serviceType,
    duration,
    serviceBay,
    notes
  } = req.body;

  // ✅ Validate required fields
  if (
    !customer_Name || !customerId ||
    !vehicle_Model || !license_Plate ||
    !date || !time || !serviceType || !duration
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ✅ SQL query with status field
  const sql = `
    INSERT INTO appointments (
      customer_id,
      customer_name,
      vehicle_model,
      license_plate,
      appointment_date,
      appointment_time,
      service_type,
      duration_minutes,
      service_bay,
      notes,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // ✅ Values including 'pending' status
  const values = [
    customerId,
    customer_Name,
    vehicle_Model,
    license_Plate,
    date,
    time,
    serviceType,
    parseInt(duration),
    serviceBay || null,
    notes || null,
    'pending' // Default status
  ];

  // ✅ Execute query
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting appointment:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointmentId: result.insertId,
      status: 'pending'
    });
  });
});


router.get('/vehicles/:customerId', (req, res) => {
  const customerId = req.params.customerId;
  console.log('🔎 Fetching vehicles for customerId:', customerId);

  const sql = `
    SELECT 
      id AS vehicleId,
      make,
      model,
      year,
      license_plate,
      vin,
      color,
      current_mileage,
      
      customer_id AS customerId
    FROM vehicles
    WHERE customer_id = ?
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching vehicles:', err);
      return res.status(500).json({ error: 'Failed to fetch vehicles' });
    }

    res.json(results);
  });
});

// GET /api/customers
router.get('/customers', (req, res) => {
  const type = req.query.type;
  console.log('🔎 Received request for customer type:', type); // log query param

  if (type === 'individual') {
    const sql = `
      SELECT 
        id,
        customer_id AS customerId,
        'individual' AS customerType,
        name AS personal_name,
        phone
      FROM individual_customers
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (individual):', err); // this will show the actual issue
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(results);
    });

  } else if (type === 'company') {
    const sql = `
      SELECT 
        id,
        customer_id AS customerId,
        'company' AS customerType,
        company_name AS name,
        contact_person_name AS personal_name,
        phone
      FROM company_customers
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (company):', err); // real cause shown here
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(results);
    });

  } else {
    res.status(400).json({ error: 'Invalid customer type' });
  }
});

router.get('/getappointment', (req, res) => {
  const sql = `
    SELECT 
      a.id,
      a.customer_id AS customerId,
      CASE 
        WHEN ic.customer_id IS NOT NULL THEN 'individual'
        WHEN cc.customer_id IS NOT NULL THEN 'company'
        ELSE NULL
      END AS customerType,                      -- ✅ Determine actual customer type
      a.customer_name AS customerName,
      v.id AS vehicleId,
      v.make AS vehicleMake,
      v.model AS vehicleModel,
      v.year AS vehicleYear,
      v.license_plate AS licensePlate,
      v.vin,
      v.color,
      v.current_mileage,
      a.appointment_date AS appointmentDate,
      a.appointment_time AS appointmentTime,
      a.service_type AS serviceType,
      a.duration_minutes AS durationMinutes,
      a.service_bay AS serviceBay,
      a.notes,
      a.status,                                 -- ✅ Include status in results
      a.created_at AS createdAt
    FROM appointments a
    LEFT JOIN individual_customers ic ON a.customer_id = ic.customer_id
    LEFT JOIN company_customers cc ON a.customer_id = cc.customer_id
    LEFT JOIN vehicles v ON a.customer_id = v.customer_id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    res.json(results);
  });
});


router.patch('/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = 'UPDATE appointments SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Status updated' });
  });
});

router.put('/:id/status', (req, res) => {
  const appointmentId = req.params.id;
  const { status } = req.body;

  if (!['pending', 'converted', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const query = 'UPDATE appointments SET status = ? WHERE id = ?';
  db.query(query, [status, appointmentId], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

module.exports = router;