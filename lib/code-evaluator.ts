import { createSafeCodeEnvironment } from "./security"

interface Task {
  id: string
  title: string
  functionName: string
  testCases: Array<{
    input: any
    expected: any
    description: string
  }>
  points: number
}

interface EvaluationResult {
  passed: boolean
  score: number
  feedback: string
  testResults: Array<{
    passed: boolean
    description: string
    error?: string
  }>
}

export async function evaluateCode(code: string, task: Task): Promise<EvaluationResult> {
  try {
    const testResults = []
    let passedTests = 0

    // Create safe execution environment
    const safeCode = createSafeCodeEnvironment(code)

    for (const testCase of task.testCases) {
      try {
        // Execute code in isolated environment with timeout
        const result = await executeWithTimeout(safeCode, testCase.input, 5000) // 5 second timeout

        // Deep comparison for arrays and objects
        const passed = deepEqual(result, testCase.expected)

        testResults.push({
          passed,
          description: sanitizeTestDescription(testCase.description),
          error: passed ? undefined : `Expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(result)}`,
        })

        if (passed) passedTests++
      } catch (error) {
        testResults.push({
          passed: false,
          description: sanitizeTestDescription(testCase.description),
          error: `Runtime error: ${error instanceof Error ? error.message.substring(0, 100) : "Unknown error"}`,
        })
      }
    }

    const allPassed = passedTests === task.testCases.length
    const score = allPassed ? task.points : Math.floor((passedTests / task.testCases.length) * task.points * 0.5)

    return {
      passed: allPassed,
      score,
      feedback: allPassed
        ? `Excellent! You passed all ${task.testCases.length} test cases and earned ${task.points} points!`
        : `You passed ${passedTests} out of ${task.testCases.length} test cases. ${getHelpfulFeedback(passedTests, task.testCases.length)}`,
      testResults,
    }
  } catch (error) {
    return {
      passed: false,
      score: 0,
      feedback: `Code evaluation failed: ${error instanceof Error ? error.message.substring(0, 100) : "Unknown error"}`,
      testResults: [
        {
          passed: false,
          description: "Code compilation",
          error: error instanceof Error ? error.message.substring(0, 100) : "Unknown error",
        },
      ],
    }
  }
}

async function executeWithTimeout(code: string, inputs: any[], timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Code execution timeout"))
    }, timeoutMs)

    try {
      // Create a new function with the safe code
      const func = new Function(`
        ${code}
        return typeof result !== 'undefined' ? result : (function() {
          const inputs = ${JSON.stringify(inputs)};
          return func(...inputs);
        })();
      `)

      const result = func()
      clearTimeout(timeout)
      resolve(result)
    } catch (error) {
      clearTimeout(timeout)
      reject(error)
    }
  })
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (a == null || b == null) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

function getHelpfulFeedback(passed: number, total: number): string {
  const percentage = (passed / total) * 100

  if (percentage === 0) {
    return "Don't give up! Check the requirements and try a different approach."
  } else if (percentage < 50) {
    return "You're on the right track! Review the failing test cases for clues."
  } else if (percentage < 100) {
    return "Almost there! Check the edge cases that might be failing."
  }

  return "Great job!"
}

function sanitizeTestDescription(description: string): string {
  return description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .substring(0, 200) // Limit length
}
