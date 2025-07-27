import { z } from "zod"

// User validation schemas
export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email must be less than 100 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(100).toLowerCase().trim(),
  password: z.string().min(1, "Password is required").max(128),
})

export const skillLevelSchema = z.object({
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced"], {
    errorMap: () => ({ message: "Invalid skill level" }),
  }),
})

// Task validation schemas
export const taskSubmissionSchema = z.object({
  taskId: z
    .string()
    .min(1, "Task ID is required")
    .max(100, "Task ID too long")
    .regex(/^[a-zA-Z0-9\-_]+$/, "Invalid task ID format"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10000, "Code is too long")
    .refine((code) => {
      // Check for potentially dangerous patterns
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /document\./,
        /window\./,
        /global\./,
        /process\./,
        /require\s*\(/,
        /import\s*\(/,
        /__proto__/,
        /constructor/,
        /prototype/,
      ]
      return !dangerousPatterns.some((pattern) => pattern.test(code))
    }, "Code contains potentially unsafe patterns"),
  timeSpent: z.number().min(0).max(7200).optional(), // Max 2 hours
  attempts: z.number().min(1).max(100).optional(),
})

export const aiHelpSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(1000, "Question is too long")
    .trim()
    .refine((question) => {
      // Check for injection attempts
      const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /eval\s*\(/i, /expression\s*\(/i]
      return !suspiciousPatterns.some((pattern) => pattern.test(question))
    }, "Question contains invalid content"),
  userCode: z.string().max(10000).optional(),
  task: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    functionName: z.string().optional(),
  }),
})

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

export function sanitizeCode(code: string): string {
  // Remove potentially dangerous patterns while preserving valid code
  return code
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
    .trim()
}

export function validateAndSanitizeInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map((e) => e.message).join(", ")}`)
  }
  return result.data
}

// MongoDB sanitization function - Fixed to handle dates properly
export function sanitizeMongoInput(input: any): any {
  // Handle null and undefined
  if (input === null || input === undefined) {
    return input
  }

  // Handle Date objects - preserve them
  if (input instanceof Date) {
    return input
  }

  // Handle strings
  if (typeof input === "string") {
    return input.replace(/[${}]/g, "")
  }

  // Handle numbers, booleans, etc.
  if (typeof input !== "object") {
    return input
  }

  // Handle arrays
  if (Array.isArray(input)) {
    return input.map(sanitizeMongoInput)
  }

  // Handle objects
  const sanitized: any = {}
  for (const [key, value] of Object.entries(input)) {
    // Remove keys that start with $ or contain dots (MongoDB injection prevention)
    if (!key.startsWith("$") && !key.includes(".")) {
      sanitized[key] = sanitizeMongoInput(value)
    }
  }
  return sanitized
}

// Safe user data creation function
export function createSafeUserData(name: string, email: string, hashedPassword: string) {
  return {
    name: sanitizeMongoInput(name),
    email: sanitizeMongoInput(email),
    password: hashedPassword, // Already hashed, don't sanitize
    skillLevel: null,
    score: 0,
    completedTasks: [],
    dailyStreak: 0,
    lastActiveDate: new Date(), // Create proper Date object
    preferences: {
      favoriteTopics: [],
      weakAreas: [],
      learningGoals: [],
    },
    statistics: {
      totalTimeSpent: 0,
      averageAttempts: 0,
      strongestTopics: [],
      improvementAreas: [],
      weeklyProgress: [],
    },
    achievements: [],
  }
}
