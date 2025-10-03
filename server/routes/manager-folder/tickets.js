const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

function generateTicketNumber() {
  const prefix = 'TICK';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

// Utility: Generate readable customer ID
// Helpers (place near top of file)
const dbQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// Generate readable customer id with prefix and uniqueness check
async function generateReadableCustomerId(prefix = 'CUST') {
  const maxTries = 8;
  for (let i = 0; i < maxTries; i++) {
    // compact but readable id
    const candidate = `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 9000 + 1000)}`;
    // check both customer tables to avoid collision
    const rows = await dbQuery(
      `SELECT customer_id FROM company_customers WHERE customer_id = ?
       UNION
       SELECT customer_id FROM individual_customers WHERE customer_id = ?`,
      [candidate, candidate]
    );
    if (rows.length === 0) return candidate;
    // small delay could be added, but not necessary here
  }
  throw new Error('Unable to generate unique customer ID');
}

function normalizeCustomerId(candidate, prefix = 'CUST') {
  if (!candidate) return null;
  // if already has the prefix (either 'CUST' or 'CUST-'), keep it
  if (candidate.toString().startsWith(prefix)) return candidate.toString();
  // add dash for readability
  return `${prefix}-${candidate}`;
}

// Ensure customer exists and return the canonical customer_id (with prefix)
async function ensureCustomerAndGetId(customer_type, customerData) {
  if (!['company', 'individual'].includes(customer_type)) throw new Error('Invalid customer type');

  const prefix = 'CUST';
  let provided = customerData.customer_id ? String(customerData.customer_id) : null;
  let candidate = provided ? normalizeCustomerId(provided, prefix) : await generateReadableCustomerId(prefix);

  // If provided candidate already exists in the correct table, return it.
  if (customer_type === 'company') {
    const existing = await dbQuery('SELECT customer_id FROM company_customers WHERE customer_id = ?', [candidate]);
    if (existing.length > 0) return candidate;

    // If there's an incoming id but it collides with the other table, try generating a new one
    // (double-check collision across both)
    const cross = await dbQuery(
      `SELECT customer_id FROM company_customers WHERE customer_id = ? 
       UNION
       SELECT customer_id FROM individual_customers WHERE customer_id = ?`,
      [candidate, candidate]
    );
    if (cross.length > 0) {
      candidate = await generateReadableCustomerId(prefix);
    }

    // Insert the company customer
    await dbQuery(
      `INSERT INTO company_customers (
        customer_id, company_name, contact_person_name, email, phone,
        emergency_contact, address, notes, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate,
        customerData.company_name || null,
        customerData.contact_person_name || null,
        customerData.email || null,
        customerData.phone || null,
        customerData.emergency_contact || null,
        customerData.address || null,
        customerData.notes || null,
        customerData.image || null
      ]
    );
    return candidate;
  } else {
    // individual
    const existing = await dbQuery('SELECT customer_id FROM individual_customers WHERE customer_id = ?', [candidate]);
    if (existing.length > 0) return candidate;

    const cross = await dbQuery(
      `SELECT customer_id FROM company_customers WHERE customer_id = ? 
       UNION
       SELECT customer_id FROM individual_customers WHERE customer_id = ?`,
      [candidate, candidate]
    );
    if (cross.length > 0) {
      candidate = await generateReadableCustomerId(prefix);
    }

    await dbQuery(
      `INSERT INTO individual_customers (
        customer_id, name, email, phone, emergency_contact, address, notes, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate,
        customerData.name || null,
        customerData.email || null,
        customerData.phone || null,
        customerData.emergency_contact || null,
        customerData.address || null,
        customerData.notes || null,
        customerData.image || null
      ]
    );
    return candidate;
  }
}

// Upsert vehicle (promisified)
async function ensureVehicle(vehicleData) {
  // 1. Fetch service interval for the vehicle
  const [serviceRow] = await dbQuery(
    'SELECT service_interval_km FROM car_models WHERE make = ? AND model = ? LIMIT 1',
    [vehicleData.make, vehicleData.model]
  );
  const serviceInterval = serviceRow ? serviceRow.service_interval_km : null;

  // 2. Calculate next_service_mileage if possible
  let nextServiceMileage = null;
  if (vehicleData.current_mileage && serviceInterval) {
    nextServiceMileage = vehicleData.current_mileage + serviceInterval;
  }

  // 3. Find vehicle by license_plate OR vin
  const rows = await dbQuery(
    'SELECT id FROM vehicles WHERE license_plate = ? OR vin = ?',
    [vehicleData.license_plate || null, vehicleData.vin || null]
  );

  if (rows.length > 0) {
    // Update existing vehicle
    const vehicleId = rows[0].id;
    await dbQuery(
      `UPDATE vehicles SET
         customer_id = ?, make = ?, model = ?, year = ?, license_plate = ?,
         vin = ?, color = ?, current_mileage = ?, 
         last_service_mileage = ?, next_service_mileage = ?, image = ?
       WHERE id = ?`,
      [
        vehicleData.customer_id,
        vehicleData.make || null,
        vehicleData.model || null,
        vehicleData.year || null,
        vehicleData.license_plate || null,
        vehicleData.vin || null,
        vehicleData.color || null,
        vehicleData.current_mileage || null,
        vehicleData.last_service_mileage || 0,
        nextServiceMileage,
        vehicleData.image || null,
        vehicleId
      ]
    );
    return vehicleId;
  } else {
    // Insert new vehicle
    const result = await dbQuery(
      `INSERT INTO vehicles (
         customer_id, make, model, year, license_plate,
         vin, color, current_mileage, last_service_mileage, next_service_mileage, image
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicleData.customer_id,
        vehicleData.make || null,
        vehicleData.model || null,
        vehicleData.year || null,
        vehicleData.license_plate || null,
        vehicleData.vin || null,
        vehicleData.color || null,
        vehicleData.current_mileage || null,
        vehicleData.last_service_mileage || 0,
        nextServiceMileage,
        vehicleData.image || null
      ]
    );
    return result.insertId;
  }
}


// Generate a unique ticket number (TICK-YYYYMMDD-XXXX)
async function generateTicketNumber() {
  const prefix = 'TICK';
  const maxTries = 8;

  for (let i = 0; i < maxTries; i++) {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const candidate = `${prefix}-${randomNum}`;
    const rows = await dbQuery('SELECT id FROM service_tickets WHERE ticket_number = ?', [candidate]);
    if (rows.length === 0) return candidate;
  }

  throw new Error('Failed to generate unique ticket number');
}


// The POST route (replace your previous implementation)
router.post('/', async (req, res) => {
  try {
    const {
      customer_type, customer_id,
      // Company
      company_name, contact_person_name, company_email, company_phone,
      emergency_contact, company_address, company_notes, company_image,
      // Individual
      individual_name, individual_email, individual_phone,
      individual_emergency_contact, individual_address, individual_notes, individual_image,
      // Vehicle
      vehicle_info, license_plate,
      // Ticket
      title, description, priority, type, urgency_level, appointment_id,
      // Insurance
      insurance_company, insurance_phone, accident_date,
      owner_name, owner_phone, owner_email, insurance_description,
      // Proforma
      proforma_id
    } = req.body;

    // ✅ Basic validation
    if (!customer_type || !title || !description || !priority || !type || !vehicle_info) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Validate customer_name properly
    if (customer_type === 'individual' && !individual_name) {
      return res.status(400).json({ error: 'Missing individual_name for individual customer' });
    }
    if (customer_type === 'company' && !company_name && !contact_person_name) {
      return res.status(400).json({ error: 'Missing company_name or contact_person_name for company customer' });
    }

    // If proforma_id provided, validate
    let proforma = null;
    if (proforma_id) {
      const p = await dbQuery('SELECT * FROM proformas WHERE id = ? AND status = "Accepted"', [proforma_id]);
      if (!p || p.length === 0) {
        return res.status(400).json({ error: 'Invalid proforma or not accepted' });
      }
      proforma = p[0];
    }

    // Build customer data
    const customerData = customer_type === 'company'
      ? {
          customer_id,
          company_name,
          contact_person_name,
          email: company_email,
          phone: company_phone,
          emergency_contact,
          address: company_address,
          notes: company_notes,
          image: company_image
        }
      : {
          customer_id,
          name: individual_name,
          email: individual_email,
          phone: individual_phone,
          emergency_contact: individual_emergency_contact,
          address: individual_address,
          notes: individual_notes,
          image: individual_image
        };

    // Ensure customer
    const finalCustomerId = await ensureCustomerAndGetId(customer_type, customerData);

    // Ensure vehicle
    const vehicleId = await ensureVehicle({
      customer_id: finalCustomerId,
      make: vehicle_info.make,
      model: vehicle_info.model,
      year: vehicle_info.year,
      license_plate,
      vin: vehicle_info.vin,
      color: vehicle_info.color,
      current_mileage: vehicle_info.current_mileage,
      image: vehicle_info.image
    });

    const vehicleInfoString = `${vehicle_info.make || ''} ${vehicle_info.model || ''} (${vehicle_info.year || ''})`.trim();

    // ✅ Always set customerName (cannot be null)
    const customerName =
      customer_type === 'company'
        ? (contact_person_name || company_name)
        : individual_name;

    // Generate ticket number
    const ticket_number = await generateTicketNumber('TICK');

    // Insert ticket
    const insertTicketQuery = `
      INSERT INTO service_tickets (
        ticket_number, customer_type, customer_id, customer_name,
        vehicle_id, vehicle_info, license_plate, title,
        description, priority, type, urgency_level,
        appointment_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const ticketResult = await dbQuery(insertTicketQuery, [
      ticket_number, customer_type, finalCustomerId, customerName,
      vehicleId, vehicleInfoString, license_plate || null, title,
      description, priority, type,
      urgency_level || null, appointment_id || null
    ]);

    // Insert insurance extras if needed
    if (type === 'insurance') {
      await dbQuery(
        `INSERT INTO insurance (
          ticket_number, insurance_company, insurance_phone,
          accident_date, owner_name, owner_phone, owner_email, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

        [
          ticket_number, insurance_company || null, insurance_phone || null,
          accident_date || null, owner_name || null, owner_phone || null,
          owner_email || null, insurance_description || null
        ]
      );
    }

    // If proforma was provided
    if (proforma) {
      await dbQuery(
        `INSERT INTO bills (
          ticket_number, proforma_number, customer_name, vehicle_info,
          labor_cost, parts_cost, outsourced_parts_cost, outsourced_labor_cost,
          subtotal, tax_rate, tax_amount, total, discount, final_total, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,

        [
          ticket_number,
          proforma.proforma_number || null,
          customerName,
          vehicleInfoString,
          0.0, 0.0, 0.0, 0.0,
          proforma.subtotal || 0.0,
          proforma.vat_rate || 0.0,
          proforma.vat_amount || 0.0,
          proforma.total || 0.0,
          0.0,
          proforma.total || 0.0,
          proforma.notes || null
        ]
      );

      await dbQuery('UPDATE proformas SET status = "Converted", updated_at = NOW() WHERE id = ?', [proforma_id]);
    }

    // Return created ticket
    const createdRows = await dbQuery('SELECT * FROM service_tickets WHERE id = ?', [ticketResult.insertId]);
    return res.status(201).json(createdRows[0]);

  } catch (err) {
    console.error('Ticket creation error:', err);
    return res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
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



// ===================== All Tickets API =====================
// ===================== All Service Tickets =====================
router.get('/service_tickets', (req, res) => {
  const ticketsQuery = `
    SELECT 
      st.id,
      st.ticket_number,
      st.customer_type,
      st.customer_id,
      st.customer_name,
      st.vehicle_id,
      st.vehicle_info,
      st.license_plate,
      st.title,
      st.description,
      st.priority,
      st.type,
      st.urgency_level,
      st.status,
      st.appointment_id,
      st.created_at,
      st.updated_at,
      st.completion_date,
      st.estimated_completion_date,
      v.make,
      v.model,
      v.year,
      v.image,
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    LEFT JOIN vehicles v
      ON st.vehicle_id = v.id
    WHERE st.status IN (
      'pending','assigned','in progress','ready for inspection','inspection',
      'successful inspection','inspection failed','awaiting survey','awaiting salvage form',
      'awaiting bill','Payment Requested','Request Payment','completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) return res.status(500).json({ message: 'Database query error' });
    if (tickets.length === 0) return res.json([]);

    const ticketNumbers = tickets.map(t => t.ticket_number);

    // Queries object
    const queries = {
      disassembled: `SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC`,
      logs: `SELECT id, ticket_number, \`date\` AS log_date, \`time\` AS log_time, status, description, created_at FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC`,
      inspections: `SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date, inspection_status, created_at, updated_at, check_oil_leaks, check_engine_air_filter_oil_coolant_level, check_brake_fluid_levels, check_gluten_fluid_levels, check_battery_timing_belt, check_tire, check_tire_pressure_rotation, check_lights_wiper_horn, check_door_locks_central_locks, check_customer_work_order_reception_book FROM inspections WHERE ticket_number IN (?) ORDER BY created_at DESC`,
      outsourceMechanics: `SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at FROM outsource_mechanics WHERE ticket_number IN (?) ORDER BY created_at DESC`,
      outsourceStock: `SELECT auto_id, id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at FROM outsource_stock WHERE ticket_number IN (?) ORDER BY requested_at DESC`,
      orderedParts: `SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at FROM ordered_parts WHERE ticket_number IN (?) ORDER BY ordered_at DESC`,
      tools: `SELECT id, tool_id, tool_name, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at FROM tool_assignments WHERE ticket_number IN (?) ORDER BY assigned_at DESC`,
      mechanicAssignments: `SELECT id, ticket_number, mechanic_id, mechanic_name, assigned_at FROM mechanic_assignments WHERE ticket_number IN (?) ORDER BY assigned_at DESC`,
      insurance: `SELECT id, ticket_number, insurance_company, insurance_phone, accident_date, owner_name, owner_phone, owner_email, description AS insurance_description, created_at, updated_at FROM insurance WHERE ticket_number IN (?) ORDER BY created_at DESC`
    };

    // Execute all queries
    db.query(queries.disassembled, [ticketNumbers], (err, disassembledRows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch disassembled parts' });

      db.query(queries.logs, [ticketNumbers], (err, logRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch progress logs' });

        db.query(queries.inspections, [ticketNumbers], (err, inspectionRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch inspections' });

          db.query(queries.outsourceMechanics, [ticketNumbers], (err, mechanicsRows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch outsource mechanics' });

            db.query(queries.outsourceStock, [ticketNumbers], (err, stockRows) => {
              if (err) return res.status(500).json({ error: 'Failed to fetch outsource stock' });

              db.query(queries.orderedParts, [ticketNumbers], (err, orderedRows) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch ordered parts' });

                db.query(queries.tools, [ticketNumbers], (err, toolRows) => {
                  if (err) return res.status(500).json({ error: 'Failed to fetch tool assignments' });

                  db.query(queries.mechanicAssignments, [ticketNumbers], (err, mechanicAssignRows) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch mechanic assignments' });

                    db.query(queries.insurance, [ticketNumbers], (err, insuranceRows) => {
                      if (err) return res.status(500).json({ error: 'Failed to fetch insurance info' });

                      const mapByTicket = (rows) => {
                        const map = {};
                        rows.forEach(r => {
                          if (!map[r.ticket_number]) map[r.ticket_number] = [];
                          map[r.ticket_number].push(r);
                        });
                        return map;
                      };

                      const disassembledMap = mapByTicket(disassembledRows);
                      const logsMap = mapByTicket(logRows);
                      const inspectionsMap = mapByTicket(inspectionRows);
                      const mechanicsMap = mapByTicket(mechanicsRows);
                      const stockMap = mapByTicket(stockRows);
                      const orderedMap = mapByTicket(orderedRows);
                      const toolsMap = mapByTicket(toolRows);
                      const mechanicAssignMap = mapByTicket(mechanicAssignRows);
                      const insuranceMap = mapByTicket(insuranceRows);

                      const formatInspection = (inspection) => ({
                        ...inspection,
                        checklist: {
                          oilLeaks: inspection.check_oil_leaks ?? null,
                          engineAirFilterOilCoolant: inspection.check_engine_air_filter_oil_coolant_level ?? null,
                          brakeFluidLevels: inspection.check_brake_fluid_levels ?? null,
                          glutenFluidLevels: inspection.check_gluten_fluid_levels ?? null,
                          batteryTimingBelt: inspection.check_battery_timing_belt ?? null,
                          tire: inspection.check_tire ?? null,
                          tirePressureRotation: inspection.check_tire_pressure_rotation ?? null,
                          lightsWiperHorn: inspection.check_lights_wiper_horn ?? null,
                          doorLocksCentralLocks: inspection.check_door_locks_central_locks ?? null,
                          customerWorkOrderReceptionBook: inspection.check_customer_work_order_reception_book ?? null
                        }
                      });

                      const formattedResults = tickets.map(ticket => ({
                        ...ticket,
                        status: ticket.status === 'in progress' ? 'in-progress' : ticket.status,
                        mechanic_assignments: mechanicAssignMap[ticket.ticket_number] || [],
                        disassembled_parts: disassembledMap[ticket.ticket_number] || [],
                        progress_logs: logsMap[ticket.ticket_number] || [],
                        inspections: (inspectionsMap[ticket.ticket_number] || []).map(formatInspection),
                        outsource_mechanics: mechanicsMap[ticket.ticket_number] || [],
                        outsource_stock: stockMap[ticket.ticket_number] || [],
                        ordered_parts: orderedMap[ticket.ticket_number] || [],
                        tool_assignments: toolsMap[ticket.ticket_number] || [],
                        insurance: (insuranceMap[ticket.ticket_number] || [])[0] || null
                      }));

                      res.json(formattedResults);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// ===================== Single Service Ticket =====================
router.get('/service_tickets/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const ticketQuery = `
    SELECT 
      st.*,
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email,
      v.make,
      v.model,
      v.year,
      v.image AS vehicle_image
    FROM service_tickets st
    LEFT JOIN individual_customers ic ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    LEFT JOIN vehicles v ON st.vehicle_id = v.id
    WHERE st.ticket_number = ?
    LIMIT 1
  `;

  const queries = {
    disassembled: `SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified FROM disassembled_parts WHERE ticket_number = ? ORDER BY logged_at DESC`,
    logs: `SELECT id, ticket_number, \`date\` AS log_date, \`time\` AS log_time, status, description, created_at FROM progress_logs WHERE ticket_number = ? ORDER BY created_at DESC`,
    inspections: `SELECT id, ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date, inspection_status, created_at, updated_at, check_oil_leaks, check_engine_air_filter_oil_coolant_level, check_brake_fluid_levels, check_gluten_fluid_levels, check_battery_timing_belt, check_tire, check_tire_pressure_rotation, check_lights_wiper_horn, check_door_locks_central_locks, check_customer_work_order_reception_book FROM inspections WHERE ticket_number = ? ORDER BY created_at DESC`,
    outsourceMechanics: `SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at FROM outsource_mechanics WHERE ticket_number = ? ORDER BY created_at DESC`,
    outsourceStock: `SELECT auto_id, id, ticket_number, name, category, sku, price, quantity, source_shop, status, requested_at, received_at, notes, updated_at FROM outsource_stock WHERE ticket_number = ? ORDER BY requested_at DESC`,
    orderedParts: `SELECT id, ticket_number, item_id, name, category, sku, price, quantity, status, ordered_at FROM ordered_parts WHERE ticket_number = ? ORDER BY ordered_at DESC`,
    tools: `SELECT id, tool_id, tool_name, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at FROM tool_assignments WHERE ticket_number = ? ORDER BY assigned_at DESC`,
    mechanicAssignments: `SELECT id, ticket_number, mechanic_id, mechanic_name, assigned_at FROM mechanic_assignments WHERE ticket_number = ? ORDER BY assigned_at DESC`,
    insurance: `SELECT id, ticket_number, insurance_company, insurance_phone, accident_date, owner_name, owner_phone, owner_email, description AS insurance_description, created_at, updated_at FROM insurance WHERE ticket_number = ? ORDER BY created_at DESC`
  };

  db.query(ticketQuery, [ticket_number], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database query error' });
    if (results.length === 0) return res.status(404).json({ message: 'Service ticket not found' });

    const row = results[0];

    db.query(queries.disassembled, [ticket_number], (err, disassembledRows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch disassembled parts' });

      db.query(queries.logs, [ticket_number], (err, logRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch progress logs' });

        db.query(queries.inspections, [ticket_number], (err, inspectionRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch inspections' });

          db.query(queries.outsourceMechanics, [ticket_number], (err, mechanicsRows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch outsource mechanics' });

            db.query(queries.outsourceStock, [ticket_number], (err, stockRows) => {
              if (err) return res.status(500).json({ error: 'Failed to fetch outsource stock' });

              db.query(queries.orderedParts, [ticket_number], (err, orderedRows) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch ordered parts' });

                db.query(queries.tools, [ticket_number], (err, toolRows) => {
                  if (err) return res.status(500).json({ error: 'Failed to fetch tool assignments' });

                  db.query(queries.mechanicAssignments, [ticket_number], (err, mechanicAssignRows) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch mechanic assignments' });

                    db.query(queries.insurance, [ticket_number], (err, insuranceRows) => {
                      if (err) return res.status(500).json({ error: 'Failed to fetch insurance info' });

                      const formatInspection = (inspection) => ({
                        ...inspection,
                        checklist: {
                          oilLeaks: inspection.check_oil_leaks ?? null,
                          engineAirFilterOilCoolant: inspection.check_engine_air_filter_oil_coolant_level ?? null,
                          brakeFluidLevels: inspection.check_brake_fluid_levels ?? null,
                          glutenFluidLevels: inspection.check_gluten_fluid_levels ?? null,
                          batteryTimingBelt: inspection.check_battery_timing_belt ?? null,
                          tire: inspection.check_tire ?? null,
                          tirePressureRotation: inspection.check_tire_pressure_rotation ?? null,
                          lightsWiperHorn: inspection.check_lights_wiper_horn ?? null,
                          doorLocksCentralLocks: inspection.check_door_locks_central_locks ?? null,
                          customerWorkOrderReceptionBook: inspection.check_customer_work_order_reception_book ?? null
                        }
                      });

                      const ticket = {
                        ...row,
                        mechanic_assignments: mechanicAssignRows,
                        disassembled_parts: disassembledRows,
                        progress_logs: logRows,
                        inspections: inspectionRows.map(formatInspection),
                        outsource_mechanics: mechanicsRows,
                        outsource_stock: stockRows,
                        ordered_parts: orderedRows,
                        tool_assignments: toolRows,
                        insurance: insuranceRows[0] || null
                      };

                      res.json(ticket);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});


// GET /api/tickets/summary
router.get('/summary', (req, res) => {
  const query = `
    SELECT 
      st.ticket_number,
      st.status,
      st.priority,
      st.license_plate,
      st.inspector_assign AS inspectorName,
      ma.mechanic_name AS mechanicName,
      st.completion_date,
      st.estimated_completion_date,
      st.title,
      st.type,
      st.created_at,
      st.description,
      v.make,
      v.model,
      v.year,
      v.license_plate AS vehicle_license_plate,
      v.image,
      st.customer_type,
      st.customer_id,
      CASE 
        WHEN st.customer_type = 'individual' THEN ic.name
        ELSE cc.contact_person_name
      END AS customer_name,
      CASE 
        WHEN st.customer_type = 'individual' THEN ic.email
        ELSE cc.email
      END AS customer_email
    FROM service_tickets st
    JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN mechanic_assignments ma ON st.ticket_number = ma.ticket_number
    LEFT JOIN individual_customers ic ON st.customer_type = 'individual' AND st.customer_id = ic.customer_id
    LEFT JOIN company_customers cc ON st.customer_type = 'company' AND st.customer_id = cc.customer_id
    WHERE st.status IN (
      'pending',
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting survey',
      'awaiting salvage form',
      'survey complete',
      'Payment Requested',
      'Request Payment',  
      'awaiting bill',
      'completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, tickets) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    if (!tickets || tickets.length === 0) return res.json([]);

    const ticketNumbers = tickets.map(t => t.ticket_number);
    if (ticketNumbers.length === 0) return res.json([]);

    // Queries for related tables
    const disassembledQuery = `
      SELECT id, ticket_number, part_name, \`condition\` AS part_condition, status, notes, logged_at, reassembly_verified
      FROM disassembled_parts WHERE ticket_number IN (?) ORDER BY logged_at DESC
    `;
    const logsQuery = `
      SELECT id, ticket_number, date, time, status, description, created_at
      FROM progress_logs WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const inspectionsQuery = `
      SELECT 
        id,
        ticket_number,
        main_issue_resolved,
        reassembly_verified,
        general_condition,
        notes,
        inspection_date,
        inspection_status,
        created_at,
        updated_at,
        check_oil_leaks,
        check_engine_air_filter_oil_coolant_level,
        check_brake_fluid_levels,
        check_gluten_fluid_levels,
        check_battery_timing_belt,
        check_tire,
        check_tire_pressure_rotation,
        check_lights_wiper_horn,
        check_door_locks_central_locks,
        check_customer_work_order_reception_book
      FROM inspections
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    const mechanicsQuery = `
      SELECT id, ticket_number, mechanic_name, phone, payment, payment_method, work_done, notes, created_at
      FROM outsource_mechanics WHERE ticket_number IN (?) ORDER BY created_at DESC
    `;
    const toolsQuery = `
      SELECT id, tool_id, tool_name, ticket_id, ticket_number, assigned_quantity, assigned_by, status, assigned_at, returned_at, updated_at
      FROM tool_assignments WHERE ticket_number IN (?) ORDER BY assigned_at DESC
    `;
    const orderedPartsQuery = `
      SELECT item_id, ticket_number, name, category, sku, price, quantity, status, ordered_at
      FROM ordered_parts WHERE ticket_number IN (?) ORDER BY ordered_at DESC
    `;
    const outsourceStockQuery = `
      SELECT 
        id,
        ticket_number,
        name,
        category,
        sku,
        price,
        quantity,
        source_shop,
        status,
        requested_at,
        received_at,
        notes,
        updated_at,
        (quantity * price) AS total_cost
      FROM outsource_stock 
      WHERE ticket_number IN (?) 
      ORDER BY requested_at DESC
    `;

    const querySafe = (sql, params) =>
      new Promise(resolve => {
        db.query(sql, params, (err, rows) => {
          if (err) {
            console.error('Error executing query:', err.sqlMessage || err);
            return resolve([]);
          }
          resolve(rows || []);
        });
      });

    (async () => {
      const [
        disassembledRows,
        logRows,
        inspectionRows,
        mechanicRows,
        toolRows,
        orderedRows,
        stockRows
      ] = await Promise.all([
        querySafe(disassembledQuery, [ticketNumbers]),
        querySafe(logsQuery, [ticketNumbers]),
        querySafe(inspectionsQuery, [ticketNumbers]),
        querySafe(mechanicsQuery, [ticketNumbers]),
        querySafe(toolsQuery, [ticketNumbers]),
        querySafe(orderedPartsQuery, [ticketNumbers]),
        querySafe(outsourceStockQuery, [ticketNumbers])
      ]);

      const groupByTicket = rows => {
        const map = {};
        rows.forEach(r => {
          if (!map[r.ticket_number]) map[r.ticket_number] = [];
          map[r.ticket_number].push(r);
        });
        return map;
      };

      // Normalize status values to match frontend expectations
      const normalizeStatus = (status) => {
        if (!status) return 'pending';
        
        // Convert database status to frontend format
        const statusMap = {
          'in progress': 'in-progress',
          'Payment Requested': 'payment requested',
          'Awaiting Bill': 'awaiting bill',
          'Awaiting Survey': 'awaiting survey',
          'Awaiting Salvage Form': 'awaiting salvage form',
          'Survey Complete': 'survey complete',
          'Ready for Inspection': 'ready for inspection',
          'Successful Inspection': 'successful inspection',
          'Inspection Failed': 'inspection failed',
          'pending': 'pending',
          'inspection': 'inspection',
          'completed': 'completed'
        };
        
        return statusMap[status.toLowerCase()] || status.toLowerCase();
      };

      const formattedResults = tickets.map(row => ({
        ticket_number: row.ticket_number,
        status: normalizeStatus(row.status),
        priority: row.priority,
        mechanicName: row.mechanicName,
        inspector_assign: row.inspectorName,
        completion_date: row.completion_date,
        estimated_completion_date: row.estimated_completion_date,
        title: row.title,
        type: row.type,
        created_at: row.created_at,
        description: row.description,
        customer: {
          name: row.customer_name,
          email: row.customer_email
        },
        vehicle_info: {
          make: row.make,
          model: row.model,
          year: row.year,
          licensePlate: row.vehicle_license_plate,
          image: row.image
        },
        disassembled_parts: (groupByTicket(disassembledRows)[row.ticket_number] || []),
        progress_logs: (groupByTicket(logRows)[row.ticket_number] || []),
        inspections: (groupByTicket(inspectionRows)[row.ticket_number] || []),
        outsource_mechanics: (groupByTicket(mechanicRows)[row.ticket_number] || []),
        tool_assignments: (groupByTicket(toolRows)[row.ticket_number] || []),
        ordered_parts: (groupByTicket(orderedRows)[row.ticket_number] || []),
        outsource_stock: (groupByTicket(stockRows)[row.ticket_number] || [])
      }));

      res.json(formattedResults);
    })();
  });
});












module.exports = router;
