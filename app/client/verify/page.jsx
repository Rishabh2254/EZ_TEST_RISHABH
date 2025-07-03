"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function EmailVerificationPage() {
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Invalid verification link")
        return
      }

      try {
        const response = await fetch(`/api/client/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage("Email verified successfully!")
        } else {
          setStatus("error")
          setMessage(data.message || "Verification failed")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Network error occurred")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <div className="bg-blue-100 p-3 rounded-full">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle
            className={status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-blue-600"}
          >
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Button className="w-full" onClick={() => router.push("/")}>
              Continue to Login
            </Button>
          )}
          {status === "error" && (
            <div className="space-y-2">
              <Button className="w-full" onClick={() => router.push("/client/signup")}>
                Try Signing Up Again
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/")}>
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
