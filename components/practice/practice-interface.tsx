"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Code, Lightbulb, CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import AIHelpDialog from "./ai-help-dialog"
import TaskLoading from "./task-loading"

interface User {
  id: string
  name: string
  skillLevel: string
  completedTasks: string[]
}

interface Task {
  id: string
  title: string
  description: string
  requirements: string[]
  hints: string[]
  testCases: Array<{
    input: any
    expected: any
    description: string
  }>
  difficulty: number
  points: number
  functionName: string
}

interface PracticeInterfaceProps {
  user: User
}

export default function PracticeInterface({ user }: PracticeInterfaceProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [userCode, setUserCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [showAIHelp, setShowAIHelp] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    generateNewTask()
  }, [])

  const generateNewTask = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillLevel: user.skillLevel,
          completedTasks: user.completedTasks,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentTask(data.task)
        setUserCode("")
        setEvaluation(null)
        setShowHints(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to generate task. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const submitCode = async () => {
    if (!currentTask || !userCode.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: currentTask.id,
          code: userCode,
          task: currentTask,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEvaluation(data.evaluation)

        if (data.evaluation.passed) {
          toast({
            title: "Congratulations! 🎉",
            description: `You earned ${data.evaluation.score} points!`,
          })
        } else {
          toast({
            title: "Not quite right",
            description: "Check the feedback and try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to submit code. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <TaskLoading />
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Failed to load task</p>
          <Button onClick={generateNewTask}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <Code className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Practice Session</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-300">Difficulty:</span>
          <span className="text-sm font-bold text-blue-400">
            {user.skillLevel} • {currentTask.points} pts
          </span>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Task Description */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Code className="h-5 w-5 mr-2 text-blue-400" />
                  {currentTask.title}
                </CardTitle>
                <CardDescription className="text-slate-300">{currentTask.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Requirements:</h4>
                    <ul className="space-y-1">
                      {currentTask.requirements.map((req, index) => (
                        <li key={index} className="text-slate-300 text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Function Name:</h4>
                    <code className="bg-slate-700 px-2 py-1 rounded text-blue-300 text-sm">
                      {currentTask.functionName}
                    </code>
                    <p className="text-slate-400 text-xs mt-1">
                      Make sure your function is named exactly as shown above
                    </p>
                  </div>

                  {showHints && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Hints:</h4>
                      <ul className="space-y-1">
                        {currentTask.hints.map((hint, index) => (
                          <li key={index} className="text-slate-300 text-sm flex items-start">
                            <Lightbulb className="h-4 w-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                            {hint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button onClick={() => setShowHints(!showHints)} variant="outline" size="sm">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {showHints ? "Hide Hints" : "Show Hints"}
                    </Button>
                    <Button onClick={() => setShowAIHelp(true)} variant="outline" size="sm">
                      🤖 AI Help
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Results */}
            {evaluation && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    {evaluation.passed ? (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2 text-red-400" />
                    )}
                    {evaluation.passed ? "Success!" : "Try Again"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-slate-300">{evaluation.feedback}</p>

                    {evaluation.testResults && (
                      <div>
                        <h4 className="font-semibold text-white mb-2">Test Results:</h4>
                        <div className="space-y-2">
                          {evaluation.testResults.map((result: any, index: number) => (
                            <div
                              key={index}
                              className={`p-2 rounded text-sm ${
                                result.passed
                                  ? "bg-green-900/20 border border-green-700"
                                  : "bg-red-900/20 border border-red-700"
                              }`}
                            >
                              <div className="flex items-center">
                                {result.passed ? (
                                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-400 mr-2" />
                                )}
                                <span className="text-white">{result.description}</span>
                              </div>
                              {!result.passed && <p className="text-slate-300 mt-1 ml-6">{result.error}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {evaluation.passed && (
                      <Button onClick={generateNewTask} className="w-full">
                        Next Challenge
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Code Editor */}
          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Your Solution</CardTitle>
                <CardDescription className="text-slate-300">Write your code here and submit when ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder={`// Write your ${currentTask.functionName} function here...\nfunction ${currentTask.functionName}() {\n  // Your code here\n}`}
                    className="min-h-[400px] font-mono text-sm bg-slate-900 border-slate-600 text-white"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={submitCode}
                      disabled={isSubmitting || !userCode.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Solution"
                      )}
                    </Button>
                    <Button onClick={generateNewTask} variant="outline">
                      Skip Challenge
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Help Dialog */}
      <AIHelpDialog open={showAIHelp} onOpenChange={setShowAIHelp} task={currentTask} userCode={userCode} />
    </div>
  )
}
