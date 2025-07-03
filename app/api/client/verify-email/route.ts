import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { CLIENTS_DB } from "../signup/route"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ message: "Verification token is required" }, { status: 400 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ message: "Invalid or expired verification token" }, { status: 400 })
    }

    if (decoded.type !== "email_verification") {
      return NextResponse.json({ message: "Invalid token type" }, { status: 400 })
    }

    // Find user and verify
    const userIndex = CLIENTS_DB.findIndex((u) => u.email === decoded.email)
    if (userIndex === -1) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const user = CLIENTS_DB[userIndex]
    if (user.isVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 })
    }

    // Update user verification status
    CLIENTS_DB[userIndex] = {
      ...user,
      isVerified: true,
      verificationToken: null,
      verifiedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      message: "Email verified successfully. You can now log in.",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
