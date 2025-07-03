"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, Download, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [opsCredentials, setOpsCredentials] = useState({ username: "", password: "" })
  const [clientCredentials, setClientCredentials] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleOpsLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/ops/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opsCredentials),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("userType", "ops")
        toast({ title: "Login successful", description: "Welcome back, Ops User!" })
        router.push("/ops/upload")
      } else {
        toast({ title: "Login failed", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleClientLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientCredentials),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("userType", "client")
        toast({ title: "Login successful", description: "Welcome back!" })
        router.push("/client/dashboard")
      } else {
        toast({ title: "Login failed", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SecureShare</h1>
          <p className="text-gray-600 mt-2">Secure File Sharing Platform</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your account type to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="ops" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Ops
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4">
                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="Enter your email"
                      value={clientCredentials.email}
                      onChange={(e) => setClientCredentials((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Password</Label>
                    <Input
                      id="client-password"
                      type="password"
                      placeholder="Enter your password"
                      value={clientCredentials.password}
                      onChange={(e) => setClientCredentials((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Client"}
                  </Button>
                </form>
                <div className="text-center">
                  <Button variant="link" onClick={() => router.push("/client/signup")} className="text-blue-600">
                    {"Don't have an account? Sign up"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ops" className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>Ops users can upload files but cannot download them.</AlertDescription>
                </Alert>
                <form onSubmit={handleOpsLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ops-username">Username</Label>
                    <Input
                      id="ops-username"
                      type="text"
                      placeholder="Enter your username"
                      value={opsCredentials.username}
                      onChange={(e) => setOpsCredentials((prev) => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ops-password">Password</Label>
                    <Input
                      id="ops-password"
                      type="password"
                      placeholder="Enter your password"
                      value={opsCredentials.password}
                      onChange={(e) => setOpsCredentials((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In as Ops"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
