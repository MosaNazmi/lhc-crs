import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import studentRoutes from './routes/student';
import subscriptionRoutes from './routes/subscription';
import diplomaRoutes from './routes/diploma';
import courseRoutes from './routes/course';
import authRoutes from './routes/auth';
import entityRoutes from './routes/educational-entity';
import roomRoutes from './routes/room';
import instructorRoutes from './routes/instructor';
import sectionRoutes from './routes/section';
import financialRoutes from './routes/financial';
import requestCourseRoutes from './routes/request-course';
import auditRoutes from './routes/audit';
import installmentRoutes from './routes/installment';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

// CORS — allow frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://lhc-crs.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/educational-entities', entityRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/diplomas', diplomaRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/finances', financialRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/request-course', requestCourseRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 EMS Backend running on http://localhost:${PORT}`);
  console.log(`   Admin: username=admin  password=102030.55\n`);
});
