import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import pool from './config/db.js';

dotenv.config();

const app = express();

console.log('🔧 Environment Check:');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// ✅ FIXED: Add your computer's IP addresses for Android
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost',  // For web testing
    'http://10.0.2.2:3000',  // Android emulator
    'http://10.0.2.2:5000',  // Android emulator with your port
    'http://192.168.100.240',  // ✅ ADD YOUR WI-FI IP
    'http://192.168.137.1',    // ✅ ADD YOUR HOTSPOT IP
    // Add more if needed
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Check if origin starts with any allowed prefix
        const isAllowed = allowedOrigins.some(allowed => 
            origin.startsWith(allowed) || 
            origin.includes(allowed.replace('http://', ''))
        );
        
        if (isAllowed) {
            return callback(null, true);
        }
        
        console.log('❌ CORS blocked origin:', origin);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// ✅ ADD: Test endpoint for connection testing
app.get("/api/test", (req, res) => {
    console.log('✅ Test endpoint hit from IP:', req.ip);
    res.json({ 
        success: true,
        message: 'Express server is working!',
        serverTime: new Date().toISOString(),
        clientIp: req.ip,
        endpoints: [
            '/api/auth/register',
            '/api/auth/login', 
            '/api/auth/me',
            '/api/auth/logout',
            '/api/scan-count/:email'
        ]
    });
});

// Scan count endpoint
app.get("/api/scan-count/:email", async (req, res) => {
    const { email } = req.params;

    try {
        const result = await pool.query(
            "SELECT COUNT(*) FROM dog_breed_scans WHERE user_email = $1",
            [email]
        );
        res.json({ 
            success: true,
            total: Number(result.rows[0].count) 
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ 
            success: false,
            error: "Internal server error" 
        });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'Express.js',
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.json({ 
        message: "Dog Scan AI Backend API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            test: "/api/test",
            health: "/health",
            scanCount: "/api/scan-count/:email"
        }
    });
});

const PORT = process.env.PORT || 5000;

// ✅ FIXED: Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🔗 Local access: http://localhost:${PORT}`);
    console.log(`📱 Wi-Fi access: http://192.168.100.240:${PORT}`);
    console.log(`📶 Hotspot access: http://192.168.137.1:${PORT}`);
    
    // Test database connection
    pool.query('SELECT NOW()', (err, result) => {
        if (err) {
            console.error('❌ Database connection error:', err.message);
        } else {
            console.log('✅ Database connected successfully');
            console.log('📅 Database time:', result.rows[0].now);
        }
    });
});