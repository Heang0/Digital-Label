import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore } from 'firebase/firestore';

import labelRoutes from './routes/labelRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import companyRoutes from './routes/companyRoutes';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0",
  authDomain: "digital-label-8620b.firebaseapp.com",
  projectId: "digital-label-8620b",
  storageBucket: "digital-label-8620b.firebasestorage.app",
  messagingSenderId: "342078286952",
  appId: "1:342078286952:web:c125a1ae12edac51029fdd",
  measurementId: "G-QHGBZ7RD29"
};

// Initialize Firebase Client (Easier for local dev than Admin SDK)
const clientApp = initializeClientApp(firebaseConfig);
export const db = getClientFirestore(clientApp);

// Initialize Firebase Admin (Optional - requires credentials)
try {
  initializeApp({
    projectId: 'digital-label-8620b'
  });
} catch (e) {
  console.log('Firebase Admin not initialized - Admin features (Auth sync) will be disabled.');
}

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/labels', labelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);

// Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Digital Label API is running...' });
});

// Start Server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
