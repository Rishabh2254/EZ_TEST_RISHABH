import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Mock database - in production, use MongoDB/PostgreSQL
const CLIENTS_DB: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = CLIENTS_DB.find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification token
    const verificationToken = jwt.sign({ email, type: "email_verification" }, JWT_SECRET, { expiresIn: "24h" })

    // Create user
    const newUser = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    }

    CLIENTS_DB.push(newUser)

    // Send verification email (mock implementation)
    // In production, use a real email service like SendGrid, AWS SES, etc.
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/client/verify?token=${verificationToken}`

    console.log("Verification email would be sent to:", email)
    console.log("Verification URL:", verificationUrl)

    // Mock email sending - in production, implement real email sending
    try {
      // This is a mock - replace with real email service
      console.log(`
        To: ${email}
        Subject: Verify Your SecureShare Account
        
        Hi ${name},
        
        Please click the link below to verify your email address:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        Best regards,
        SecureShare Team
      `)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      message: "Account created successfully. Please check your email for verification link.",
      userId: newUser.id,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Export CLIENTS_DB for other routes to access
export { CLIENTS_DB }
