import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Mock database - in production, use MongoDB/PostgreSQL
const FILES_DB: any[] = []

export async function POST(request: NextRequest) {
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

    if (decoded.role !== "ops") {
      return NextResponse.json({ message: "Access denied. Ops role required." }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only .pptx, .docx, and .xlsx files are allowed." },
        { status: 400 },
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: "File size exceeds 50MB limit" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const filename = `${timestamp}_${Math.random().toString(36).substring(7)}${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save file info to mock database
    const fileInfo = {
      _id: Math.random().toString(36).substring(7),
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: decoded.username,
      filepath,
    }

    FILES_DB.push(fileInfo)

    return NextResponse.json({
      message: "File uploaded successfully",
      fileId: fileInfo._id,
      filename: fileInfo.originalName,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Export FILES_DB for other routes to access
export { FILES_DB }
