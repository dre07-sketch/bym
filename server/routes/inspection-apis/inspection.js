// routes/inspection.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

// GET inspections with disassembled parts
router.get('/fetch-inspection', (req, res) => {
    const { status } = req.query; // Optional filter from UI: pending, in progress, completed

    let statusCondition = `
        WHERE st.status = 'inspection'
    `;
    const params = [];

    // Optional: further filter by a specific status from UI (if needed)
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
            st.mechanic_assign AS mechanicName,
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

        // Group parts by ticket
        const inspectionsMap = {};

        results.forEach(row => {
            if (!inspectionsMap[row.ticket_number]) {
                inspectionsMap[row.ticket_number] = {
                    ticketNumber: row.ticket_number,
                    id: row.service_ticket_id,
                    mechanicName: row.mechanicName,
                    clientName: row.clientName,
                    licensePlate: row.license_plate,
                    issueDescription: row.issueDescription,
                    assignedDate: row.assignedDate,
                    finishedDate: row.finishedDate,
                    status: row.status,
                    priority: row.priority,
                    vehicleModel: row.vehicleModel,
                    mainIssueResolved: row.main_issue_resolved,
                    generalCondition: row.general_condition,
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


router.post('/update-inspection', (req, res) => {
  const { ticketNumber, mainIssueResolved, reassemblyVerified, generalCondition, notes, inspectionDate } = req.body;

  if (!ticketNumber || !mainIssueResolved || !reassemblyVerified || !generalCondition) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO inspections 
    (ticket_number, main_issue_resolved, reassembly_verified, general_condition, notes, inspection_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [ticketNumber, mainIssueResolved, reassemblyVerified, generalCondition, notes || null, inspectionDate || null],
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
      st.mechanic_assign AS mechanicName,
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
      i.inspection_date
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

    // Group parts under their ticket
    const ticketsMap = {};
    results.forEach(row => {
      if (!ticketsMap[row.ticket_number]) {
        ticketsMap[row.ticket_number] = {
          ticketNumber: row.ticket_number,
          service_ticket_id: row.service_ticket_id,
          clientName: row.clientName,
          licensePlate: row.license_plate,
          issueDescription: row.issueDescription,
          mechanicName: row.mechanicName,
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




module.exports = router;
