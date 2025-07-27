"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, Briefcase, Calendar } from "lucide-react"

interface UserInfoCollectionProps {
  user: {
    id: string
    name: string
    email: string
    inviteCode: string
  }
}

export default function UserInfoCollection({ user }: UserInfoCollectionProps) {
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [occupation, setOccupation] = useState("")
  const [customOccupation, setCustomOccupation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!age || !gender || !occupation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (occupation === "Other" && !customOccupation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify your occupation.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: Number.parseInt(age),
          gender,
          occupation,
          customOccupation: occupation === "Other" ? customOccupation : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Profile Updated!",
          description: "Let's set up your skill level next.",
        })
        router.push("/skill-selection")
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update profile.",
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

  const copyInviteCode = () => {
    const inviteUrl = `${window.location.origin}/auth/signup?invite=${user.inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    toast({
      title: "Invite Link Copied!",
      description: "Share this link with friends to invite them to DevDrill.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tell us about yourself! 👋</h1>
          <p className="text-xl text-slate-300">Help us personalize your learning experience</p>
        </div>

        <div className="grid gap-6">
          {/* Main Info Form */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                This helps us create better challenges for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                      Age *
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter your age"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-white">
                      Gender *
                    </Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="male" className="text-white hover:bg-slate-700">
                          Male
                        </SelectItem>
                        <SelectItem value="female" className="text-white hover:bg-slate-700">
                          Female
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation" className="text-white flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-blue-400" />
                    What do you do? *
                  </Label>
                  <Select value={occupation} onValueChange={setOccupation} required>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select your occupation" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="Software Engineer" className="text-white hover:bg-slate-700">
                        Software Engineer
                      </SelectItem>
                      <SelectItem value="Data Analyst" className="text-white hover:bg-slate-700">
                        Data Analyst
                      </SelectItem>
                      <SelectItem value="Student" className="text-white hover:bg-slate-700">
                        Student
                      </SelectItem>
                      <SelectItem value="Designer" className="text-white hover:bg-slate-700">
                        Designer
                      </SelectItem>
                      <SelectItem value="Product Manager" className="text-white hover:bg-slate-700">
                        Product Manager
                      </SelectItem>
                      <SelectItem value="Other" className="text-white hover:bg-slate-700">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {occupation === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customOccupation" className="text-white">
                      Please specify *
                    </Label>
                    <Input
                      id="customOccupation"
                      type="text"
                      value={customOccupation}
                      onChange={(e) => setCustomOccupation(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter your occupation"
                      required
                    />
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  {isLoading ? "Saving..." : "Continue to Skill Selection"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Invite Friends Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-400" />
                Invite Friends
              </CardTitle>
              <CardDescription className="text-slate-400">
                Share DevDrill with friends and learn together!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Your Invite Code</p>
                      <p className="text-2xl font-bold text-blue-400 font-mono">{user.inviteCode}</p>
                    </div>
                    <Button onClick={copyInviteCode} variant="outline" size="sm">
                      Copy Link
                    </Button>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">
                  Friends who join with your code will be added to your network, and you can see each other's progress!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
