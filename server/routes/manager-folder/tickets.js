const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

function generateTicketNumber() {
  const prefix = 'TICK';
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

// Routes

router.post('/', (req, res) => {
  const {
    customer_type,
    customer_id,
    customer_name,
    vehicle_id,
    vehicle_info,
    license_plate,
    title,
    description,
    priority,
    type,
    urgency_level,
    appointment_id
  } = req.body;

  // Validate required fields
  if (
    !customer_type ||
    !customer_id ||
    !customer_name ||
    !vehicle_id ||
    !vehicle_info ||
    !license_plate ||
    !title ||
    !description ||
    !priority ||
    !type
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ticket_number = generateTicketNumber();

  const insertQuery = `
    INSERT INTO service_tickets (
      ticket_number,
      customer_type,
      customer_id,
      customer_name,
      vehicle_id,
      vehicle_info,
      license_plate,
      title,
      description,
      priority,
      type,
      urgency_level,
      appointment_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const insertValues = [
    ticket_number,
    customer_type,
    customer_id,
    customer_name,
    vehicle_id,
    vehicle_info,
    license_plate,
    title,
    description,
    priority,
    type,
    urgency_level || null,
    appointment_id || null
  ];

  db.query(insertQuery, insertValues, (err, result) => {
    if (err) {
      console.error('Error inserting ticket:', err);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    const insertedId = result.insertId;

    db.query('SELECT * FROM service_tickets WHERE id = ?', [insertedId], (err, rows) => {
      if (err) {
        console.error('Error fetching new ticket:', err);
        return res.status(500).json({ error: 'Failed to fetch created ticket' });
      }

      res.status(201).json(rows[0]);
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
      mileage,
      
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

// Get all service tickets
// Get all service tickets
// ===================== Service Tickets API =====================
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
      st.mechanic_assign,
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
      'pending',
      'assigned',
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting bill',
      'completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(ticketsQuery, (err, tickets) => {
    if (err) {
      console.error('Error fetching service tickets:', err);
      return res.status(500).json({ 
        message: 'Database query error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    if (tickets.length === 0) {
      return res.json([]);
    }

    const ticketNumbers = tickets.map(t => t.ticket_number);

    // Queries for related data
    const disassembledQuery = `
      SELECT 
        id, 
        ticket_number, 
        \`condition\` AS part_condition, 
        part_name, 
        status, 
        notes, 
        logged_at, 
        reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number IN (?)
      ORDER BY logged_at DESC
    `;

    const logsQuery = `
      SELECT 
        id, 
        ticket_number, 
        \`date\` AS log_date, 
        \`time\` AS log_time, 
        status, 
        description, 
        created_at
      FROM progress_logs
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
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
        updated_at
      FROM inspections
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    // Fetch related data
    db.query(disassembledQuery, [ticketNumbers], (err, disassembledRows) => {
      if (err) {
        console.error('Error fetching disassembled parts:', err);
        return res.status(500).json({ error: 'Failed to fetch disassembled parts' });
      }

      db.query(logsQuery, [ticketNumbers], (err, logRows) => {
        if (err) {
          console.error('Error fetching progress logs:', err);
          return res.status(500).json({ error: 'Failed to fetch progress logs' });
        }

        db.query(inspectionsQuery, [ticketNumbers], (err, inspectionRows) => {
          if (err) {
            console.error('Error fetching inspections:', err);
            return res.status(500).json({ error: 'Failed to fetch inspections' });
          }

          // Maps
          const disassembledMap = {};
          disassembledRows.forEach(part => {
            if (!disassembledMap[part.ticket_number]) disassembledMap[part.ticket_number] = [];
            disassembledMap[part.ticket_number].push({
              id: part.id,
              part_name: part.part_name,
              condition: part.part_condition,
              status: part.status,
              notes: part.notes,
              logged_at: part.logged_at,
              reassembly_verified: part.reassembly_verified
            });
          });

          const logsMap = {};
          logRows.forEach(log => {
            if (!logsMap[log.ticket_number]) logsMap[log.ticket_number] = [];
            logsMap[log.ticket_number].push({
              id: log.id,
              date: log.log_date,
              time: log.log_time,
              status: log.status,
              description: log.description,
              created_at: log.created_at
            });
          });

          const inspectionsMap = {};
          inspectionRows.forEach(insp => {
            if (!inspectionsMap[insp.ticket_number]) inspectionsMap[insp.ticket_number] = [];
            inspectionsMap[insp.ticket_number].push({
              id: insp.id,
              main_issue_resolved: insp.main_issue_resolved,
              reassembly_verified: insp.reassembly_verified,
              general_condition: insp.general_condition,
              notes: insp.notes,
              inspection_date: insp.inspection_date,
              inspection_status: insp.inspection_status,
              created_at: insp.created_at,
              updated_at: insp.updated_at
            });
          });

          // Format results
          const formattedResults = tickets.map(ticket => ({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            customer_type: ticket.customer_type,
            customer_id: ticket.customer_id,
            customer_name: ticket.customer_name,
            vehicle_id: ticket.vehicle_id,
            vehicle_info: ticket.vehicle_info,
            license_plate: ticket.license_plate,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            type: ticket.type,
            urgency_level: ticket.urgency_level,
            status: ticket.status === 'in progress' ? 'in-progress' : ticket.status,
            appointment_id: ticket.appointment_id,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            estimated_time: ticket.completion_date,
            phone: ticket.phone,
            email: ticket.email,
            vehicle: {
              make: ticket.make,
              model: ticket.model,
              year: ticket.year,
              image: ticket.image,
            },
            assigned_mechanic: ticket.mechanic_assign,
            disassembled_parts: disassembledMap[ticket.ticket_number] || [],
            progress_logs: logsMap[ticket.ticket_number] || [],
            inspections: inspectionsMap[ticket.ticket_number] || []
          }));

          res.json(formattedResults);
        });
      });
    });
  });
});

// ===================== Single Ticket API =====================
router.get('/service_tickets/:ticket_number', (req, res) => {
  const { ticket_number } = req.params;

  const ticketQuery = `
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
      st.mechanic_assign,
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
      COALESCE(ic.phone, cc.phone) AS phone,
      COALESCE(ic.email, cc.email) AS email,
      v.make,
      v.model,
      v.year,
      v.image AS vehicle_image
    FROM service_tickets st
    LEFT JOIN individual_customers ic 
      ON st.customer_id = ic.customer_id AND st.customer_type = 'individual'
    LEFT JOIN company_customers cc 
      ON st.customer_id = cc.customer_id AND st.customer_type = 'company'
    LEFT JOIN vehicles v 
      ON st.vehicle_id = v.id
    WHERE st.ticket_number = ?
    LIMIT 1
  `;

  db.query(ticketQuery, [ticket_number], (err, results) => {
    if (err) {
      console.error('Error fetching service ticket:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    const row = results[0];

    const disassembledQuery = `
      SELECT 
        id, 
        ticket_number, 
        part_name, 
        \`condition\` AS part_condition, 
        status, 
        notes, 
        logged_at, 
        reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number = ?
      ORDER BY logged_at DESC
    `;

    const logsQuery = `
      SELECT 
        id, 
        ticket_number, 
        \`date\` AS log_date, 
        \`time\` AS log_time, 
        status, 
        description, 
        created_at
      FROM progress_logs
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    const inspectionQuery = `
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
        updated_at
      FROM inspections
      WHERE ticket_number = ?
      ORDER BY created_at DESC
    `;

    db.query(disassembledQuery, [ticket_number], (err, disassembledRows) => {
      if (err) {
        console.error('Error fetching disassembled parts:', err);
        return res.status(500).json({ error: 'Failed to fetch disassembled parts' });
      }

      db.query(logsQuery, [ticket_number], (err, logRows) => {
        if (err) {
          console.error('Error fetching progress logs:', err);
          return res.status(500).json({ error: 'Failed to fetch progress logs' });
        }

        db.query(inspectionQuery, [ticket_number], (err, inspectionRows) => {
          if (err) {
            console.error('Error fetching inspections:', err);
            return res.status(500).json({ error: 'Failed to fetch inspections' });
          }

          const ticket = {
            id: row.id,
            ticket_number: row.ticket_number,
            customer_type: row.customer_type,
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            vehicle_id: row.vehicle_id,
            vehicle_info: row.vehicle_info,
            license_plate: row.license_plate,
            title: row.title,
            mechanic_assign: row.mechanic_assign,
            description: row.description,
            priority: row.priority,
            type: row.type,
            urgency_level: row.urgency_level,
            status: row.status,
            appointment_id: row.appointment_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            completion_date: row.completion_date,
            estimated_completion_date: row.estimated_completion_date,
            phone: row.phone,
            email: row.email,
            vehicle: {
              make: row.make,
              model: row.model,
              year: row.year,
              image: row.vehicle_image
            },
            disassembled_parts: disassembledRows.map(part => ({
              id: part.id,
              part_name: part.part_name,
              condition: part.part_condition,
              status: part.status,
              notes: part.notes,
              logged_at: part.logged_at,
              reassembly_verified: part.reassembly_verified
            })),
            progress_logs: logRows.map(log => ({
              id: log.id,
              date: log.log_date,
              time: log.log_time,
              status: log.status,
              description: log.description,
              created_at: log.created_at
            })),
            inspections: inspectionRows.map(insp => ({
              id: insp.id,
              main_issue_resolved: insp.main_issue_resolved,
              reassembly_verified: insp.reassembly_verified,
              general_condition: insp.general_condition,
              notes: insp.notes,
              inspection_date: insp.inspection_date,
              inspection_status: insp.inspection_status,
              created_at: insp.created_at,
              updated_at: insp.updated_at
            }))
          };

          res.json(ticket);
        });
      });
    });
  });
});



// Get a single service ticket by ticket_number


// GET /api/tickets/summary
router.get('/summary', (req, res) => {
  const query = `
    SELECT 
      st.ticket_number,
      st.status,
      st.priority,
      st.license_plate,
      st.inspector_assign AS inspectorName,
      st.mechanic_assign,
      st.completion_date,
      st.estimated_completion_date,
      st.title,
      st.description,
      v.make,
      v.model,
      v.year,
      v.license_plate AS vehicle_license_plate,
      v.image
    FROM service_tickets st
    JOIN vehicles v ON st.vehicle_id = v.id
    WHERE st.status IN (
      'pending',
      'in progress',
      'ready for inspection',
      'inspection',
      'successful inspection',
      'inspection failed',
      'awaiting bill',
      'completed'
    )
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, tickets) => {
    if (err) {
      console.error('Error fetching ticket summary:', err);
      return res.status(500).json({ error: 'Failed to fetch ticket summary' });
    }

    if (tickets.length === 0) {
      return res.json([]);
    }

    const ticketNumbers = tickets.map(t => t.ticket_number);

    // ✅ Disassembled parts query
    const disassembledQuery = `
      SELECT 
        id, 
        ticket_number, 
        part_name, 
        \`condition\` AS part_condition, 
        status, 
        notes, 
        logged_at, 
        reassembly_verified
      FROM disassembled_parts
      WHERE ticket_number IN (?)
      ORDER BY logged_at DESC
    `;

    // ✅ Progress logs query
    const logsQuery = `
      SELECT 
        id, 
        ticket_number, 
        date, 
        time, 
        status, 
        description, 
        created_at
      FROM progress_logs
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    // ✅ Inspections query
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
        updated_at
      FROM inspections
      WHERE ticket_number IN (?)
      ORDER BY created_at DESC
    `;

    db.query(disassembledQuery, [ticketNumbers], (err, disassembledRows) => {
      if (err) {
        console.error('Error fetching disassembled parts:', err);
        return res.status(500).json({ error: 'Failed to fetch disassembled parts' });
      }

      db.query(logsQuery, [ticketNumbers], (err, logRows) => {
        if (err) {
          console.error('Error fetching progress logs:', err);
          return res.status(500).json({ error: 'Failed to fetch progress logs' });
        }

        db.query(inspectionsQuery, [ticketNumbers], (err, inspectionRows) => {
          if (err) {
            console.error('Error fetching inspections:', err);
            return res.status(500).json({ error: 'Failed to fetch inspections' });
          }

          // Group disassembled parts
          const disassembledMap = {};
          disassembledRows.forEach(part => {
            if (!disassembledMap[part.ticket_number]) {
              disassembledMap[part.ticket_number] = [];
            }
            disassembledMap[part.ticket_number].push({
              id: part.id,
              part_name: part.part_name,
              condition: part.part_condition,
              status: part.status,
              notes: part.notes,
              logged_at: part.logged_at,
              reassembly_verified: part.reassembly_verified
            });
          });

          // Group progress logs
          const logsMap = {};
          logRows.forEach(log => {
            if (!logsMap[log.ticket_number]) {
              logsMap[log.ticket_number] = [];
            }
            logsMap[log.ticket_number].push({
              id: log.id,
              date: log.date,
              time: log.time,
              status: log.status,
              description: log.description,
              created_at: log.created_at
            });
          });

          // Group inspections
          const inspectionsMap = {};
          inspectionRows.forEach(insp => {
            if (!inspectionsMap[insp.ticket_number]) {
              inspectionsMap[insp.ticket_number] = [];
            }
            inspectionsMap[insp.ticket_number].push({
              id: insp.id,
              main_issue_resolved: insp.main_issue_resolved,
              reassembly_verified: insp.reassembly_verified,
              general_condition: insp.general_condition,
              notes: insp.notes,
              inspection_date: insp.inspection_date,
              inspection_status: insp.inspection_status,
              created_at: insp.created_at,
              updated_at: insp.updated_at
            });
          });

          // Merge everything into final response
          const formattedResults = tickets.map(row => ({
            ticket_number: row.ticket_number,
            status: row.status,
            priority: row.priority,
            mechanic_assign: row.mechanic_assign,
            inspector_assign: row.inspectorName,
            completion_date: row.completion_date,
            estimated_completion_date: row.estimated_completion_date,
            title: row.title,
            description: row.description,
            vehicle_info: {
              make: row.make,
              model: row.model,
              year: row.year,
              licensePlate: row.vehicle_license_plate,
              image: row.image
            },
            disassembled_parts: disassembledMap[row.ticket_number] || [],
            progress_logs: logsMap[row.ticket_number] || [],
            inspections: inspectionsMap[row.ticket_number] || []
          }));

          res.json(formattedResults);
        });
      });
    });
  });
});







module.exports = router;
