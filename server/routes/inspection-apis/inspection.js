// routes/inspection.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// GET inspections with disassembled parts
router.get('/fetch-inspection', (req, res) => {
    const { status } = req.query; // Optional filter from UI: pending, in progress, completed

    let statusCondition = `WHERE st.status = 'inspection'`;
    const params = [];

    if (status && status !== 'all') {
        statusCondition += ' AND st.status = ?';
        params.push(status);
    }

    const query = `
        SELECT 
            st.ticket_number,
            st.id AS service_ticket_id,
            st.customer_name AS clientName,
            st.license_plate,
            st.description AS issueDescription,
            st.priority,
            st.status,
            st.vehicle_info AS vehicleModel,
            st.created_at AS assignedDate,
            st.estimated_completion_date AS estimatedCompletionDate,
            st.completion_date AS finishedDate,
            dp.part_name,
            dp.condition AS part_condition,
            dp.status AS part_status,
            dp.reassembly_verified,
            dp.notes AS part_notes
        FROM service_tickets st
        LEFT JOIN disassembled_parts dp 
            ON st.ticket_number = dp.ticket_number
        ${statusCondition}
        ORDER BY st.created_at DESC
    `;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching inspections:', err);
            return res.status(500).json({ error: 'Failed to fetch inspections' });
        }

        // Fetch all mechanics for the listed tickets
        const ticketNumbers = [...new Set(results.map(r => r.ticket_number))];
        if (ticketNumbers.length === 0) return res.json([]);

        const mechanicsQuery = `
            SELECT ticket_number, mechanic_name
            FROM mechanic_assignments
            WHERE ticket_number IN (?)
        `;

        db.query(mechanicsQuery, [ticketNumbers], (err, mechanicsRows) => {
            if (err) {
                console.error('Error fetching mechanics:', err);
                return res.status(500).json({ error: 'Failed to fetch mechanics' });
            }

            // Map mechanics by ticket number
            const mechanicsMap = {};
            mechanicsRows.forEach(m => {
                if (!mechanicsMap[m.ticket_number]) mechanicsMap[m.ticket_number] = [];
                mechanicsMap[m.ticket_number].push(m.mechanic_name);
            });

            // Group results and attach mechanics
            const inspectionsMap = {};
            results.forEach(row => {
                if (!inspectionsMap[row.ticket_number]) {
                    inspectionsMap[row.ticket_number] = {
                        ticketNumber: row.ticket_number,
                        id: row.service_ticket_id,
                        mechanics: mechanicsMap[row.ticket_number] || [],
                        clientName: row.clientName,
                        licensePlate: row.license_plate,
                        issueDescription: row.issueDescription,
                        assignedDate: row.assignedDate,
                        finishedDate: row.finishedDate,
                        status: row.status,
                        priority: row.priority,
                        vehicleModel: row.vehicleModel,
                        parts: []
                    };
                }

                if (row.part_name) {
                    inspectionsMap[row.ticket_number].parts.push({
                        partName: row.part_name,
                        condition: row.part_condition,
                        status: row.part_status,
                        reassemblyVerified: row.reassembly_verified,
                        notes: row.part_notes
                    });
                }
            });

            res.json(Object.values(inspectionsMap));
        });
    });
});



router.post('/update-inspection', (req, res) => {
  const { 
    ticketNumber, 
    mainIssueResolved, 
    reassemblyVerified, 
    generalCondition, 
    notes, 
    inspectionDate,
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
  } = req.body;

  if (!ticketNumber || !mainIssueResolved || !reassemblyVerified || !generalCondition) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // convert checkboxes to "Yes" or "No"
  const normalizeCheck = (val) => (val ? "Yes" : "No");

  const query = `
    INSERT INTO inspections 
    (
      ticket_number, 
      main_issue_resolved, 
      reassembly_verified, 
      general_condition, 
      notes, 
      inspection_date,
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      ticketNumber, 
      mainIssueResolved, 
      reassemblyVerified, 
      generalCondition, 
      notes || null, 
      inspectionDate || null,
      normalizeCheck(check_oil_leaks),
      normalizeCheck(check_engine_air_filter_oil_coolant_level),
      normalizeCheck(check_brake_fluid_levels),
      normalizeCheck(check_gluten_fluid_levels),
      normalizeCheck(check_battery_timing_belt),
      normalizeCheck(check_tire),
      normalizeCheck(check_tire_pressure_rotation),
      normalizeCheck(check_lights_wiper_horn),
      normalizeCheck(check_door_locks_central_locks),
      normalizeCheck(check_customer_work_order_reception_book)
    ],
    (err, result) => {
      if (err) {
        console.error('Error saving inspection:', err);
        return res.status(500).json({ message: 'Failed to save inspection' });
      }

      return res.status(200).json({
        message: 'Inspection saved successfully',
        inspectionId: result.insertId,
      });
    }
  );
});


// -------------------------------
// POST /update-inspection-status
// Set inspection_status in inspections table: 'pass' or 'fail'
// -------------------------------
router.post('/update-inspection-status', (req, res) => {
  const { ticketNumber, inspectionStatus } = req.body;

  if (!ticketNumber) {
    return res.status(400).json({ message: 'ticketNumber required' });
  }
  if (!inspectionStatus || !['pass', 'fail'].includes(inspectionStatus)) {
    return res.status(400).json({ message: 'Must be "pass" or "fail"' });
  }

  // Step 1: Update the latest inspection
  const updateInspection = `
    UPDATE inspections 
    SET inspection_status = ? 
    WHERE ticket_number = ? 
    ORDER BY id DESC 
    LIMIT 1
  `;

  db.query(updateInspection, [inspectionStatus, ticketNumber], (err, result) => {
    if (err) {
      console.error('❌ Error updating inspections:', err);
      return res.status(500).json({ message: 'Failed to update inspection' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No inspection found for this ticket' });
    }

    console.log(`✅ Updated inspections for ${ticketNumber} → ${inspectionStatus}`);

    // Step 2: Map inspection result → service_tickets.status
    let newStatus = '';
    if (inspectionStatus === 'pass') newStatus = 'awaiting bill';
    if (inspectionStatus === 'fail') newStatus = 'inspection failed';

    const updateTicket = `
      UPDATE service_tickets 
      SET status = ? 
      WHERE ticket_number = ?
    `;

    db.query(updateTicket, [newStatus, ticketNumber], (err2, result2) => {
      if (err2) {
        console.error('❌ Error updating service_tickets:', err2);
        return res.status(500).json({ message: 'Failed to update ticket' });
      }
      if (result2.affectedRows === 0) {
        return res.status(404).json({ message: 'Ticket not found in service_tickets' });
      }

      console.log(`✅ Updated service_tickets for ${ticketNumber} → ${newStatus}`);

      res.status(200).json({
        message: 'Success',
        inspectionStatus,
        newTicketStatus: newStatus
      });
    });
  });
});




router.get('/completed-with-parts', (req, res) => {
  const query = `
    SELECT 
      st.ticket_number,
      st.id AS service_ticket_id,
      st.customer_name AS clientName,
      st.license_plate,
      st.description AS issueDescription,
      st.priority,
      st.status,
      st.vehicle_info AS vehicleModel,
      st.created_at AS assignedDate,
      st.estimated_completion_date AS estimatedCompletionDate,
      st.completion_date AS finishedDate,
      dp.part_name,
      dp.condition AS part_condition,
      dp.status AS part_status,
      dp.notes AS part_notes,
      i.main_issue_resolved,
      i.general_condition,
      i.reassembly_verified,
      i.notes AS inspectionNotes,
      i.inspection_status,
      i.inspection_date,
      i.check_oil_leaks,
      i.check_engine_air_filter_oil_coolant_level,
      i.check_brake_fluid_levels,
      i.check_gluten_fluid_levels,
      i.check_battery_timing_belt,
      i.check_tire,
      i.check_tire_pressure_rotation,
      i.check_lights_wiper_horn,
      i.check_door_locks_central_locks,
      i.check_customer_work_order_reception_book
    FROM service_tickets st
    LEFT JOIN disassembled_parts dp 
      ON st.ticket_number = dp.ticket_number
    LEFT JOIN inspections i 
      ON i.ticket_number = st.ticket_number
    WHERE st.status IN ('completed', 'awaiting bill')
      AND i.id = (
        SELECT id FROM inspections 
        WHERE ticket_number = st.ticket_number 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    ORDER BY st.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching completed/awaiting bill service tickets with parts:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const ticketNumbers = [...new Set(results.map(r => r.ticket_number))];
    if (ticketNumbers.length === 0) return res.json([]);

    const mechanicsQuery = `
      SELECT ticket_number, mechanic_name
      FROM mechanic_assignments
      WHERE ticket_number IN (?)
    `;

    db.query(mechanicsQuery, [ticketNumbers], (err, mechanicsRows) => {
      if (err) {
        console.error('Error fetching mechanics:', err);
        return res.status(500).json({ message: 'Failed to fetch mechanics' });
      }

      // helper to normalize yes/no/1/0 into true/false/null
      const normalizeCheck = (val) => {
        if (val === 'yes' || val === 'YES' || val === 1 || val === true) return true;
        if (val === 'no' || val === 'NO' || val === 0 || val === false) return false;
        return null;
      };

      const mechanicsMap = {};
      mechanicsRows.forEach(m => {
        if (!mechanicsMap[m.ticket_number]) mechanicsMap[m.ticket_number] = [];
        mechanicsMap[m.ticket_number].push(m.mechanic_name);
      });

      const ticketsMap = {};
      results.forEach(row => {
        if (!ticketsMap[row.ticket_number]) {
          ticketsMap[row.ticket_number] = {
            ticketNumber: row.ticket_number,
            service_ticket_id: row.service_ticket_id,
            clientName: row.clientName,
            licensePlate: row.license_plate,
            issueDescription: row.issueDescription,
            mechanics: mechanicsMap[row.ticket_number] || [],
            priority: row.priority,
            status: row.status,
            vehicleModel: row.vehicleModel,
            assignedDate: row.assignedDate,
            estimatedCompletionDate: row.estimatedCompletionDate,
            finishedDate: row.finishedDate,
            mainIssueResolved: row.main_issue_resolved,
            generalCondition: row.general_condition,
            reassemblyVerified: row.reassembly_verified,
            notes: row.inspectionNotes,
            inspectionStatus: row.inspection_status,
            inspectionDate: row.inspection_date,
            checklist: {
              oilLeaks: normalizeCheck(row.check_oil_leaks),
              engineAirFilterOilCoolant: normalizeCheck(row.check_engine_air_filter_oil_coolant_level),
              brakeFluidLevels: normalizeCheck(row.check_brake_fluid_levels),
              glutenFluidLevels: normalizeCheck(row.check_gluten_fluid_levels),
              batteryTimingBelt: normalizeCheck(row.check_battery_timing_belt),
              tire: normalizeCheck(row.check_tire),
              tirePressureRotation: normalizeCheck(row.check_tire_pressure_rotation),
              lightsWiperHorn: normalizeCheck(row.check_lights_wiper_horn),
              doorLocksCentralLocks: normalizeCheck(row.check_door_locks_central_locks),
              customerWorkOrderReceptionBook: normalizeCheck(row.check_customer_work_order_reception_book)
            },
            replacedParts: []
          };
        }

        if (row.part_name) {
          ticketsMap[row.ticket_number].replacedParts.push({
            partName: row.part_name,
            condition: row.part_condition,
            status: row.part_status,
            notes: row.part_notes
          });
        }
      });

      const tickets = Object.values(ticketsMap);
      res.json(tickets);
    });
  });
});





module.exports = router;
