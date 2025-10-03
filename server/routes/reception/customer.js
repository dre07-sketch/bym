const express = require('express');
const router = express.Router();
const db = require('../../db/connection');
const multer = require('multer');
const bcrypt = require('bcrypt');


const BASE_URL = 'http://localhost:5001';
const IMAGE_BASE_URL = `${BASE_URL}`;
const encode = (path) => encodeURIComponent(path).replace(/%2F/g, '/');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

function generateReadableCustomerId() {
  return `CUST${Date.now()}`;
}

// =============================
// REGISTER CUSTOMER AND VEHICLES
// =============================


router.post('/', upload.array('images'), async (req, res) => {
  const {
    customerType,
    name,
    email,
    phone,
    password,
    emergencyContact,
    address,
    notes,
    companyName,
    registrationDate,
    totalServices = 0,
    vehicles
  } = req.body;

  if (!customerType || !name || !email || !phone || !vehicles || !password) {
    return res.status(400).json({ message: 'Missing required customer, password, or vehicle fields.' });
  }

  let vehiclesArr;
  if (typeof vehicles === 'string') {
    try {
      vehiclesArr = JSON.parse(vehicles);
    } catch {
      return res.status(400).json({ message: 'Invalid vehicles format.' });
    }
  } else if (Array.isArray(vehicles)) {
    vehiclesArr = vehicles;
  } else {
    return res.status(400).json({ message: 'Vehicles must be an array.' });
  }

  const customer_id = generateReadableCustomerId();
  const files = req.files || [];
  const customerImageFile = files[0];
  const vehicleImageFiles = files.slice(1);

  const customerImagePath = customerImageFile ? `uploads/${customerImageFile.filename}` : null;

  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    db.getConnection((err, connection) => {
      if (err) {
        console.error('Connection error:', err);
        return res.status(500).json({ message: 'Database connection failed.' });
      }

      connection.beginTransaction(err => {
        if (err) {
          connection.release();
          return res.status(500).json({ message: 'Transaction failed to start.' });
        }

        const insertCustomerQuery = customerType === 'individual'
          ? `INSERT INTO individual_customers
              (customer_id, name, email, phone, password, emergency_contact, address, notes, registration_date, total_services, image)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          : `INSERT INTO company_customers
              (customer_id, company_name, name, email, phone, password, emergency_contact, address, notes, registration_date, total_services, image)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const customerParams = customerType === 'individual'
          ? [customer_id, name, email, phone, hashedPassword, emergencyContact, address, notes, registrationDate, totalServices, customerImagePath]
          : [customer_id, companyName, name, email, phone, hashedPassword, emergencyContact, address, notes, registrationDate, totalServices, customerImagePath];

        connection.query(insertCustomerQuery, customerParams, (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error('Insert customer error:', err);
              res.status(500).json({ message: 'Failed to insert customer.' });
            });
          }

          // --- Vehicle Insert with next_service_mileage ---
          const insertVehicleQuery = `
            INSERT INTO vehicles
            (customer_id, make, model, year, license_plate, vin, color, current_mileage, last_service_mileage, next_service_mileage, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const vehicleInsertTasks = vehiclesArr.map((vehicle, i) => {
            const {
              make, model, year = null, licensePlate = null,
              vin = null, color = null, current_mileage = null
            } = vehicle;

            const fileForVehicle = vehicleImageFiles[i];
            const imagePath = fileForVehicle ? `uploads/${fileForVehicle.filename}` : null;

            return new Promise((resolve, reject) => {
              // fetch service interval for this vehicle
              connection.query(
                'SELECT service_interval_km FROM car_models WHERE make = ? AND model = ? LIMIT 1',
                [make, model],
                (err, rows) => {
                  if (err) return reject(err);

                  const serviceInterval = rows.length > 0 ? rows[0].service_interval_km : null;
                  let nextServiceMileage = null;
                  if (current_mileage && serviceInterval) {
                    nextServiceMileage = parseInt(current_mileage, 10) + serviceInterval;
                  }

                  connection.query(
                    insertVehicleQuery,
                    [
                      customer_id,
                      make, model, year, licensePlate, vin, color,
                      current_mileage ? parseInt(current_mileage, 10) : null,
                      0, // last_service_mileage default
                      nextServiceMileage,
                      imagePath
                    ],
                    (err) => err ? reject(err) : resolve()
                  );
                }
              );
            });
          });

          Promise.all(vehicleInsertTasks)
            .then(() => {
              connection.commit(err => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ message: 'Failed to commit transaction.' });
                  });
                }

                connection.release();
                res.status(201).json({
                  message: 'Customer and vehicles registered successfully.',
                  customer_id,
                  customerImage: customerImagePath ? `${IMAGE_BASE_URL}/${encode(customerImagePath)}` : null
                });
              });
            })
            .catch(vehicleErr => {
              connection.rollback(() => {
                connection.release();
                console.error('Insert vehicle error:', vehicleErr);
                res.status(500).json({ message: 'Failed to insert vehicles.' });
              });
            });
        });
      });
    });
  } catch (err) {
    console.error('Password hashing error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


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
      ic.loyalty_points,
      ic.image AS customer_image,
      v.id AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color,
      v.current_mileage,
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
      cc.loyalty_points,
      cc.image AS customer_image,
      v.id AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color,
      v.current_mileage,
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
      const {
        customer_id, customerType, name, companyName, email, phone,
        emergency_contact, address, notes, registration_date, total_services,
        loyalty_points, customer_image, vehicle_id, make, model, year,
        license_plate, vin, color, current_mileage, vehicle_image
      } = row;

      if (!grouped[customer_id]) {
        grouped[customer_id] = {
          customerId: customer_id,
          customerType,
          name,
          companyName,
          email,
          phone,
          emergencyContact: emergency_contact,
          address,
          notes,
          registrationDate: registration_date,
          totalServices: total_services,
          loyaltyPoints: loyalty_points,
          customerImage: customer_image ? `${IMAGE_BASE_URL}/${encode(customer_image)}` : null,
          vehicles: []
        };
      }

      if (vehicle_id) {
        grouped[customer_id].vehicles.push({
          id: vehicle_id,
          make,
          model,
          year,
          licensePlate: license_plate,
          vin,
          color,
          current_mileage,
          imageUrl: vehicle_image ? `${IMAGE_BASE_URL}/${encode(vehicle_image)}` : null
        });
      }
    }

    res.json(Object.values(grouped));
  });
});


// =============================
// ADD VEHICLES TO EXISTING CUSTOMER
// =============================
router.post('/add-vehicles', upload.array('images'), async (req, res) => {
  const customerId = req.body.customerId;
  let vehicles;

  try {
    vehicles = JSON.parse(req.body.vehicles);
  } catch (err) {
    console.error('Error parsing vehicles JSON:', err);
    return res.status(400).json({ error: 'Invalid vehicles data format. Expected JSON string.' });
  }

  if (!customerId || !Array.isArray(vehicles)) {
    return res.status(400).json({ error: 'Invalid input: customerId and vehicles array are required.' });
  }

  for (const [index, vehicle] of vehicles.entries()) {
    if (!vehicle.make || !vehicle.model) {
      return res.status(400).json({ error: `Vehicle ${index + 1}: Make and Model are required.` });
    }
  }

  try {
    const insertValues = [];

    for (const [index, vehicle] of vehicles.entries()) {
      const imageFile = req.files?.[index];
      const year = vehicle.year ? parseInt(vehicle.year, 10) : null;
      const current_mileage = vehicle.current_mileage ? parseInt(vehicle.current_mileage, 10) : null;

      // 🔹 Fetch service interval from car_models
      const [rows] = await db.promise().query(
        `SELECT service_interval_km FROM car_models WHERE make = ? AND model = ? LIMIT 1`,
        [vehicle.make, vehicle.model]
      );

      const serviceInterval = rows.length > 0 ? rows[0].service_interval_km : null;

      // 🔹 Calculate next service mileage
      let next_service_mileage = null;
      if (current_mileage !== null && serviceInterval !== null) {
        next_service_mileage = current_mileage + serviceInterval;
      }

      insertValues.push([
        customerId,
        vehicle.make,
        vehicle.model,
        year,
        vehicle.licensePlate || null,
        vehicle.vin || null,
        vehicle.color || null,
        current_mileage,
        0, // last_service_mileage default
        next_service_mileage,
        imageFile ? `uploads/${imageFile.filename}` : null
      ]);
    }

    const query = `
      INSERT INTO vehicles 
      (customer_id, make, model, year, license_plate, vin, color, current_mileage, last_service_mileage, next_service_mileage, image) 
      VALUES ?
    `;

    const [result] = await db.promise().query(query, [insertValues]);

    const imageUrls = req.files.map(file => `${IMAGE_BASE_URL}/${encode(`uploads/${file.filename}`)}`);

    res.status(201).json({
      message: 'Vehicles added successfully',
      affectedRows: result.affectedRows,
      firstInsertedId: result.insertId,
      imageUrls
    });
  } catch (err) {
    console.error('Error inserting vehicles:', err);
    return res.status(500).json({ error: 'Failed to insert vehicles into the database.' });
  }
});



router.get('/car-models', (req, res) => {
  const query = `
    SELECT make, model, service_interval_km 
    FROM car_models 
    ORDER BY make, model
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching car models:', err);
      return res.status(500).json({ message: 'Failed to fetch car models.' });
    }

    // Group models by make
    const grouped = results.reduce((acc, row) => {
      if (!acc[row.make]) {
        acc[row.make] = [];
      }
      acc[row.make].push({
        model: row.model,
        serviceInterval: row.service_interval_km,
      });
      return acc;
    }, {});

    res.json(grouped);
  });
});

module.exports = router;
