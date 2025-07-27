import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const userData = await User.findById(user.userId)

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate additional statistics
    const completedTasks = userData.completedTasks || []
    const totalTasks = completedTasks.length
    const totalPoints = completedTasks.reduce((sum: number, task: any) => sum + (task.points || 0), 0)
    const totalTime = completedTasks.reduce((sum: number, task: any) => sum + (task.timeSpent || 0), 0)

    // Calculate daily streak
    const today = new Date()
    const lastActive = new Date(userData.lastActiveDate)
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

    let currentStreak = userData.dailyStreak || 0
    if (daysDiff === 0) {
      // Same day, keep streak
    } else if (daysDiff === 1) {
      // Yesterday, increment streak
      currentStreak += 1
    } else if (daysDiff > 1) {
      // Missed days, reset streak
      currentStreak = 0
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentTasks = completedTasks.filter((task: any) => new Date(task.completedAt) >= sevenDaysAgo)

    // Calculate skill distribution
    const skillDistribution = {
      Beginner: completedTasks.filter((task: any) => task.difficulty <= 3).length,
      Intermediate: completedTasks.filter((task: any) => task.difficulty >= 4 && task.difficulty <= 6).length,
      Advanced: completedTasks.filter((task: any) => task.difficulty >= 7).length,
    }

    return NextResponse.json({
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        skillLevel: userData.skillLevel,
        score: totalPoints,
        completedTasks: userData.completedTasks,
        dailyStreak: currentStreak,
        achievements: userData.achievements || [],
        preferences: userData.preferences || {},
      },
      statistics: {
        totalTasks,
        totalPoints,
        totalTime,
        averageTime: totalTasks > 0 ? Math.round(totalTime / totalTasks) : 0,
        recentActivity: recentTasks.length,
        skillDistribution,
        weeklyProgress: userData.statistics?.weeklyProgress || [],
      },
    })
  } catch (error) {
    console.error("Progress fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
