import { connectDB } from "./mongodb"
import User from "@/models/User"
import { verifySecureJWT } from "./security"
import { sanitizeMongoInput } from "./validation"

export async function verifyToken(token: string) {
  try {
    const decoded = verifySecureJWT(token)

    await connectDB()
    const user = await User.findById(sanitizeMongoInput(decoded.userId)).select("-password")

    if (!user) {
      throw new Error("User not found")
    }

    // Check if token is not too old (additional security)
    const tokenAge = Date.now() / 1000 - decoded.iat
    if (tokenAge > 7 * 24 * 60 * 60) {
      // 7 days
      throw new Error("Token expired")
    }

    return {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      score: user.score,
      completedTasks: user.completedTasks,
    }
  } catch (error) {
    throw new Error("Invalid token")
  }
}
