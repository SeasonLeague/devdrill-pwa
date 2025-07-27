"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Code, Zap, Trophy } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  skillLevel?: string
}

interface SkillSelectionProps {
  user: User
}

const skillLevels = [
  {
    level: "Beginner",
    icon: Code,
    description: "New to programming or just starting out",
    features: ["Basic syntax challenges", "Simple algorithms", "Guided tutorials"],
  },
  {
    level: "Intermediate",
    icon: Zap,
    description: "Comfortable with basics, ready for more",
    features: ["Data structures", "Complex algorithms", "Problem solving"],
  },
  {
    level: "Advanced",
    icon: Trophy,
    description: "Experienced developer seeking challenges",
    features: ["System design", "Optimization problems", "Advanced patterns"],
  },
]

export default function SkillSelection({ user }: SkillSelectionProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!selectedLevel) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/skill-level", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skillLevel: selectedLevel }),
      })

      if (response.ok) {
        toast({
          title: "Skill level set!",
          description: `Welcome ${user.name}! Let's start practicing.`,
        })
        router.push("/")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: "Failed to set skill level. Please try again.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome, {user.name}!</h1>
          <p className="text-xl text-slate-300">Let's set up your skill level to get personalized challenges</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {skillLevels.map((skill) => {
            const Icon = skill.icon
            return (
              <Card
                key={skill.level}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedLevel === skill.level
                    ? "bg-blue-600 border-blue-400 ring-2 ring-blue-400"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
                onClick={() => setSelectedLevel(skill.level)}
              >
                <CardHeader className="text-center">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <CardTitle className="text-white">{skill.level}</CardTitle>
                  <CardDescription className="text-slate-300">{skill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {skill.features.map((feature, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={!selectedLevel || isLoading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            {isLoading ? "Setting up..." : "Start Practicing"}
          </Button>
        </div>
      </div>
    </div>
  )
}
