import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { aiHelpSchema, validateAndSanitizeInput, sanitizeHtml } from "@/lib/validation"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limiter"
import { handleSecurityError, addSecurityHeaders } from "@/lib/security"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const limiter = rateLimit(rateLimitConfigs.aiHelp)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for AI requests
    const rateLimitResult = limiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many AI help requests. Please wait before asking again." },
        { status: 429 },
      )
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
    const { task, userCode, question } = validateAndSanitizeInput(aiHelpSchema, body)

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        maxOutputTokens: 1000, // Limit response length
        temperature: 0.7,
      },
    })

    // Create safe prompt with sanitized inputs
    const sanitizedQuestion = sanitizeHtml(question)
    const sanitizedCode = sanitizeHtml(userCode || "")
    const sanitizedTitle = sanitizeHtml(task.title)
    const sanitizedDescription = sanitizeHtml(task.description)

    const prompt = `
You are a helpful programming tutor. A student is working on this coding task:

Task: ${sanitizedTitle}
Description: ${sanitizedDescription}
Function Name Required: ${task.functionName || "Not specified"}
Requirements: ${task.requirements?.map((req) => sanitizeHtml(req)).join(", ") || "None specified"}

Their current code:
\`\`\`javascript
${sanitizedCode}
\`\`\`

Student's question: ${sanitizedQuestion}

Please provide a helpful explanation that:
1. Explains concepts simply with analogies
2. Gives hints without providing the complete solution
3. Points them in the right direction
4. Encourages problem-solving thinking
5. Reminds them about the required function name if relevant

Keep your response concise, educational, and encouraging. Do not provide executable code solutions.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // Sanitize AI response to prevent any potential XSS
    text = sanitizeHtml(text)

    // Additional safety check - remove any code blocks that might contain solutions
    text = text.replace(/```[\s\S]*?```/g, "[Code example removed for learning purposes]")

    const apiResponse = NextResponse.json({ help: text })
    return addSecurityHeaders(apiResponse)
  } catch (error) {
    console.error("AI Help error:", error)
    const securityError = handleSecurityError(error)
    const response = NextResponse.json({ error: "Failed to get AI help. Please try again." }, { status: 500 })
    return addSecurityHeaders(response)
  }
}
