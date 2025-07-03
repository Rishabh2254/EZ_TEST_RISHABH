import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { FILES_DB } from "../../ops/upload/route"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function GET(request: NextRequest) {
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

    // Return all files (excluding sensitive file paths)
    const files = FILES_DB.map((file) => ({
      _id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
    }))

    return NextResponse.json({
      files,
      total: files.length,
    })
  } catch (error) {
    console.error("Files fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
