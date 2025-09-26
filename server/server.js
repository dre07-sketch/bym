const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const db = require('./db/connection');
const ticketsRoutes = require('./routes/manager-folder/tickets');
const customerRoutes = require('./routes/reception/customer');
const appointmentsRoutes = require('./routes/reception/appointments');
const employeesRoutes = require('./routes/reception/employees');
const employeeattendanceRoutes = require('./routes/reception/employee-attendance.js');
const sosRoutes = require('./routes/reception/sos');
const receptionanalyticsRoutes = require('./routes/analytics/reception-analytics')
const processRoutes = require('./routes/manager-folder/process')
const mechanicRoutes= require('./routes/manager-folder/mechanic')
const activerepairRoutes = require('./routes/manager-folder/active-repars')
const customermanageRoutes = require('./routes/manager-folder/customer-manege')
const manageranalyticsRoutes = require('./routes/analytics/manager-analytics')
const activeticketsRoutes = require('./routes/part-cordinator-api/active-ticktes')
const progresslogsRoutes = require('./routes/part-cordinator-api/progress')
const disassembledpartsRoutes = require('./routes/part-cordinator-api/disassembled')
const partcordinatoranalyticsRoutes = require ('./routes/analytics/part-cordinator-analytics.js')
const inspectionRoutes =require ('./routes/inspection-apis/inspection.js')
const inspectionAnalysisRoutes = require('./routes/analytics/inspection-analysis.js')
const inventoryItemRoutes = require('./routes/stock-management-system/inventory-item'); 
const toolsRoutes = require('./routes/tools-management-system/tools'); // Assuming you have a tools management system
const damageReportsRoutes = require('./routes/tools-management-system/damage-reports'); // Importing the damage reports routes
const completedCarsRoutes = require('./routes/manager-folder/completed-cars'); // Importing completed cars routes
const outsource_mechanic_paymentsRoutes = require('./routes/reception/outsource_mechanic_payments');  
const FinanceRoutes = require('./routes/reception/finance');
const billRoutes = require('./routes/reception/bill'); // Importing bill routes
const communicationRoutes = require('./routes/communication-center/communication-center.js'); // Importing communication routes
const communicationstatsRoutes = require('./routes/communication-center/stats.js'); // Importing communication analytics routes
const marketingRoutes = require('./routes/marketing-management-system/marketing-activity.js'); // Importing marketing routes
const insuranceRoutes = require('./routes/reception/insurance'); // Importing insurance routes
const purchaseOrdersRoutes = require('./routes/manager-folder/purchaseOrders'); // Importing purchase orders routes
const loginRoutes = require('./routes/auth/login'); // Importing login routesW
const resetPasswordRoutes = require('./routes/auth/reset-password'); // Importing reset password routes


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: 'http://localhost:3000'  // or whatever your React dev server runs on
}));


//-------------auth--------------
app.use('/api/auth', loginRoutes);
app.use('/api/auth-rest', resetPasswordRoutes);

//-------------customer--------------
app.use('/api/customers', customerRoutes);

//-------------tickets--------------
app.use('/api/tickets',ticketsRoutes)
app.use('/api/tik', ticketsRoutes)

//-------------appointments------------
app.use('/api/appointments',appointmentsRoutes)
app.use('/api/app', appointmentsRoutes)

//-------------employees------------
app.use('/api/employees',employeesRoutes)

//-------------employees-attendance------------
app.use('/api/employeeattendance',employeeattendanceRoutes)

//------------------sos api------------------------------
app.use('/api/sos-request',sosRoutes)

//---------------analytics for reception-------------------
app.use('/api/ticket-stats',receptionanalyticsRoutes)

//----------------proccess----------------
app.use('/api/process',processRoutes)

//---------------mechanic-----------
app.use('/api/mechanic',mechanicRoutes)

//------------avtive-progress-----------
app.use('/api/active-progress',activerepairRoutes)

//------------customer-manege------------
app.use('/api/customer-manege',customermanageRoutes)

//------------inspection-team-fetch------------


//--------------manager-analytics-----------
app.use('/api/manager-analytics',manageranalyticsRoutes)

//-------------active-tickets--------------
app.use('/api/active-tickets',activeticketsRoutes)

//------------part cordinator analytics----------
app.use('/api/part-cordinator-analytics',partcordinatoranalyticsRoutes)

//---------------progress-logs--------------
app.use('/api/progress',progresslogsRoutes)

//---------------disassmbled-logs------------
app.use('/api/disassmbled',disassembledpartsRoutes)

//-----------inspection-fetch------------
app.use('/api/inspection-endpoint',inspectionRoutes)

//-----------inspection-analysis------------
app.use('/api/inspection-analysis', inspectionAnalysisRoutes);

//----------------completed cars----------------
app.use('/api/completed-cars', completedCarsRoutes);

//----------------inventory item----------------
app.use('/api/inventory', inventoryItemRoutes);

//----------------tools management system----------------
app.use('/api/tools', toolsRoutes);

app.use('/api/damage-reports', damageReportsRoutes); // Using the damage reports routes

//----------------outsource mechanic payments----------------
app.use('/api/outsource-mechanic-payments', outsource_mechanic_paymentsRoutes);

//----------------finance----------------
app.use('/api/finance', FinanceRoutes);

//----------------bill----------------
app.use('/api/bill', billRoutes);

//----------------communication center----------------
app.use('/api/communication-center', communicationRoutes);
app.use('/api/communication-stats', communicationstatsRoutes);

//----------------marketing management system----------------
app.use('/api/marketing-activities', marketingRoutes);

//----------------insurance----------------
app.use('/api/insurance', insuranceRoutes);

//----------------purchase orders----------------
app.use('/api/purchase-orders', purchaseOrdersRoutes);




// Check MySQL before starting server
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL not connected. Please start XAMPP MySQL.');
    console.error(err.message);
    process.exit(1);
  } else {
    console.log('✅ MySQL connected.');
    connection.release();

    const PORT = 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  }
});
