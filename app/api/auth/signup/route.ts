import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { signupSchema, validateAndSanitizeInput, sanitizeMongoInput, createSafeUserData } from "@/lib/validation"
import { hashPassword, createSecureJWT, handleSecurityError } from "@/lib/security"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limiter"

const limiter = rateLimit(rateLimitConfigs.auth)

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = limiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        },
      )
    }

    const body = await request.json()

    // Validate and sanitize input
    const { name, email, password } = validateAndSanitizeInput(signupSchema, body)
    const inviteCode = body.inviteCode?.trim()?.toUpperCase() || null

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      email: sanitizeMongoInput(email),
    }).select("_id")

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 409 })
    }

    // Validate invite code if provided
    let invitedByUser = null
    if (inviteCode) {
      invitedByUser = await User.findOne({ inviteCode }).select("_id inviteCode name")
      if (!invitedByUser) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 })
      }
    }

    // Generate unique invite code for new user
    let newUserInviteCode
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      newUserInviteCode = generateInviteCode()
      const existing = await User.findOne({ inviteCode: newUserInviteCode }).select("_id")
      if (!existing) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate unique invite code" }, { status: 500 })
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password)

    // Create user with safe data structure
    const userData = createSafeUserData(name, email, hashedPassword)
    userData.inviteCode = newUserInviteCode
    userData.invitedBy = inviteCode

    const user = new User(userData)
    await user.save()

    // Update inviter's invited users list
    if (invitedByUser) {
      await User.findByIdAndUpdate(invitedByUser._id, {
        $push: {
          invitedUsers: {
            inviteCode: newUserInviteCode,
            name: user.name,
            joinedAt: new Date(),
          },
        },
      })
    }

    // Create secure JWT
    const token = createSecureJWT({
      userId: user._id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    })

    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        inviteCode: user.inviteCode,
        skillLevel: user.skillLevel,
        score: user.score,
        completedTasks: user.completedTasks,
      },
    })

    // Set secure cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    const securityError = handleSecurityError(error)
    return NextResponse.json(securityError, { status: 400 })
  }
}
