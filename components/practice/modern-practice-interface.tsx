"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Code, ArrowLeft, Lightbulb, Brain, Trophy, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import CodeEditor from "./code-editor"
import TestOutput from "./test-output"
import AIHelpDialog from "./ai-help-dialog"
import TaskLoading from "./task-loading"
import PWAInstallBanner from "../pwa-install-banner"
import Footer from "../footer"
import CodeExamples from "./code-examples"

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

interface ModernPracticeInterfaceProps {
  user: User
}

export default function ModernPracticeInterface({ user }: ModernPracticeInterfaceProps) {
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [userCode, setUserCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showTestOutput, setShowTestOutput] = useState(false)
  const [runOutput, setRunOutput] = useState("")
  const [runError, setRunError] = useState("")
  const [evaluation, setEvaluation] = useState<any>(null)
  const [showAIHelp, setShowAIHelp] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Time tracking
  const timeTrackingInterval = useRef<NodeJS.Timeout | null>(null)
  const sessionStarted = useRef(false)

  useEffect(() => {
    generateNewTask()
    startTimeTracking()

    // Cleanup on unmount
    return () => {
      endTimeTracking()
    }
  }, [])

  useEffect(() => {
    // Update current task in time tracking when task changes
    if (currentTask && sessionStarted.current) {
      updateTimeTracking(currentTask.id, currentTask.title)
    }
  }, [currentTask])

  useEffect(() => {
    // Update code template when language or task changes
    if (currentTask) {
      const template = getCodeTemplate()
      setUserCode(template)
    }
  }, [language, currentTask])

  const startTimeTracking = async () => {
    if (sessionStarted.current) return

    try {
      await fetch("/api/user/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_session" }),
      })

      sessionStarted.current = true

      // Update activity every 30 seconds
      timeTrackingInterval.current = setInterval(() => {
        if (currentTask) {
          updateTimeTracking(currentTask.id, currentTask.title)
        }
      }, 30000)
    } catch (error) {
      console.error("Failed to start time tracking:", error)
    }
  }

  const updateTimeTracking = async (taskId?: string, taskTitle?: string) => {
    try {
      await fetch("/api/user/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_activity",
          taskId,
          taskTitle,
        }),
      })
    } catch (error) {
      console.error("Failed to update time tracking:", error)
    }
  }

  const endTimeTracking = async () => {
    if (timeTrackingInterval.current) {
      clearInterval(timeTrackingInterval.current)
    }

    if (!sessionStarted.current) return

    try {
      await fetch("/api/user/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end_session" }),
      })
    } catch (error) {
      console.error("Failed to end time tracking:", error)
    }

    sessionStarted.current = false
  }

  const getCodeTemplate = () => {
    if (!currentTask) return ""

    if (language === "python") {
      return `def ${currentTask.functionName}():\n    # Your code here\n    pass`
    } else {
      return `function ${currentTask.functionName}() {\n  // Your code here\n}`
    }
  }

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
        setEvaluation(null)
        setShowHints(false)
        setShowTestOutput(false)
        setRunOutput("")
        setRunError("")
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

  const runCode = async () => {
    if (!currentTask || !userCode.trim()) {
      toast({
        title: "Error",
        description: "Please write some code before running.",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    setShowTestOutput(true)
    setRunOutput("")
    setRunError("")

    try {
      const response = await fetch("/api/tasks/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: userCode,
          language,
          task: currentTask,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setRunOutput(data.output || "Code executed successfully!")
      } else {
        setRunError(data.error || "Failed to run code")
      }
    } catch (error) {
      setRunError("Network error occurred while running code")
    } finally {
      setIsRunning(false)
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
    setShowTestOutput(true)

    try {
      const response = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: currentTask.id,
          code: userCode,
          language,
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

  const handleBackToDashboard = () => {
    endTimeTracking()
    router.push("/")
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
      <PWAInstallBanner />

      {/* Modern Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Button
              onClick={handleBackToDashboard}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Practice Session</h1>
                <p className="text-sm text-slate-400">Challenge yourself with AI-generated problems</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-full">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-300">{user.skillLevel}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-full">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-slate-300">{currentTask.points} pts</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Task Description */}
          <div className="space-y-6">
            <div className="modern-card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{currentTask.title}</h2>
                    <p className="text-slate-300 leading-relaxed">{currentTask.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 rounded-full">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-300 font-medium">Level {currentTask.difficulty}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <div className="w-1 h-4 bg-blue-500 rounded-full mr-2"></div>
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {currentTask.requirements.map((req, index) => (
                        <li key={index} className="text-slate-300 text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-green-300 mb-2 flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Code Playground
                    </h3>
                    <p className="text-green-200 text-sm">
                      You can run any code in the editor! Try "Hello World" or experiment with different concepts. When
                      you're ready, work on the challenge function and submit your solution.
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Function Name</h3>
                    <code className="bg-slate-900 px-3 py-1 rounded text-blue-300 text-sm font-mono">
                      {currentTask.functionName}
                    </code>
                    <p className="text-slate-400 text-xs mt-2">
                      Make sure your function is named exactly as shown above
                    </p>
                  </div>

                  {showHints && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-300 mb-3 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Hints
                      </h3>
                      <ul className="space-y-2">
                        {currentTask.hints.map((hint, index) => (
                          <li key={index} className="text-yellow-200 text-sm flex items-start">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            {hint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Code Examples */}
                  <CodeExamples language={language} onInsertCode={setUserCode} />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowHints(!showHints)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      {showHints ? "Hide Hints" : "Show Hints"}
                    </Button>
                    <Button
                      onClick={() => setShowAIHelp(true)}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Tutor
                    </Button>
                    <Button
                      onClick={generateNewTask}
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      Skip Challenge
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Output */}
            <TestOutput
              isVisible={showTestOutput}
              isRunning={isRunning}
              runOutput={runOutput}
              runError={runError}
              evaluation={evaluation}
            />
          </div>

          {/* Code Editor */}
          <div className="space-y-6">
            <CodeEditor
              value={userCode}
              onChange={setUserCode}
              language={language}
              onLanguageChange={setLanguage}
              onRun={runCode}
              onSubmit={submitCode}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              functionName={currentTask.functionName}
            />

            {evaluation?.passed && (
              <div className="modern-card">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Challenge Complete!</h3>
                  <p className="text-slate-300 mb-4">You earned {evaluation.score} points</p>
                  <Button onClick={generateNewTask} className="bg-blue-600 hover:bg-blue-700">
                    Next Challenge
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Help Dialog */}
      <AIHelpDialog open={showAIHelp} onOpenChange={setShowAIHelp} task={currentTask} userCode={userCode} />
      <Footer />
    </div>
  )
}
