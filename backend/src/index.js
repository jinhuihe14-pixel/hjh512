require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { prisma } = require('./prisma');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '密室逃脱系统后端运行正常' });
});

const roomRoutes = require('./routes/rooms');
const sessionRoutes = require('./routes/sessions');
const bookingRoutes = require('./routes/bookings');
const employeeRoutes = require('./routes/employees');
const snackRoutes = require('./routes/snacks');
const posRoutes = require('./routes/pos');
const payrollRoutes = require('./routes/payroll');
const statsRoutes = require('./routes/stats');
const refundRescheduleRoutes = require('./routes/refundReschedule');

app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/snacks', snackRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/refund-reschedule', refundRescheduleRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
