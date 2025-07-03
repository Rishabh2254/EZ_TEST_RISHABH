"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Shield, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SecureDownloadPage() {
  const [downloadInfo, setDownloadInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState("")
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token

  useEffect(() => {
    if (!token) {
      setError("Invalid download link")
      setLoading(false)
      return
    }

    fetchDownloadInfo()
  }, [token])

  useEffect(() => {
    if (downloadInfo?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(downloadInfo.expiresAt).getTime()
        const difference = expiry - now

        if (difference > 0) {
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((difference % (1000 * 60)) / 1000)
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft("Expired")
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [downloadInfo])

  const fetchDownloadInfo = async () => {
    try {
      const response = await fetch(`/api/download/info/${token}`)
      const data = await response.json()

      if (response.ok) {
        setDownloadInfo(data)
      } else {
        setError(data.message || "Invalid or expired download link")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)

    try {
      const response = await fetch(`/api/client/download/${token}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = downloadInfo?.originalName || "download"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download started",
          description: "Your file is being downloaded...",
        })

        // Redirect after successful download
        setTimeout(() => {
          router.push("/client/dashboard")
        }, 2000)
      } else {
        const data = await response.json()
        toast({
          title: "Download failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Download failed",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("presentation")) return "📊"
    if (mimeType?.includes("word")) return "📄"
    if (mimeType?.includes("spreadsheet")) return "📈"
    return "📁"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !downloadInfo?.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>{error || "This download link is invalid or has expired"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push("/client/dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle>Secure File Download</CardTitle>
            <CardDescription>This is a secure, time-limited download link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> This download link is encrypted and will expire after use or when the
                time limit is reached.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{getFileIcon(downloadInfo.mimeType)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{downloadInfo.originalName}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>{formatFileSize(downloadInfo.size)}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Expires in: {timeLeft}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleDownload}
                disabled={downloading || timeLeft === "Expired"}
                className="w-full"
                size="lg"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Downloading...
                  </>
                ) : timeLeft === "Expired" ? (
                  "Link Expired"
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/client/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your download is secured with end-to-end encryption and will be automatically deleted from our servers
                after download.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
