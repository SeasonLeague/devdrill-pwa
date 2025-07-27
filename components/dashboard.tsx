"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Code, Trophy, Target, LogOut, TrendingUp, Clock, Flame, Star, BookOpen, Zap } from "lucide-react"
import SuggestionsPanel from "./dashboard/suggestions-panel"
import ProgressChart from "./dashboard/progress-chart"
import AchievementsPanel from "./dashboard/achievements-panel"
import PWAInstallBanner from "./pwa-install-banner"
import Footer from "./footer"

interface User {
  id: string
  name: string
  email: string
  skillLevel?: string
  score: number
  completedTasks: any[]
  dailyStreak: number
  achievements: any[]
}

interface Statistics {
  totalTasks: number
  totalPoints: number
  totalTime: number
  averageTime: number
  recentActivity: number
  skillDistribution: {
    Beginner: number
    Intermediate: number
    Advanced: number
  }
  weeklyProgress: any[]
}

interface DashboardProps {
  user: User
}

export default function Dashboard({ user: initialUser }: DashboardProps) {
  const [user, setUser] = useState<User>(initialUser)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserProgress()
  }, [])

  const fetchUserProgress = async () => {
    try {
      const response = await fetch("/api/user/progress")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getProgressPercentage = () => {
    if (!statistics) return 0
    const targetTasks = user.skillLevel === "Beginner" ? 20 : user.skillLevel === "Intermediate" ? 30 : 40
    return Math.min((statistics.totalTasks / targetTasks) * 100, 100)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!user.skillLevel) {
    router.push("/skill-selection")
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your progress...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <PWAInstallBanner />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">DevDrill</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome back, {user.name}! 👋
            {user.dailyStreak > 0 && (
              <span className="ml-4 text-2xl">
                <Flame className="inline h-6 w-6 text-orange-400 mr-1" />
                {user.dailyStreak} day streak!
              </span>
            )}
          </h1>
          <p className="text-xl text-slate-300">Ready to sharpen your {user.skillLevel?.toLowerCase()} skills?</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{statistics?.totalPoints || 0}</div>
              <p className="text-xs text-slate-400">Points earned from challenges</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Tasks Completed</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{statistics?.totalTasks || 0}</div>
              <p className="text-xs text-slate-400">Programming challenges solved</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Time Practiced</CardTitle>
              <Clock className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatTime(statistics?.totalTime || 0)}</div>
              <p className="text-xs text-slate-400">Total practice time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Daily Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{user.dailyStreak}</div>
              <p className="text-xs text-slate-400">Consecutive days practicing</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress and Suggestions Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Section */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
                  Your Progress
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Keep practicing to unlock new challenges and improve your skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Progress to next level</span>
                      <span className="text-slate-300">{Math.round(getProgressPercentage())}%</span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </div>

                  {statistics && <ProgressChart statistics={statistics} />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions */}
          <div>
            <SuggestionsPanel user={user} />
          </div>
        </div>

        {/* Achievements and Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <AchievementsPanel achievements={user.achievements || []} />

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-purple-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.completedTasks
                  ?.slice(-5)
                  .reverse()
                  .map((task: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <div>
                        <p className="text-white text-sm font-medium">{task.title}</p>
                        <p className="text-slate-400 text-xs">
                          {task.points} points • {formatTime(task.timeSpent || 0)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-xs text-slate-300">{task.difficulty}/10</span>
                      </div>
                    </div>
                  )) || <p className="text-slate-400 text-center py-4">No recent activity</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={() => router.push("/practice")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 mr-4"
          >
            <Zap className="h-5 w-5 mr-2" />
            Start Practice Session
          </Button>
          <Button onClick={() => router.push("/skill-selection")} variant="outline" size="lg" className="px-8 py-3">
            Change Skill Level
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
