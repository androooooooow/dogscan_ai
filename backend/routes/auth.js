import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    });
}

// ✅ Register user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Please provide all required fields" 
            });
        }

        // Check if email exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: "User already exists" 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        // Generate token
        const token = generateToken(newUser.rows[0].id);

        // Return token in response AND set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 30 * 24 * 60 * 60 * 1000 
        });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: newUser.rows[0].id,
                name: newUser.rows[0].name,
                email: newUser.rows[0].email
            },
            token: token
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error during registration" 
        });
    }
});

// ✅ Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Please provide all required fields" 
            });
        }

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }

        const userData = user.rows[0];
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }

        // Generate token
        const token = generateToken(userData.id);
        
        // Set cookie for web clients
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 30 * 24 * 60 * 60 * 1000 
        });

        // Return token for Android
        res.json({ 
            success: true,
            message: "Login successful",
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email
            },
            token: token
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error during login" 
        });
    }
});

// ✅ Get current user
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// ✅ Logout user
router.post('/logout', (req, res) => {
    res.cookie('token', '', { 
        httpOnly: true,
        expires: new Date(0) 
    });
    res.json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

export default router;