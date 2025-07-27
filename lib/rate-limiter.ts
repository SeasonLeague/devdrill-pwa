import type { NextRequest } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; remaining: number; resetTime: number } => {
    const ip = getClientIP(request)
    const now = Date.now()
    const key = `${ip}:${request.nextUrl.pathname}`

    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key]
    }

    // Initialize or get current count
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }

    store[key].count++

    const remaining = Math.max(0, config.maxRequests - store[key].count)
    const success = store[key].count <= config.maxRequests

    return {
      success,
      remaining,
      resetTime: store[key].resetTime,
    }
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(",")[0].trim()

  return "unknown"
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  aiHelp: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  taskGeneration: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute
}
