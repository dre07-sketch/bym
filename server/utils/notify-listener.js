// utils/notify-listener.js
const events = require('./events');
console.log('🟢 notify-listener.js loaded');
const { sendNotification } = require('./sendNotification');

// Track recent notifications to prevent duplicates
const recentNotifications = new Map();
const NOTIFICATION_DUPLICATE_WINDOW = 5000; // 5 seconds

// Deduplication function
async function deduplicatedNotification(notificationData) {
  const { title, message, related_table, related_id } = notificationData;
  
  // Create a unique key for this notification
  const notificationKey = `${title}:${message}:${related_table}:${related_id}`;
  
  // Check if we've sent this notification recently
  if (recentNotifications.has(notificationKey)) {
    const lastSent = recentNotifications.get(notificationKey);
    if (Date.now() - lastSent < NOTIFICATION_DUPLICATE_WINDOW) {
      console.log(`🚫 Duplicate notification prevented: ${title}`);
      return;
    }
  }
  
  // Record this notification
  recentNotifications.set(notificationKey, Date.now());
  
  // Clean up old entries periodically
  if (recentNotifications.size > 100) {
    const now = Date.now();
    for (const [key, timestamp] of recentNotifications.entries()) {
      if (now - timestamp > NOTIFICATION_DUPLICATE_WINDOW) {
        recentNotifications.delete(key);
      }
    }
  }
  
  // Send the actual notification
  await sendNotification(notificationData);
}

// Use a module-level flag to ensure we only run once
let initialized = false;

if (initialized) {
  console.log('⚙️ Notify listeners already initialized — skipping');
  return;
}

initialized = true;

console.log('✅ Registering notification listeners...');

// Remove all existing listeners to start fresh
events.removeAllListeners();

// 1️⃣ For manager when new ticket is created
events.on('ticket_created', async (data) => {
  await deduplicatedNotification({
    title: 'New Ticket Created',
    message: `A new ticket (${data.ticketNumber}) was created by ${data.creatorRole}.`,
    related_table: 'service_tickets',
    related_id: data.ticketId,
    sender_role: data.creatorRole,
    receiver_roles: 'reception,customer-service,manager'
  });
});

// 2️⃣ Due salary of employees (for reception/customer-service and manager)
events.on('salary_due', async (data) => {
  await deduplicatedNotification({
    title: 'Employee Salary Due',
    message: `${data.employeeName}'s salary is due this month.`,
    related_table: 'employee_payments',
    related_id: data.paymentId,
    sender_role: 'Finance',
    receiver_roles: 'manager,reception,customer-service'
  });
});

// 3️⃣ For manager when there is new status updates to tickets
events.on('ticket_status_updated', async (data) => {
  await deduplicatedNotification({
    title: 'Ticket Status Updated',
    message: `Ticket ${data.ticketNumber} updated to ${data.status}.`,
    related_table: 'service_tickets',
    related_id: data.ticketId,
    sender_role: data.updatedByRole,
    receiver_roles: 'manager'
  });
});

// 4️⃣ Appointment/SOS/Insurance converted to ticket
events.on('appointment_converted', async (data) => {
  await deduplicatedNotification({
    title: 'Appointment Converted to Ticket',
    message: `Appointment for ${data.customerName} converted to ticket ${data.ticketNumber}.`,
    related_table: 'appointments',
    related_id: data.appointmentId,
    sender_role: 'Reception',
    receiver_roles: 'manager,reception,customer-service'
  });
});

events.on('sos_converted', async (data) => {
  await deduplicatedNotification({
    title: 'SOS Request Converted to Ticket',
    message: `SOS request for ${data.vehiclePlate} has been converted to ticket ${data.ticketNumber}.`,
    related_table: 'sos_requests',
    related_id: data.sosId,
    sender_role: 'Reception',
    receiver_roles: 'manager,reception,customer-service'
  });
});

events.on('insurance_converted', async (data) => {
  await deduplicatedNotification({
    title: 'Insurance Approved and Ticket Created',
    message: `Insurance case for ${data.customerName} approved and converted to ticket ${data.ticketNumber}.`,
    related_table: 'insurance_requests',
    related_id: data.insuranceId,
    sender_role: 'Reception',
    receiver_roles: 'manager,reception,customer-service'
  });
});

// 5️⃣ Feedback and rating received
events.on('feedback_received', async (data) => {
  await deduplicatedNotification({
    title: 'New Customer Feedback',
    message: `${data.customerName} left feedback: "${data.feedbackSnippet}" (${data.rating}/5).`,
    related_table: 'feedback',
    related_id: data.feedbackId,
    sender_role: 'Customer',
    receiver_roles: 'manager,reception,customer-service'
  });
});

// 6️⃣ Next service mileage is due
events.on('service_due', async (data) => {
  await deduplicatedNotification({
    title: 'Next Service Mileage Due',
    message: `Vehicle ${data.licensePlate} is due for service at ${data.mileage} km.`,
    related_table: 'vehicles',
    related_id: data.vehicleId,
    sender_role: 'System',
    receiver_roles: 'communication,reception,customer-service'
  });
});

// 7️⃣ Manager — parts coordinator returned disassembled parts
events.on('parts_returned', async (data) => {
  await deduplicatedNotification({
    title: 'Parts Returned from Disassembly',
    message: `Part Coordinator ${data.coordinatorName} returned disassembled parts for ticket ${data.ticketNumber}.`,
    related_table: 'disassembled_parts',
    related_id: data.recordId,
    sender_role: 'Part Coordinator',
    receiver_roles: 'manager'
  });
});

// 8️⃣ Stock manager — stock is low
events.on('stock_low', async (data) => {
  await deduplicatedNotification({
    title: 'Low Stock Alert',
    message: `${data.itemName} is running low (remaining: ${data.quantity}).`,
    related_table: 'inventory',
    related_id: data.itemId,
    sender_role: 'System',
    receiver_roles: 'stock-manager,manager'
  });
});

// 9️⃣ Manager & reception/customer-service — outsourced or ordered parts delivered
events.on('outsourced_parts_delivered', async (data) => {
  await deduplicatedNotification({
    title: 'Outsourced Parts Delivered',
    message: `Outsourced parts for ticket ${data.ticketNumber} have been delivered.`,
    related_table: 'outsource_parts',
    related_id: data.outsourceId,
    sender_role: 'Part Coordinator',
    receiver_roles: 'manager,reception,customer-service'
  });
});

events.on('ordered_parts_delivered', async (data) => {
  await deduplicatedNotification({
    title: 'Ordered Parts Delivered',
    message: `Ordered parts for ticket ${data.ticketNumber} have been received and updated in stock.`,
    related_table: 'purchase_orders',
    related_id: data.orderId,
    sender_role: 'Stock Manager',
    receiver_roles: 'manager,reception,customer-service'
  });
});

// 🔟 Manager & stock manager — every step of purchase order
events.on('purchase_order_step', async (data) => {
  await deduplicatedNotification({
    title: 'Purchase Order Progress',
    message: `Purchase order #${data.orderNumber} is now in stage "${data.stage}".`,
    related_table: 'purchase_orders',
    related_id: data.orderId,
    sender_role: data.triggeredBy,
    receiver_roles: 'manager,stock-manager'
  });
});

// 11️⃣ Stock added
events.on('stock_added', async (data) => {
  await deduplicatedNotification({
    title: 'New Stock Added',
    message: `${data.itemName} (${data.quantity} units) added to inventory.`,
    related_table: 'inventory',
    related_id: data.itemId,
    sender_role: 'Stock Manager',
    receiver_roles: 'manager'
  });
});

// 12️⃣ Tools damaged
events.on('tool_damaged', async (data) => {
  await deduplicatedNotification({
    title: 'Tool Damage Reported',
    message: `${data.toolName} reported as damaged by ${data.reportedBy}.`,
    related_table: 'tools',
    related_id: data.toolId,
    sender_role: data.reportedByRole,
    receiver_roles: 'manager'
  });
});

// 13️⃣ Low tool stock
events.on('tool_stock_low', async (data) => {
  await deduplicatedNotification({
    title: 'Low Tool Stock',
    message: `Tool ${data.toolName} is running low (remaining: ${data.remaining}).`,
    related_table: 'tools',
    related_id: data.toolId,
    sender_role: 'System',
    receiver_roles: 'manager'
  });
});

// 14️⃣ Tools assigned to a ticket
// events.on('tool_assigned', async (data) => {
//   console.log('Tool assignment notification:', data);
//   await deduplicatedNotification({
//     title: 'Tools Assigned to Ticket',
//     message: `Tools have been assigned to ticket ${data.ticketNumber}.`,
//     related_table: 'tool_assignments',
//     related_id: data.assignmentId,
//     sender_role: 'Workshop',
//     receiver_roles: 'manager,reception,customer-service'
//   });
// });

// 15️⃣ Ticket inspection passes or fails
events.on('inspection_result', async (data) => {
  await deduplicatedNotification({
    title: 'Inspection Result',
    message: `Ticket ${data.ticketNumber} inspection ${data.result === 'pass' ? 'passed' : 'failed'}.`,
    related_table: 'inspection_reports',
    related_id: data.inspectionId,
    sender_role: 'Inspection Team',
    receiver_roles: 'manager'
  });
});

// 16️⃣ Tickets in progress (Part Coordinator)
events.on('ticket_in_progress', async (data) => {
  await deduplicatedNotification({
    title: 'Ticket In Progress',
    message: `Ticket ${data.ticketNumber} is now marked as "In Progress".`,
    related_table: 'service_tickets',
    related_id: data.ticketId,
    sender_role: 'System',
    receiver_roles: 'part-coordinator'
  });
});

// 17️⃣ Communication — awaiting survey/salvage/payment
events.on('communication_stage_update', async (data) => {
  await deduplicatedNotification({
    title: 'Ticket in Communication Stage',
    message: `Ticket ${data.ticketNumber} is now "${data.stage}".`,
    related_table: 'service_tickets',
    related_id: data.ticketId,
    sender_role: 'System',
    receiver_roles: 'communication'
  });
});

// 18️⃣ For salary processed (when payment is made)
events.on('salary_processed', async (data) => {
  await deduplicatedNotification({
    title: 'Employee Salary Paid',
    message: `${data.employeeName}'s salary of $${data.amount} has been processed.`,
    related_table: 'employee_payments',
    related_id: data.paymentId,
    sender_role: 'Finance',
    receiver_roles: 'manager,reception,customer-service'
  });
});

console.log('✅ Notification listener loaded (18 events active).');