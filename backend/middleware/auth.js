import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
    try {
        // Get token from cookie OR Authorization header
        let token = req.cookies.token;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "Not authorized, no token" 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query(
            'SELECT id, name, email FROM users WHERE id = $1', 
            [decoded.id]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "Not authorized, user not found" 
            });
        }

        req.user = user.rows[0];
        next();

    } catch(error) {
        console.error("Auth middleware error:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: "Invalid token" 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: "Token expired" 
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: "Not authorized" 
        });
    }
}