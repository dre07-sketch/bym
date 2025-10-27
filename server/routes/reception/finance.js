// routes/employeePayments.js
const express = require('express');
const router = express.Router();
const db = require('../../db/connection'); // your MySQL connection
const events = require('../../utils/events');

// POST /api/employee-payment
// POST /employee-payment
router.post('/employee-payment', (req, res) => {
  const { employeeId, employeeName, salary, date, paymentMethod, note } = req.body;

  // Validation
  if (!employeeId || !employeeName || !salary || !date || !paymentMethod || !note) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO employee_payments 
      (employee_id, employee_name, salary, payment_date, payment_method, note, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Paid')
  `;

  const values = [employeeId, employeeName, salary, date, paymentMethod, note];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('❌ Error inserting payment:', err);
      return res.status(500).json({ success: false, message: 'Failed to process payment' });
    }
events.emit('salary_processed', {
    paymentId: result.insertId,
    employeeName: employeeName,
    amount: salary,
    paymentDate: date,
    paymentMethod: paymentMethod
  });
    res.json({
      success: true,
      message: `Payment of $${salary} recorded for ${employeeName}`,
      paymentId: result.insertId
    });
  });
});



router.get('/upcoming-salaries', (req, res) => {
  const today = new Date();
  const currentDay = today.getDate();

  const query = `
    SELECT 
      id, 
      full_name, 
      email, 
      phone_number, 
      address, 
      join_date, 
      role, 
      specialty, 
      expertise, 
      experience, 
      is_mechanic_permanent, 
      salary, 
      working_hours, 
      image_url,
      DAY(created_at) AS salary_day
    FROM employees
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching employees:', err);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }

    if (!results || results.length === 0) return res.json([]);

    // Filter employees whose salary day is within the next 5 days
    const upcomingEmployees = results.filter(emp => {
      const salaryDay = emp.salary_day;
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      let daysUntilSalary = salaryDay - currentDay;
      if (daysUntilSalary < 0) daysUntilSalary += daysInMonth;
      return daysUntilSalary <= 5;
    });

    const formattedResults = upcomingEmployees.map(item => {
      let expertiseArray = [];
      if (item.expertise) {
        if (Array.isArray(item.expertise)) {
          expertiseArray = item.expertise;
        } else if (typeof item.expertise === 'string') {
          expertiseArray = item.expertise.split(',').map(s => s.trim());
        }
      }

      return {
        id: item.id,
        name: item.full_name,
        email: item.email,
        phone: item.phone_number,
        location: item.address,
        joinDate: item.join_date,
        role: item.role,
        specialty: item.specialty,
        expertise: expertiseArray,
        experience: item.experience,
        employmentType: item.is_mechanic_permanent,
        salary: item.salary,
        workingHours: item.working_hours,
        image: item.image_url ? `https://ipasystem.bymsystem.com/uploads/${item.image_url}` : null,
        salaryDay: item.salary_day
      };
    });
    upcomingEmployees.forEach(emp => {
    events.emit('salary_due', {
      paymentId: null, // No payment ID yet, just a notification that salary is due
      employeeName: emp.full_name
    });
  });

    res.json(formattedResults);
  });
});

router.get('/payment-history/:employeeId', (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'Missing employeeId parameter' });
  }

  const query = `
    SELECT 
      id,
      employee_id,
      employee_name,
      salary,
      payment_date,
      payment_method,
      note,
      status,
      created_at
    FROM employee_payments
    WHERE employee_id = ?
    ORDER BY payment_date DESC
  `;

  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching payment history:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }

    const formattedResults = results.map(item => ({
      id: item.id,
      employeeId: item.employee_id,
      employeeName: item.employee_name,
      amount: item.salary,
      date: item.payment_date,
      method: item.payment_method,
      note: item.note,
      status: item.status
    }));

    res.json({ success: true, payments: formattedResults });
  });
});

module.exports = router;
