"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, LogOut, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OpsUploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userType = localStorage.getItem("userType")

    if (!token || userType !== "ops") {
      router.push("/")
    }
  }, [router])

  const allowedTypes = [".pptx", ".docx", ".xlsx"]
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]

  const validateFile = (file) => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase()
    return allowedTypes.includes(extension) && allowedMimeTypes.includes(file.type)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      } else {
        toast({
          title: "Invalid file type",
          description: "Only .pptx, .docx, and .xlsx files are allowed",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Invalid file type",
          description: "Only .pptx, .docx, and .xlsx files are allowed",
          variant: "destructive",
        })
        e.target.value = ""
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/ops/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Upload successful!",
          description: `${file.name} has been uploaded successfully`,
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file-input")
        if (fileInput) fileInput.value = ""
      } else {
        toast({
          title: "Upload failed",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ops Dashboard</h1>
            <p className="text-gray-600">Upload files for client access</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>Upload .pptx, .docx, or .xlsx files for client access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Allowed file types:</strong> PowerPoint (.pptx), Word (.docx), Excel (.xlsx)
                </AlertDescription>
              </Alert>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Drop your file here, or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Maximum file size: 50MB</p>
                  </div>
                  <Label htmlFor="file-input" className="cursor-pointer">
                    <Input
                      id="file-input"
                      type="file"
                      accept=".pptx,.docx,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button variant="outline" type="button">
                      Choose File
                    </Button>
                  </Label>
                </div>
              </div>

              {file && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{file.name}</p>
                          <p className="text-sm text-green-700">
                            {formatFileSize(file.size)} • {file.type.split("/").pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-green-700 hover:text-green-900"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleUpload} disabled={!file || uploading} className="w-full" size="lg">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
