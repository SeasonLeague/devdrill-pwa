import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

    // Analyze user's progress and generate suggestions
    const completedTasks = userData.completedTasks || []
    const recentTasks = completedTasks.slice(-10) // Last 10 tasks

    const prompt = `
You are an AI learning advisor for a programming practice platform. Analyze this user's progress and provide personalized learning suggestions.

User Profile:
- Name: ${userData.name}
- Skill Level: ${userData.skillLevel}
- Total Score: ${userData.score}
- Completed Tasks: ${completedTasks.length}
- Daily Streak: ${userData.dailyStreak || 0}

Recent Task Performance:
${recentTasks
  .map(
    (task: any) =>
      `- ${task.title} (Difficulty: ${task.difficulty}, Attempts: ${task.attempts}, Time: ${Math.round(
        (task.timeSpent || 0) / 60,
      )}min)`,
  )
  .join("\n")}

Current Preferences:
- Favorite Topics: ${userData.preferences?.favoriteTopics?.join(", ") || "None set"}
- Weak Areas: ${userData.preferences?.weakAreas?.join(", ") || "None identified"}
- Learning Goals: ${userData.preferences?.learningGoals?.join(", ") || "None set"}

Please provide suggestions in this JSON format:
{
  "nextTopics": [
    {
      "topic": "Topic Name",
      "reason": "Why this topic is recommended",
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimatedTime": "X minutes",
      "priority": "High|Medium|Low"
    }
  ],
  "skillGaps": [
    {
      "area": "Skill area that needs improvement",
      "description": "Why this needs attention",
      "suggestedActions": ["Action 1", "Action 2"]
    }
  ],
  "achievements": [
    {
      "goal": "Achievement to work towards",
      "description": "What this achievement represents",
      "progress": "Current progress towards this goal"
    }
  ],
  "dailyGoal": {
    "description": "Specific goal for today",
    "tasks": 2,
    "estimatedTime": "30 minutes"
  }
}

Focus on:
1. Identifying patterns in their performance
2. Suggesting topics that build on their strengths
3. Addressing areas where they struggle
4. Setting realistic daily goals
5. Encouraging continued learning
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response")
    }

    const suggestions = JSON.parse(jsonMatch[0])

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Suggestions generation error:", error)
    const userData = {} // Declare userData here to fix the undeclared variable error
    return NextResponse.json(
      {
        suggestions: {
          nextTopics: [
            {
              topic: "Array Manipulation",
              reason: "Build foundational skills with common data structures",
              difficulty: userData.skillLevel || "Beginner",
              estimatedTime: "20 minutes",
              priority: "High",
            },
          ],
          skillGaps: [
            {
              area: "Problem Solving",
              description: "Practice breaking down complex problems",
              suggestedActions: ["Start with simpler problems", "Focus on understanding requirements"],
            },
          ],
          achievements: [
            {
              goal: "Complete 5 tasks this week",
              description: "Build consistency in your practice",
              progress: "Keep practicing daily",
            },
          ],
          dailyGoal: {
            description: "Complete 2 programming challenges",
            tasks: 2,
            estimatedTime: "30 minutes",
          },
        },
      },
      { status: 200 },
    )
  }
}
