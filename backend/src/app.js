import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import mastersRoutes from './routes/masters.js';
import programIntakesRoutes from './routes/programIntakes.js';
import applicantsRoutes from './routes/applicants.js';
import allocationsRoutes from './routes/allocations.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/program-intakes', programIntakesRoutes);
app.use('/api/applicants', applicantsRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

export default app;
