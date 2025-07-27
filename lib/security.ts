import crypto from "crypto"
import type { NextResponse } from "next/server"

// CSRF Token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken))
}

// Secure headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; frame-ancestors 'none';",
  )

  return response
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}

// JWT utilities with additional security
export function createSecureJWT(payload: any): string {
  const jwt = require("jsonwebtoken")
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
    issuer: "devdrill",
    audience: "devdrill-users",
    algorithm: "HS256",
  })
}

export function verifySecureJWT(token: string): any {
  const jwt = require("jsonwebtoken")
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: "devdrill",
    audience: "devdrill-users",
    algorithms: ["HS256"],
  })
}

// Code execution safety
export function createSafeCodeEnvironment(userCode: string): string {
  // Remove dangerous patterns and create isolated environment
  const sanitizedCode = userCode
    .replace(/import\s+.*?from\s+['"][^'"]*['"]/g, "") // Remove imports
    .replace(/require\s*$$['"][^'"]*['"]$$/g, "") // Remove requires
    .replace(/process\./g, "") // Remove process access
    .replace(/global\./g, "") // Remove global access
    .replace(/window\./g, "") // Remove window access
    .replace(/document\./g, "") // Remove document access
    .replace(/eval\s*\(/g, "") // Remove eval
    .replace(/Function\s*\(/g, "") // Remove Function constructor
    .replace(/setTimeout|setInterval/g, "") // Remove timers

  return `
    (function() {
      'use strict';
      
      // Create isolated scope
      const process = undefined;
      const global = undefined;
      const window = undefined;
      const document = undefined;
      const eval = undefined;
      const Function = undefined;
      const setTimeout = undefined;
      const setInterval = undefined;
      const require = undefined;
      const module = undefined;
      const exports = undefined;
      
      ${sanitizedCode}
      
      // Return the function if it exists
      ${generateFunctionReturn()}
    })();
  `
}

function generateFunctionReturn(): string {
  return `
    // Try to return the defined function
    if (typeof addNumbers !== 'undefined') return addNumbers;
    if (typeof findMaximum !== 'undefined') return findMaximum;
    if (typeof reverseString !== 'undefined') return reverseString;
    if (typeof fibonacci !== 'undefined') return fibonacci;
    if (typeof binarySearch !== 'undefined') return binarySearch;
    if (typeof mergeSort !== 'undefined') return mergeSort;
    
    // Return the first function found
    for (let key in this) {
      if (typeof this[key] === 'function') {
        return this[key];
      }
    }
    
    throw new Error('No valid function found');
  `
}

// Error handling
export class SecurityError extends Error {
  constructor(
    message: string,
    public code = "SECURITY_ERROR",
  ) {
    super(message)
    this.name = "SecurityError"
  }
}

export function handleSecurityError(error: unknown): { error: string; code: string } {
  if (error instanceof SecurityError) {
    return { error: error.message, code: error.code }
  }

  console.error("Security error:", error)
  return { error: "Security validation failed", code: "SECURITY_ERROR" }
}
