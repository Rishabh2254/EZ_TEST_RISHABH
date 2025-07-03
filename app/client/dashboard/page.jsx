"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, LogOut, Calendar, HardDrive, Shield, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ClientDashboard() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingFiles, setDownloadingFiles] = useState(new Set())
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userType = localStorage.getItem("userType")

    if (!token || userType !== "client") {
      router.push("/")
      return
    }

    fetchFiles()
  }, [router])

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/client/files", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setFiles(data.files)
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileId, filename) => {
    setDownloadingFiles((prev) => new Set(prev).add(fileId))

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/client/download-file/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Open secure download URL in new tab
        window.open(data.downloadUrl, "_blank")
        toast({
          title: "Download link generated",
          description: "Opening secure download page...",
        })
      } else {
        toast({
          title: "Download failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate download link",
        variant: "destructive",
      })
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    router.push("/")
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.includes("presentation")) return "📊"
    if (mimeType.includes("word")) return "📄"
    if (mimeType.includes("spreadsheet")) return "📈"
    return "📁"
  }

  const getFileTypeLabel = (mimeType) => {
    if (mimeType.includes("presentation")) return "PowerPoint"
    if (mimeType.includes("word")) return "Word"
    if (mimeType.includes("spreadsheet")) return "Excel"
    return "Document"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600">Access and download your files securely</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 mb-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              All downloads are secured with encrypted, time-limited links that expire after use.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{files.length}</p>
                    <p className="text-sm text-gray-600">Total Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                    </p>
                    <p className="text-sm text-gray-600">Total Size</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {files.length > 0 ? formatDate(files[0].uploadedAt).split(",")[0] : "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">Latest Upload</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {files.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files available</h3>
              <p className="text-gray-600">Files uploaded by Ops users will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <Card key={file._id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{file.originalName}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="secondary">{getFileTypeLabel(file.mimeType)}</Badge>
                          <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                          <span className="text-sm text-gray-500">{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(file._id, file.originalName)}
                      disabled={downloadingFiles.has(file._id)}
                      className="ml-4"
                    >
                      {downloadingFiles.has(file._id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Secure Download
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
