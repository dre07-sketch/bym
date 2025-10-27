const express = require('express');
const router = express.Router();
const db = require('../../db/connection');


function generateTicketNumber() {
  const prefix = 'SOS';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

router.post('/sos', (req, res) => {
  const {
    customer_name,
    customer_type,
    vehicle_model,
    license_plate,
    location,
    contact_phone,
    description,
    priority_level
  } = req.body;

  // Validation
  if (
    !customer_name ||
    !customer_type ||
    !vehicle_model ||
    !license_plate ||
    !location ||
    !contact_phone ||
    !description
  ) {
    return res.status(400).json({ error: 'Please fill all required fields.' });
  }

  if (!['individual', 'company'].includes(customer_type)) {
    return res.status(400).json({ error: 'Invalid customer type.' });
  }

  if (priority_level && !['High', 'Critical'].includes(priority_level)) {
    return res.status(400).json({ error: 'Invalid priority level.' });
  }

  const customer_id = req.body.customer_id || 'unknown';
  const sos_ticket_number = generateTicketNumber();

  const sql = `
    INSERT INTO sos_requests 
    (sos_ticket_number, customer_id, customer_name, customer_type, vehicle_model, license_plate, location, contact_phone, description, priority_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    sos_ticket_number,
    customer_id,
    customer_name,
    customer_type,
    vehicle_model,
    license_plate,
    location,
    contact_phone,
    description,
    priority_level || 'High'
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting sos_request:', err);
      return res.status(500).json({ error: 'Server error while submitting SOS request' });
    }

    res.status(201).json({
      message: 'SOS request submitted successfully',
      sosRequestId: result.insertId,
      sos_ticket_number
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

// This route fetches all customers (individuals and companies)
router.get('/customers', (req, res) => {
  const type = req.query.type;
  console.log('🔎 Received request for customer type:', type);

  if (type === 'individual') {
    const sql = `
      SELECT 
        id,
        customer_id AS customerId,
        'individual' AS customerType,
        name AS personal_name,
        phone,
        email
      FROM individual_customers
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (individual):', err);
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
        phone,
        email
      FROM company_customers
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error('❌ MySQL Error (company):', err);
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
      res.json(results);
    });

  } else {
    res.status(400).json({ error: 'Invalid customer type' });
  }
});

router.get('/all-sos-request', (req, res) => {
  const query = `SELECT * FROM sos_requests ORDER BY created_at DESC`;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching SOS requests:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results); // Array of all SOS requests
  });
});

router.put('/update/:id', (req, res) => {
  const { id } = req.params; // Get the SOS request ID (likely sos_ticket_number) from the URL
  const { status } = req.body; // Get the new status from the request body

  // Basic validation
  if (!status) {
     return res.status(400).json({ error: 'New status is required in the request body.' });
  }

  // You might also want to validate that the status is an allowed value
  const allowedStatuses = ['pending', 'dispatched', 'en-route', 'on-scene', 'completed', 'converted', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
      // Or handle gracefully by defaulting/logging
      console.warn(`Attempted to set invalid status '${status}' for SOS request ${id}`);
      // Optionally return an error or proceed with a default
      // return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
  }


  // --- Determine the correct ID column ---
  // Your frontend seems to use 'id' (sos_ticket_number) for identification.
  // Make sure the column name in your query matches your database schema.
  // Assuming the column is named `sos_ticket_number`
  const updateQuery = `
    UPDATE sos_requests
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE sos_ticket_number = ?
  `;

  db.query(updateQuery, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating SOS request status:', err);
      return res.status(500).json({ error: 'Failed to update SOS request status.' });
    }

    // Check if any row was actually updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'SOS request not found.' });
    }

    // Optionally, fetch and return the updated request, or just send a success message
    // Returning the updated timestamp or a simple confirmation is common
    res.json({ message: 'SOS request status updated successfully.', updated_at: new Date() });
  });
});

router.get('/count-converted', (req, res) => {
  const sql = `
    SELECT COUNT(*) AS convertedCount 
    FROM sos_requests 
    WHERE status = 'converted'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching converted count:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json({ convertedCount: results[0].convertedCount });
  });
});


// GET all converted SOS requests
router.get('/converted', (req, res) => {
  const sql = `
    SELECT * 
    FROM sos_requests 
    WHERE status = 'converted'
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching converted SOS requests:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.json(results);
  });
});


module.exports = router;
