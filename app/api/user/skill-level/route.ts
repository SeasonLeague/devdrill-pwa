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

    const { skillLevel } = await request.json()

    if (!["Beginner", "Intermediate", "Advanced"].includes(skillLevel)) {
      return NextResponse.json({ error: "Invalid skill level" }, { status: 400 })
    }

    await connectDB()
    await User.findByIdAndUpdate(user.userId, { skillLevel })

    return NextResponse.json({ message: "Skill level updated successfully" })
  } catch (error) {
    console.error("Skill level update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
