import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { readFile } from "fs/promises"
import { FILES_DB } from "../../../ops/upload/route"
import { DOWNLOAD_TOKENS } from "../../download-file/[fileId]/route"

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
    const tokenIndex = DOWNLOAD_TOKENS.findIndex((t) => t.token === token)
    if (tokenIndex === -1) {
      return NextResponse.json({ message: "Download token not found or expired" }, { status: 404 })
    }

    const tokenInfo = DOWNLOAD_TOKENS[tokenIndex]

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

    // Mark token as used
    DOWNLOAD_TOKENS[tokenIndex].used = true
    DOWNLOAD_TOKENS[tokenIndex].usedAt = new Date()

    // Read and return file
    try {
      const fileBuffer = await readFile(file.filepath)

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `attachment; filename="${file.originalName}"`,
          "Content-Length": file.size.toString(),
        },
      })
    } catch (fileError) {
      console.error("File read error:", fileError)
      return NextResponse.json({ message: "File not accessible" }, { status: 500 })
    }
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
