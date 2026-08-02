import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET || "default_secret";
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Missing or invalid token"
        });
    }
    const token = authHeader.split(" ")[1];
    try {
        jwt.verify(token, jwtSecret);
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token"
        });
    }
}
