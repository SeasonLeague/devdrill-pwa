"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users } from "lucide-react"

interface SignupFormProps {
  inviteFromUrl?: string | null
}

export default function SignupForm({ inviteFromUrl }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Set invite code from URL prop
    if (inviteFromUrl) {
      setInviteCode(inviteFromUrl.toUpperCase())
    }
  }, [inviteFromUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          inviteCode: inviteCode.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Account created!",
          description: inviteCode
            ? "Welcome to DevDrill! Thanks for joining through an invite."
            : "Welcome to DevDrill. Let's get to know you better.",
        })
        router.push("/user-info")
      } else {
        toast({
          title: "Signup failed",
          description: data.error || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-auto">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white text-lg sm:text-xl">Create Account</CardTitle>
        <CardDescription className="text-slate-400 text-sm sm:text-base">
          {inviteFromUrl
            ? "Join DevDrill through your friend's invitation!"
            : "Join DevDrill and start your coding journey"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white text-sm">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="text-white text-sm flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-400" />
              Invite Code (Optional)
            </Label>
            <Input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base font-mono"
              placeholder="Enter 5-character code"
            />
            <p className="text-slate-400 text-xs">Have a friend's invite code? Enter it here to connect!</p>
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
