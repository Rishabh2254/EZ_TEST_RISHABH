import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { FILES_DB } from "../../../ops/upload/route"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Store download tokens temporarily - in production, use Redis or database
let DOWNLOAD_TOKENS: any[] = []

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 })
    }

    if (decoded.role !== "client") {
      return NextResponse.json({ message: "Access denied. Client role required." }, { status: 403 })
    }

    const { fileId } = params

    // Find file
    const file = FILES_DB.find((f) => f._id === fileId)
    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Generate secure download token
    const downloadToken = jwt.sign(
      {
        fileId: file._id,
        userId: decoded.userId,
        type: "download",
      },
      JWT_SECRET,
      { expiresIn: "15m" }, // 15 minutes expiry
    )

    // Store token info for validation
    const tokenInfo = {
      token: downloadToken,
      fileId: file._id,
      userId: decoded.userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false,
    }

    DOWNLOAD_TOKENS.push(tokenInfo)

    // Clean up expired tokens
    DOWNLOAD_TOKENS = DOWNLOAD_TOKENS.filter((t) => new Date() < t.expiresAt)

    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/download/${downloadToken}`

    return NextResponse.json({
      downloadUrl,
      expiresIn: "15 minutes",
      fileInfo: {
        name: file.originalName,
        size: file.size,
        type: file.mimeType,
      },
    })
  } catch (error) {
    console.error("Download URL generation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Export DOWNLOAD_TOKENS for other routes to access
export { DOWNLOAD_TOKENS }
