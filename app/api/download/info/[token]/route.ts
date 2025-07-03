import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { FILES_DB } from "../../../ops/upload/route"
import { DOWNLOAD_TOKENS } from "../../../client/download-file/[fileId]/route"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ message: "Download token is required" }, { status: 400 })
    }

    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ message: "Invalid or expired download token" }, { status: 400 })
    }

    if (decoded.type !== "download") {
      return NextResponse.json({ message: "Invalid token type" }, { status: 400 })
    }

    // Check if token exists and is not used
    const tokenInfo = DOWNLOAD_TOKENS.find((t) => t.token === token)
    if (!tokenInfo) {
      return NextResponse.json({ message: "Download token not found or expired" }, { status: 404 })
    }

    if (tokenInfo.used) {
      return NextResponse.json({ message: "Download token has already been used" }, { status: 400 })
    }

    if (new Date() > tokenInfo.expiresAt) {
      return NextResponse.json({ message: "Download token has expired" }, { status: 400 })
    }

    // Find file
    const file = FILES_DB.find((f) => f._id === decoded.fileId)
    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    return NextResponse.json({
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      expiresAt: tokenInfo.expiresAt.toISOString(),
      isValid: true,
    })
  } catch (error) {
    console.error("Download info error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
