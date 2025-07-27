import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { evaluateCode } from "@/lib/code-evaluator"
import { taskSubmissionSchema, validateAndSanitizeInput, sanitizeCode, sanitizeMongoInput } from "@/lib/validation"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limiter"
import { handleSecurityError, addSecurityHeaders } from "@/lib/security"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const limiter = rateLimit(rateLimitConfigs.api)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = limiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate and sanitize input
    const { taskId, code, timeSpent, attempts } = validateAndSanitizeInput(taskSubmissionSchema, body)

    // Additional validation for task object
    if (!body.task || typeof body.task !== "object") {
      throw new Error("Invalid task data")
    }

    const task = sanitizeMongoInput(body.task)

    // Sanitize code for safe execution
    const sanitizedCode = sanitizeCode(code)

    const evaluation = await evaluateCode(sanitizedCode, task)

    await connectDB()

    if (evaluation.passed) {
      // Task completed successfully - create safe task data
      const taskData = {
        taskId: sanitizeMongoInput(taskId),
        title: sanitizeMongoInput(task.title),
        difficulty: Number(task.difficulty) || 1,
        points: Number(evaluation.score) || 0,
        completedAt: new Date(), // Proper Date object
        attempts: Number(attempts) || 1,
        timeSpent: Number(timeSpent) || 0,
        category: sanitizeMongoInput(task.category) || "General",
      }

      // Update user progress with safe data
      await User.findByIdAndUpdate(sanitizeMongoInput(user.userId), {
        $push: { completedTasks: taskData },
        $inc: { score: evaluation.score },
        $set: { lastActiveDate: new Date() }, // Proper Date object
      })

      // Check for achievements
      const userData = await User.findById(user.userId)
      const completedCount = userData.completedTasks.length + 1
      const newAchievements = []

      // Achievement logic with safe data
      if (completedCount === 1) {
        newAchievements.push({
          id: "first-task",
          name: "First Steps",
          description: "Completed your first programming challenge!",
          icon: "🎯",
          unlockedAt: new Date(), // Proper Date object
        })
      }

      if (completedCount === 10) {
        newAchievements.push({
          id: "ten-tasks",
          name: "Getting Started",
          description: "Completed 10 programming challenges!",
          icon: "🔥",
          unlockedAt: new Date(), // Proper Date object
        })
      }

      if (completedCount === 50) {
        newAchievements.push({
          id: "fifty-tasks",
          name: "Dedicated Learner",
          description: "Completed 50 programming challenges!",
          icon: "⭐",
          unlockedAt: new Date(), // Proper Date object
        })
      }

      // Add new achievements
      if (newAchievements.length > 0) {
        await User.findByIdAndUpdate(user.userId, {
          $push: { achievements: { $each: newAchievements } },
        })
      }

      const response = NextResponse.json({
        evaluation,
        achievements: newAchievements,
      })

      return addSecurityHeaders(response)
    } else {
      const response = NextResponse.json({ evaluation })
      return addSecurityHeaders(response)
    }
  } catch (error) {
    const securityError = handleSecurityError(error)
    const response = NextResponse.json(securityError, { status: 400 })
    return addSecurityHeaders(response)
  }
}
