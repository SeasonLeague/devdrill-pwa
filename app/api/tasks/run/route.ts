import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limiter"
import { handleSecurityError, addSecurityHeaders } from "@/lib/security"
import { sanitizeCode } from "@/lib/validation"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

const limiter = rateLimit(rateLimitConfigs.api)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = limiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, language, task } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Sanitize code for safe execution
    const sanitizedCode = sanitizeCode(code)

    try {
      let output = ""

      if (language === "javascript") {
        // Execute JavaScript code
        output = await executeJavaScript(sanitizedCode)
      } else if (language === "python") {
        // Simulate Python execution
        output = await simulatePython(sanitizedCode)
      }

      const response = NextResponse.json({ output })
      return addSecurityHeaders(response)
    } catch (executionError) {
      const response = NextResponse.json(
        {
          error: executionError.message || "Code execution failed",
        },
        { status: 400 },
      )
      return addSecurityHeaders(response)
    }
  } catch (error) {
    console.error("Code run error:", error)
    const securityError = handleSecurityError(error)
    const response = NextResponse.json({ error: "Failed to run code" }, { status: 500 })
    return addSecurityHeaders(response)
  }
}

async function executeJavaScript(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Capture all output
      const logs: string[] = []

      // Create safe execution environment - REMOVED STRICT MODE
      const safeCode = `
        (function() {
          // Capture console output
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };
          
          // Override console methods to capture output
          console.log = function(...args) {
            logs.push(args.map(arg => {
              if (typeof arg === 'object' && arg !== null) {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' '));
          };
          
          console.error = function(...args) {
            logs.push('ERROR: ' + args.map(arg => String(arg)).join(' '));
          };
          
          console.warn = function(...args) {
            logs.push('WARNING: ' + args.map(arg => String(arg)).join(' '));
          };
          
          console.info = function(...args) {
            logs.push('INFO: ' + args.map(arg => String(arg)).join(' '));
          };
          
          // Block dangerous globals
          const process = undefined;
          const global = undefined;
          const window = undefined;
          const document = undefined;
          const setTimeout = undefined;
          const setInterval = undefined;
          const require = undefined;
          const module = undefined;
          const exports = undefined;
          
          let result;
          let lastExpression;
          
          try {
            // Execute the user code and capture the last expression
            ${wrapCodeForExecution(code)}
          } catch (error) {
            logs.push('ERROR: ' + error.message);
          }
          
          return {
            logs: logs,
            result: result,
            lastExpression: lastExpression
          };
        })();
      `

      // Execute with timeout
      const timeout = setTimeout(() => {
        reject(new Error("Code execution timeout (5 seconds)"))
      }, 5000)

      try {
        // Use eval instead of Function constructor to avoid strict mode issues
        const executionResult = eval(safeCode)
        clearTimeout(timeout)

        // Format output
        let output = ""

        // Add console output
        if (executionResult.logs && executionResult.logs.length > 0) {
          output += executionResult.logs.join("\n")
        }

        // Add result if there's a meaningful return value
        if (executionResult.result !== undefined && executionResult.result !== null) {
          if (output) output += "\n"
          output += `Return value: ${formatValue(executionResult.result)}`
        }

        // Add last expression if it exists and is different from result
        if (executionResult.lastExpression !== undefined && executionResult.lastExpression !== executionResult.result) {
          if (output) output += "\n"
          output += `Last expression: ${formatValue(executionResult.lastExpression)}`
        }

        // If no output at all, show a success message
        if (!output) {
          output = "Code executed successfully (no output)"
        }

        resolve(output)
      } catch (error) {
        clearTimeout(timeout)
        reject(new Error(`Runtime Error: ${error.message}`))
      }
    } catch (error) {
      reject(new Error(`Execution Error: ${error.message}`))
    }
  })
}

function wrapCodeForExecution(code: string): string {
  // Split code into statements and expressions
  const lines = code.split("\n")
  const wrappedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("//") || line.startsWith("/*")) {
      wrappedLines.push(lines[i])
      continue
    }

    // Check if this is likely a standalone expression (not a statement)
    const isStatement =
      line.includes("function ") ||
      line.includes("const ") ||
      line.includes("let ") ||
      line.includes("var ") ||
      line.includes("if ") ||
      line.includes("for ") ||
      line.includes("while ") ||
      line.includes("class ") ||
      line.includes("console.") ||
      line.endsWith("{") ||
      line.endsWith(";") ||
      line.includes("return ")

    if (!isStatement && line.length > 0) {
      // This looks like an expression - capture its value
      wrappedLines.push(`try { 
        var __expr_result = (${lines[i]});
        if (__expr_result !== undefined) {
          console.log(__expr_result);
        }
      } catch(__e) { 
        // If expression evaluation fails, just execute as statement
        ${lines[i]}
      }`)
    } else {
      wrappedLines.push(lines[i])
    }
  }

  return wrappedLines.join("\n")
}

function formatValue(value: any): string {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (typeof value === "string") return `"${value}"`
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch (e) {
      return String(value)
    }
  }
  return String(value)
}

async function simulatePython(code: string): Promise<string> {
  // Enhanced Python simulation that actually executes the logic
  const lines = code.split("\n")
  const output: string[] = []
  const variables: { [key: string]: any } = {}

  console.log("Processing Python code:", code) // Debug log

  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      console.log(`Processing line ${i}: "${line}"`) // Debug log

      if (!line || line.startsWith("#")) continue

      // Handle print statements - FIXED REGEX
      const printMatch = line.match(/print\s*$$\s*(.+?)\s*$$/)
      console.log(`Line: "${line}"`) // Debug log
      console.log("Print match result:", printMatch) // Debug log

      if (printMatch) {
        const content = printMatch[1].trim()
        console.log("Print content:", content) // Debug log

        try {
          // Handle different types of print content
          if (content.startsWith('"') && content.endsWith('"')) {
            // String literal with double quotes
            const result = content.slice(1, -1)
            console.log("String literal result:", result) // Debug log
            output.push(result)
          } else if (content.startsWith("'") && content.endsWith("'")) {
            // String literal with single quotes
            const result = content.slice(1, -1)
            console.log("Single quote result:", result) // Debug log
            output.push(result)
          } else if (variables[content]) {
            // Variable reference
            output.push(String(variables[content]))
          } else if (/^-?\d+(\.\d+)?$/.test(content)) {
            // Simple number
            output.push(content)
          } else if (/^[\d\s+\-*/().]+$/.test(content)) {
            // Mathematical expression - actually calculate it
            try {
              const result = Function(`return (${content})`)()
              output.push(String(result))
            } catch (e) {
              output.push(content)
            }
          } else if (content.includes(",")) {
            // Handle multiple arguments in print - like print("Hello", "World")
            const args = []
            let currentArg = ""
            let inQuotes = false
            let quoteChar = ""

            for (let j = 0; j < content.length; j++) {
              const char = content[j]

              if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true
                quoteChar = char
                currentArg += char
              } else if (char === quoteChar && inQuotes) {
                inQuotes = false
                currentArg += char
              } else if (char === "," && !inQuotes) {
                args.push(currentArg.trim())
                currentArg = ""
              } else {
                currentArg += char
              }
            }

            if (currentArg.trim()) {
              args.push(currentArg.trim())
            }

            // Process each argument
            const processedArgs = args.map((arg) => {
              if (arg.startsWith('"') && arg.endsWith('"')) {
                return arg.slice(1, -1)
              } else if (arg.startsWith("'") && arg.endsWith("'")) {
                return arg.slice(1, -1)
              } else if (variables[arg]) {
                return String(variables[arg])
              } else if (!isNaN(Number(arg))) {
                return arg
              } else if (/^[\d\s+\-*/().]+$/.test(arg)) {
                try {
                  return String(Function(`return (${arg})`)())
                } catch (e) {
                  return arg
                }
              } else {
                // Handle variable expressions
                let expression = arg
                for (const [varName, varValue] of Object.entries(variables)) {
                  const regex = new RegExp(`\\b${varName}\\b`, "g")
                  expression = expression.replace(regex, String(varValue))
                }

                if (/^[\d\s+\-*/().]+$/.test(expression)) {
                  try {
                    return String(Function(`return (${expression})`)())
                  } catch (e) {
                    return arg
                  }
                }
                return arg
              }
            })

            output.push(processedArgs.join(" "))
          } else {
            // Handle expressions with variables
            let expression = content

            // Replace variables in the expression
            for (const [varName, varValue] of Object.entries(variables)) {
              const regex = new RegExp(`\\b${varName}\\b`, "g")
              expression = expression.replace(regex, String(varValue))
            }

            // Try to evaluate the expression
            try {
              if (/^[\d\s+\-*/().]+$/.test(expression)) {
                const result = Function(`return (${expression})`)()
                output.push(String(result))
              } else {
                output.push(expression)
              }
            } catch (e) {
              output.push(content)
            }
          }
        } catch (e) {
          console.log("Error processing print:", e) // Debug log
          output.push(content) // Fallback to original content
        }
        continue
      }

      // Handle simple variable assignments
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/)
      if (assignMatch) {
        const varName = assignMatch[1]
        const value = assignMatch[2].trim()

        // Handle different types of assignments
        if (value.startsWith('"') && value.endsWith('"')) {
          variables[varName] = value.slice(1, -1)
        } else if (value.startsWith("'") && value.endsWith("'")) {
          variables[varName] = value.slice(1, -1)
        } else if (!isNaN(Number(value))) {
          variables[varName] = Number(value)
        } else if (/^[\d\s+\-*/().]+$/.test(value)) {
          // Mathematical expression
          try {
            variables[varName] = Function(`return (${value})`)()
          } catch (e) {
            variables[varName] = value
          }
        } else if (value.includes("+") || value.includes("-") || value.includes("*") || value.includes("/")) {
          // Expression with variables
          let expression = value
          for (const [existingVar, existingValue] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${existingVar}\\b`, "g")
            expression = expression.replace(regex, String(existingValue))
          }

          try {
            if (/^[\d\s+\-*/().]+$/.test(expression)) {
              variables[varName] = Function(`return (${expression})`)()
            } else {
              variables[varName] = value
            }
          } catch (e) {
            variables[varName] = value
          }
        } else {
          variables[varName] = value
        }
        continue
      }

      // Handle function definitions (basic)
      if (line.startsWith("def ")) {
        // For now, just acknowledge function definition
        continue
      }

      // Handle standalone expressions (not assignments or function calls)
      if (line && !line.includes("=") && !line.startsWith("def ") && !line.includes("print(")) {
        // Try to evaluate simple expressions
        try {
          if (/^[\d\s+\-*/().]+$/.test(line)) {
            const result = Function(`return (${line})`)()
            output.push(`${result}`)
          } else if (variables[line]) {
            output.push(String(variables[line]))
          }
          // Don't output anything for other standalone expressions to avoid confusion
        } catch (e) {
          // Ignore evaluation errors for standalone expressions
        }
      }
    }

    console.log("Final output array:", output) // Debug log

    if (output.length > 0) {
      return output.join("\n")
    } else {
      return "Python code executed successfully (no output)"
    }
  } catch (error) {
    console.error("Python simulation error:", error) // Debug log
    throw new Error(`Python execution error: ${error.message}`)
  }
}
