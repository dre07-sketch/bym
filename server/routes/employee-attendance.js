const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const path = require('path');

// POST /api/employee-attendance
router.post('/', (req, res) => {
  const { employee_id, employee_name, action } = req.body;

  if (!employee_id || !employee_name || !action) {
    return res.status(400).json({ error: 'employee_id, employee_name and action are required' });
  }

  if (action !== 'in' && action !== 'out') {
    return res.status(400).json({ error: 'Invalid action. Must be "in" or "out"' });
  }

  const sql = `INSERT INTO employee_attendance (employee_id, employee_name, action) VALUES (?, ?, ?)`;

  db.query(sql, [employee_id, employee_name, action], (err, results) => {
    if (err) {
      console.error('Error inserting attendance:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance_id: results.insertId
    });
  });
});

// GET /api/employees/:id
// This assumes this route is defined within your employee attendance router (e.g., employeeAttendanceRoutes.js)
// and handles GET requests to '/getempsattendance'

// Inside your employee attendance router file (e.g., employeeAttendanceRoutes.js)
// Handling GET requests to '/getempsattendance'

router.get('/getempsattendance', (req, res) => {
  // 1. Get the employeeId from query parameters
  const employeeId = req.query.employeeId;

  // 2. Validate the employeeId
  if (!employeeId) {
    return res.status(400).json({ error: 'Missing employeeId query parameter' });
  }

  // 3. Define the SQL query to fetch attendance records for the given employeeId
  // This query fetches 'in' and 'out' records, ordering by timestamp descending
  const query = `
    SELECT 
      attendance_id,
      employee_id,
      employee_name,
      action,
      timestamp
    FROM employee_attendance -- *** Make sure this matches your actual table name ***
    WHERE employee_id = ?
    ORDER BY timestamp DESC`; // Order by timestamp, newest first

  // 4. Execute the query
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Detailed DB Error for employee ID:', employeeId, err);
      return res.status(500).json({ error: 'An internal server error occurred while fetching attendance data.' });
    }

    // 5. Transform the flat list of 'in'/'out' actions into grouped records by date
    // Expected format for React: [{ date: 'YYYY-MM-DD', status: 'Present/Absent', check_in: 'HH:MM:SS', check_out: 'HH:MM:SS' }, ...]

    // Group results by date
    const recordsByDate = {};
    results.forEach(record => {
      // Extract the date part (YYYY-MM-DD) from the timestamp
      const dateKey = new Date(record.timestamp).toISOString().split('T')[0];

      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = {
          date: dateKey,
          status: 'Absent', // Default status, will be updated if 'in' is found
          check_in: null,
          check_out: null
        };
      }

      const dateRecord = recordsByDate[dateKey];

      if (record.action === 'in') {
        dateRecord.check_in = new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // Format HH:MM:SS
        // If there's a check-in, consider the status Present for that day
        // (You might adjust logic if check-out is also required for 'Present')
        dateRecord.status = 'Present';
      } else if (record.action === 'out' && !dateRecord.check_out) {
        // Only set check_out if it hasn't been set yet (take the first 'out' of the day if multiple)
        // Alternatively, you could take the last 'out' by checking if current time is later
        dateRecord.check_out = new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
         // If there's a check-out, likely the status should be Present if there was also a check-in
        // This simple logic assumes 'out' implies 'in' happened, or you can refine it.
        // Let's refine: only set to Present if there's also a check_in, otherwise keep Absent or adjust as needed.
        if (dateRecord.check_in) {
             dateRecord.status = 'Present';
        }
      }
      // Handle cases where there might be multiple 'in' or 'out' actions per day if needed
      // For now, taking the first 'in' and first 'out' per day
    });

    // Convert the grouped object back to an array
    const transformedData = Object.values(recordsByDate);

    // Sort the final array by date descending (optional, as Object.values order isn't guaranteed, but likely insertion order for string keys)
    transformedData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 6. Send the transformed data back as JSON
    res.json(transformedData);
  });
});




module.exports = router;
