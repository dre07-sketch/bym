// utils/sendNotification.js
const db = require('../db/connection');
const { io } = require('./socket');

function sendNotification({ title, message, related_table, related_id, sender_role, receiver_roles }, callback) {
  const query = `
    INSERT INTO notifications 
    (title, message, related_table, related_id, sender_role, receiver_roles) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    title,
    message,
    related_table || null,
    related_id || null,
    sender_role || null,
    receiver_roles || null
  ], (err, result) => {
    if (err) {
      console.error('❌ Error sending notification:', err.message);
      if (callback) callback(err);
      return;
    }

    console.log(`🔔 Notification sent: ${title} → ${receiver_roles}`);

    // Push real-time to connected clients if socket.io is active
    if (io) {
      receiver_roles.split(',').forEach(role => {
        io.to(role.trim()).emit('notification', {
          title,
          message,
          sender_role,
          related_table,
          related_id,
          created_at: new Date()
        });
      });
    }

    if (callback) callback(null, result);
  });
}

module.exports = { sendNotification };