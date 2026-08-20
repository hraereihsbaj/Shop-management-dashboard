import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export function login(req: Request, res: Response) {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminPassword) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: ADMIN_PASSWORD is not set."
    });
  }

  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: JWT_SECRET is not set."
    });
  }

  if (password === adminPassword) {
    const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "7d" });
    return res.status(200).json({
      success: true,
      token,
      message: "Login successful"
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Invalid password"
    });
  }
}
