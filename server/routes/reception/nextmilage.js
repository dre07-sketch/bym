const express = require('express');
const router = express.Router();
const db = require('../../db/connection');

router.get('/next-service-mileage', (req, res) => {
  const query = `
    SELECT 
      c.customer_type,
      c.customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      c.address,
      c.loyalty_points,
      v.id AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.color,
      v.current_mileage,
      v.last_service_mileage,
      COALESCE(v.next_service_mileage, (v.current_mileage + IFNULL(cm.service_interval_km, 5000))) AS next_service_mileage,
      IFNULL(cm.service_interval_km, 5000) AS service_interval_km,
      (COALESCE(v.next_service_mileage, (v.current_mileage + IFNULL(cm.service_interval_km, 5000))) - v.current_mileage) AS remaining_km,
      CASE
        WHEN (COALESCE(v.next_service_mileage, (v.current_mileage + IFNULL(cm.service_interval_km, 5000))) - v.current_mileage) <= 0 THEN 'urgent'
        WHEN (COALESCE(v.next_service_mileage, (v.current_mileage + IFNULL(cm.service_interval_km, 5000))) - v.current_mileage) <= 1000 THEN 'soon'
        WHEN (COALESCE(v.next_service_mileage, (v.current_mileage + IFNULL(cm.service_interval_km, 5000))) - v.current_mileage) <= 2000 THEN 'good'
        ELSE 'good'
      END AS service_status
    FROM (
      SELECT 
        'individual' AS customer_type,
        id,
        customer_id,
        name,
        email,
        phone,
        address,
        loyalty_points
      FROM individual_customers
      UNION ALL
      SELECT 
        'company' AS customer_type,
        id,
        customer_id,
        company_name AS name,
        email,
        phone,
        address,
        loyalty_points
      FROM company_customers
    ) AS c
    LEFT JOIN vehicles v ON v.customer_id = c.customer_id
    LEFT JOIN car_models cm ON LOWER(v.make) = LOWER(cm.make) AND LOWER(v.model) = LOWER(cm.model)
    WHERE v.id IS NOT NULL
    ORDER BY c.customer_type, c.name;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching next service mileage:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err });
    }

    // Group customers with their vehicles
    const grouped = {};
    results.forEach(row => {
      const cid = row.customer_id;
      if (!grouped[cid]) {
        grouped[cid] = {
          customer_type: row.customer_type,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          loyalty_points: row.loyalty_points,
          vehicles: []
        };
      }
      grouped[cid].vehicles.push({
        vehicle_id: row.vehicle_id,
        make: row.make,
        model: row.model,
        year: row.year,
        license_plate: row.license_plate,
        color: row.color,
        current_mileage: row.current_mileage,
        last_service_mileage: row.last_service_mileage,
        service_interval_km: row.service_interval_km,
        next_service_mileage: row.next_service_mileage,
        remaining_km: row.remaining_km,
        service_status: row.service_status
      });
    });

    const customers = Object.values(grouped);
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  });
});


module.exports = router;
