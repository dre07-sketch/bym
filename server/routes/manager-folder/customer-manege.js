const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

const BASE_URL = 'http://localhost:5001';
const IMAGE_BASE_URL = `${BASE_URL}`;

const encode = (path) => encodeURIComponent(path).replace(/%2F/g, '/');
// =============================
// GET ALL CUSTOMERS
// =============================
router.get('/fetch', (req, res) => {
  const individualQuery = `
    SELECT 
      'individual' AS customerType,
      ic.customer_id,
      ic.name,
      NULL AS companyName,
      ic.email,
      ic.phone,
      ic.emergency_contact,
      ic.address,
      ic.notes,
      ic.registration_date,
      ic.total_services,
      ic.image AS customer_image,
      v.id AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color,
      v.current_mileage ,
      v.image AS vehicle_image
    FROM individual_customers ic
    LEFT JOIN vehicles v ON ic.customer_id = v.customer_id
  `;

  const companyQuery = `
    SELECT 
      'company' AS customerType,
      cc.customer_id,
      cc.contact_person_name AS name,
      cc.company_name AS companyName,
      cc.email,
      cc.phone,
      cc.emergency_contact,
      cc.address,
      cc.notes,
      cc.registration_date,
      cc.total_services,
      cc.image AS customer_image,
      v.id AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color,
      v.current_mileage ,
      v.image AS vehicle_image
    FROM company_customers cc
    LEFT JOIN vehicles v ON cc.customer_id = v.customer_id
  `;

  const finalQuery = `${individualQuery} UNION ALL ${companyQuery} ORDER BY registration_date DESC`;

  db.query(finalQuery, (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ message: 'Failed to fetch customer data.' });
    }

    const grouped = {};
    for (const row of results) {
      const customerId = row.customer_id;

      if (!grouped[customerId]) {
        grouped[customerId] = {
          customerId: row.customer_id,
          customerType: row.customerType,
          name: row.name,
          companyName: row.companyName,
          email: row.email,
          phone: row.phone,
          emergencyContact: row.emergency_contact,
          address: row.address,
          notes: row.notes,
          registrationDate: row.registration_date,
          totalServices: row.total_services,
          customerImage: row.customer_image ? `${IMAGE_BASE_URL}/${encode(row.customer_image)}` : null,
          vehicles: []
        };
      }

      if (row.vehicle_id) {
        grouped[customerId].vehicles.push({
          id: row.vehicle_id,
          make: row.make,
          model: row.model,
          year: row.year,
          licensePlate: row.license_plate,
          vin: row.vin,
          color: row.color,
          current_mileage : row.current_mileage ,
          imageUrl: row.vehicle_image ? `${IMAGE_BASE_URL}/${encode(row.vehicle_image)}` : null
        });
      }
    }

    res.json(Object.values(grouped));
  });
});


// =============================
// GET CUSTOMER DETAILS BY ID (with vehicles)
// =============================
router.get('/:customer_id', (req, res) => {
  const { customer_id } = req.params;

  const companyQuery = 'SELECT *, "company" AS customer_type FROM company_customers WHERE customer_id = ?';
  db.query(companyQuery, [customer_id], (err, companyResult) => {
    if (err) {
      console.error('Error fetching company customer:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (companyResult.length > 0) {
      const customer = companyResult[0];
      customer.customerImage = customer.image ? `${IMAGE_BASE_URL}/${encode(customer.image)}` : null;
      return res.json(customer);
    }

    const individualQuery = 'SELECT *, "individual" AS customer_type FROM individual_customers WHERE customer_id = ?';
    db.query(individualQuery, [customer_id], (err, individualResult) => {
      if (err) {
        console.error('Error fetching individual customer:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (individualResult.length > 0) {
        const customer = individualResult[0];
        customer.customerImage = customer.image ? `${IMAGE_BASE_URL}/${encode(customer.image)}` : null;

        const vehicleQuery = 'SELECT * FROM vehicles WHERE customer_id = ?';
        db.query(vehicleQuery, [customer_id], (err, vehicleResult) => {
          if (err) {
            console.error('Error fetching vehicles:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          const vehicles = vehicleResult.map(vehicle => ({
            ...vehicle,
            imageUrl: vehicle.image ? `${IMAGE_BASE_URL}/${encode(vehicle.image)}` : null
          }));

          return res.json({
            ...customer,
            vehicles
          });
        });
      } else {
        return res.status(404).json({ message: 'Customer not found' });
      }
    });
  });
});



// =============================
// GET ONLY VEHICLES FOR A CUSTOMER
// =============================
router.get('/:id/vehicles', (req, res) => {
  const customerId = req.params.id;

  const query = `
    SELECT id, make, model, year, license_plate, vin, color, current_mileage , image AS vehicle_image
    FROM vehicles
    WHERE customer_id = ?
  `;

  db.query(query, [customerId], (err, results) => {
    if (err) {
      console.error('Error fetching vehicles:', err);
      return res.status(500).json({ message: 'Failed to fetch vehicles.' });
    }

    const vehicles = results.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      licensePlate: v.license_plate,
      vin: v.vin,
      color: v.color,
      current_mileage : v.current_mileage ,
      imageUrl: v.vehicle_image ? `${IMAGE_BASE_URL}/${v.vehicle_image}` : null
    }));

    res.json({ vehicles });
  });
});


// GET /api/customer-manege/completed-tickets/:customer_id
router.get("/completed-tickets/:customer_id", (req, res) => {
  const { customer_id } = req.params;

  const sql = `
    SELECT ticket_number, title, vehicle_info, license_plate, updated_at
    FROM service_tickets
    WHERE status = 'completed' AND customer_id = ?
    ORDER BY updated_at DESC
  `;

  db.query(sql, [customer_id], (err, tickets) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(tickets);
  });
});


// GET /api/customer-manege/completed-tickets/:customer_id/:ticket_number
router.get("/completed-tickets/:customer_id/:ticket_number", (req, res) => {
  const { customer_id, ticket_number } = req.params;

  const sql = `
    SELECT *
    FROM service_tickets
    WHERE status = 'completed' AND customer_id = ? AND ticket_number = ?
  `;

  db.query(sql, [customer_id, ticket_number], (err, tickets) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (tickets.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    let ticket = tickets[0];
    let details = {
      disassembled_parts: [],
      outsource_mechanics: [],
      ordered_parts: [],
      outsource_stock: [],
      inspections: [],
      progress_logs: [],
      bills: []
    };

    const queries = {
      disassembled_parts: "SELECT * FROM disassembled_parts WHERE ticket_number = ? ORDER BY logged_at",
      outsource_mechanics: "SELECT * FROM outsource_mechanics WHERE ticket_number = ? ORDER BY created_at",
      ordered_parts: "SELECT * FROM ordered_parts WHERE ticket_number = ? ORDER BY ordered_at",
      outsource_stock: "SELECT * FROM outsource_stock WHERE ticket_number = ? ORDER BY requested_at",
      inspections: "SELECT * FROM inspections WHERE ticket_number = ? ORDER BY created_at",
      progress_logs: "SELECT * FROM progress_logs WHERE ticket_number = ? ORDER BY created_at",
      bills: "SELECT * FROM bills WHERE ticket_number = ? ORDER BY created_at"
    };

    let pending = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, sql]) => {
      db.query(sql, [ticket_number], (err, rows) => {
        if (err) {
          console.error(`❌ Error fetching ${key} for ${ticket_number}:`, err);
          details[key] = [];
        } else {
          details[key] = rows;
        }

        pending--;
        if (pending === 0) {
          return res.json({ ...ticket, ...details });
        }
      });
    });
  });
});



module.exports = router;
