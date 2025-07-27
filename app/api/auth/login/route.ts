import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { loginSchema, validateAndSanitizeInput, sanitizeMongoInput } from "@/lib/validation"
import { verifyPassword, createSecureJWT, handleSecurityError } from "@/lib/security"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limiter"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const limiter = rateLimit(rateLimitConfigs.auth)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = limiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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
    const { email, password } = validateAndSanitizeInput(loginSchema, body)

    await connectDB()

    const user = await User.findOne({
      email: sanitizeMongoInput(email),
    }).select("+password")

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Update last active date with proper Date object
    await User.findByIdAndUpdate(user._id, {
      lastActiveDate: new Date(), // Use proper Date object
    })

    const token = createSecureJWT({
      userId: user._id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    })

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skillLevel: user.skillLevel,
        score: user.score,
        completedTasks: user.completedTasks,
      },
    })

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
