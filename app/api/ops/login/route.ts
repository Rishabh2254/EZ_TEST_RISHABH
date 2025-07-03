import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock ops user data - in production, this would be in a database
const OPS_USERS = [
  {
    id: "1",
    username: "ops_admin",
    password: "$2a$10$rOzJqKqQQQQQQQQQQQQQQu", // hashed 'admin123'
    role: "ops",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Find ops user
    const user = OPS_USERS.find((u) => u.username === username)

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // For demo purposes, we'll accept 'admin123' as password
    // In production, use bcrypt.compare(password, user.password)
    const isValidPassword = password === "admin123"

    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Ops login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
