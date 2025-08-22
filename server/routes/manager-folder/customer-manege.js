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
      v.mileage,
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
      v.mileage,
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
          mileage: row.mileage,
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
    SELECT id, make, model, year, license_plate, vin, color, mileage, image AS vehicle_image
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
      mileage: v.mileage,
      imageUrl: v.vehicle_image ? `${IMAGE_BASE_URL}/${v.vehicle_image}` : null
    }));

    res.json({ vehicles });
  });
});

module.exports = router;
