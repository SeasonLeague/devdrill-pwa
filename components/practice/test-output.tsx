"use client"

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Play, Terminal, Code2 } from "lucide-react"

interface TestResult {
  passed: boolean
  description: string
  error?: string
  input?: any
  expected?: any
  actual?: any
}

interface TestOutputProps {
  isVisible: boolean
  isRunning: boolean
  runOutput?: string
  runError?: string
  testResults?: TestResult[]
  evaluation?: {
    passed: boolean
    score: number
    feedback: string
    testResults: TestResult[]
  }
}

export default function TestOutput({
  isVisible,
  isRunning,
  runOutput,
  runError,
  testResults,
  evaluation,
}: TestOutputProps) {
  if (!isVisible) return null

  return (
    <div className="modern-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Terminal className="h-5 w-5 mr-2 text-green-400" />
          Code Output & Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="flex items-center space-x-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>Running your code...</span>
          </div>
        )}

        {/* Runtime Error Display */}
        {runError && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <XCircle className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-red-400 font-semibold">Runtime Error</span>
            </div>
            <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono bg-red-900/10 p-3 rounded border border-red-800">
              {runError}
            </pre>
          </div>
        )}

        {/* Code Output Display */}
        {runOutput && !runError && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Play className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-green-400 font-semibold">Code Output</span>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <pre className="text-green-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{runOutput}</pre>
            </div>
            <div className="mt-2 text-xs text-green-400/70">✓ Code executed successfully</div>
          </div>
        )}

        {/* Test Evaluation Results */}
        {evaluation && (
          <div className="space-y-4">
            <div
              className={`border rounded-lg p-4 ${
                evaluation.passed ? "bg-green-900/20 border-green-700" : "bg-red-900/20 border-red-700"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {evaluation.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                  )}
                  <span className={`font-semibold ${evaluation.passed ? "text-green-400" : "text-red-400"}`}>
                    {evaluation.passed ? "All Tests Passed!" : "Some Tests Failed"}
                  </span>
                </div>
                {evaluation.passed && (
                  <div className="flex items-center space-x-2">
                    <div className="text-yellow-400 font-bold">+{evaluation.score} points</div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded border border-slate-700">
                {evaluation.feedback}
              </p>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm flex items-center">
                <Code2 className="h-4 w-4 mr-2 text-blue-400" />
                Test Results:
              </h4>
              {evaluation.testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border text-sm ${
                    result.passed ? "bg-green-900/10 border-green-800" : "bg-red-900/10 border-red-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 mr-2" />
                      )}
                      <span className="text-white font-medium">Test {index + 1}</span>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        result.passed ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result.passed ? "PASSED" : "FAILED"}
                    </div>
                  </div>

                  <p className="text-slate-300 mb-2">{result.description}</p>

                  {!result.passed && result.error && (
                    <div className="bg-red-900/20 border border-red-800 rounded p-3 mt-2">
                      <p className="text-red-300 text-xs font-mono">{result.error}</p>
                    </div>
                  )}

                  {/* Show input/expected/actual for failed tests */}
                  {!result.passed &&
                    (result.input !== undefined || result.expected !== undefined || result.actual !== undefined) && (
                      <div className="mt-3 space-y-2 text-xs">
                        {result.input !== undefined && (
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 font-medium min-w-[60px]">Input:</span>
                            <code className="text-blue-300 font-mono bg-slate-800 px-2 py-1 rounded">
                              {JSON.stringify(result.input)}
                            </code>
                          </div>
                        )}
                        {result.expected !== undefined && (
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 font-medium min-w-[60px]">Expected:</span>
                            <code className="text-green-300 font-mono bg-slate-800 px-2 py-1 rounded">
                              {JSON.stringify(result.expected)}
                            </code>
                          </div>
                        )}
                        {result.actual !== undefined && (
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 font-medium min-w-[60px]">Actual:</span>
                            <code className="text-red-300 font-mono bg-slate-800 px-2 py-1 rounded">
                              {JSON.stringify(result.actual)}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isRunning && !runOutput && !runError && !evaluation && (
          <div className="text-center py-12 text-slate-400">
            <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Run Code</h3>
            <p className="text-sm">Click "Run Code" to execute your code and see the output here</p>
            <div className="mt-4 text-xs text-slate-500">
              <div className="flex items-center justify-center space-x-4">
                <span>• Console output</span>
                <span>• Return values</span>
                <span>• Error messages</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  )
}
