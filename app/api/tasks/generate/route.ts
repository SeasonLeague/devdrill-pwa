import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { generateTask } from "@/lib/task-generator"
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

    // Get user's current data from database
    await connectDB()
    const userData = await User.findById(user.userId)

    if (!userData || !userData.skillLevel) {
      return NextResponse.json({ error: "User skill level not set" }, { status: 400 })
    }

    // Generate AI-powered task
    console.log(`Generating ${userData.skillLevel} task for user ${userData.name}...`)

    const task = await generateTask(userData.skillLevel, userData.completedTasks || [])

    console.log(`Generated task: ${task.title}`)

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Task generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate task. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
