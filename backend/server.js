import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import pool from './config/db.js';

dotenv.config();

const app = express();

// List all possible addresses that will access this API
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.100.240:5173', // Your Wi-Fi IP
    'http://192.168.137.1:5173',   // Your Hotspot IP
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
            return callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // ✅ THIS FIXES THE PREFLIGHT ERROR
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Test endpoint
app.get("/api/test", (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Scan count endpoint
app.get("/api/scan-count/:email", async (req, res) => {
    const { email } = req.params;
    try {
        const result = await pool.query(
            "SELECT COUNT(*) FROM dog_breed_scans WHERE user_email = $1",
            [email]
        );
        res.json({ success: true, total: Number(result.rows[0].count) });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

const PORT = process.env.PORT || 5000;

// Listen on 0.0.0.0 so mobile devices can connect
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Mobile Access: http://192.168.100.240:${PORT}`);
});