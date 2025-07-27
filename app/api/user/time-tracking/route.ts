import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, taskId, taskTitle } = await request.json()

    await connectDB()
    const userData = await User.findById(user.userId)

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()

    if (action === "start_session") {
      // Start a new session
      await User.findByIdAndUpdate(user.userId, {
        sessionStartTime: now,
        lastActiveDate: now,
        ...(taskId && {
          currentTask: {
            taskId,
            title: taskTitle,
            startedAt: now,
            lastActiveAt: now,
            timeSpent: 0,
          },
        }),
      })
    } else if (action === "update_activity") {
      // Update last active time and calculate session time
      const sessionStart = userData.sessionStartTime
      let sessionTime = 0

      if (sessionStart) {
        sessionTime = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
      }

      const updateData: any = {
        lastActiveDate: now,
      }

      // Update current task if provided
      if (taskId && userData.currentTask) {
        const taskStartTime = userData.currentTask.startedAt || now
        const taskTimeSpent = Math.floor((now.getTime() - taskStartTime.getTime()) / 1000)

        updateData.currentTask = {
          ...userData.currentTask,
          taskId,
          title: taskTitle,
          lastActiveAt: now,
          timeSpent: taskTimeSpent,
        }
      }

      // Update total time spent
      if (sessionTime > 0) {
        updateData.totalTimeSpent = (userData.totalTimeSpent || 0) + Math.min(sessionTime, 300) // Cap at 5 minutes per update
        updateData.sessionStartTime = now // Reset session start
      }

      await User.findByIdAndUpdate(user.userId, updateData)
    } else if (action === "end_session") {
      // End session and clear current task
      const sessionStart = userData.sessionStartTime
      let sessionTime = 0

      if (sessionStart) {
        sessionTime = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)
      }

      await User.findByIdAndUpdate(user.userId, {
        sessionStartTime: null,
        totalTimeSpent: (userData.totalTimeSpent || 0) + sessionTime,
        lastActiveDate: now,
        currentTask: null,
      })
    }

    return NextResponse.json({ message: "Time tracking updated" })
  } catch (error) {
    console.error("Time tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
