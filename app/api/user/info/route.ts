import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { z } from "zod"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const userInfoSchema = z.object({
  age: z.number().min(13).max(120),
  gender: z.enum(["male", "female"]),
  occupation: z.enum(["Software Engineer", "Data Analyst", "Student", "Designer", "Product Manager", "Other"]),
  customOccupation: z.string().optional().nullable(),
})

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

    const body = await request.json()
    const validatedData = userInfoSchema.parse(body)

    await connectDB()

    const updateData: any = {
      age: validatedData.age,
      gender: validatedData.gender,
      occupation: validatedData.occupation,
    }

    if (validatedData.occupation === "Other" && validatedData.customOccupation) {
      updateData.customOccupation = validatedData.customOccupation.trim()
    }

    await User.findByIdAndUpdate(user.userId, updateData)

    return NextResponse.json({ message: "User info updated successfully" })
  } catch (error) {
    console.error("User info update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
