"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  requirements: string[]
  functionName?: string
}

interface AIHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  userCode: string
}

export default function AIHelpDialog({ open, onOpenChange, task, userCode }: AIHelpDialogProps) {
  const [question, setQuestion] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: {
            ...task,
            functionName: task.functionName,
          },
          userCode,
          question,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(data.help)
      } else {
        toast({
          title: "Error",
          description: "Failed to get AI help. Please try again.",
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

  const handleClose = () => {
    setQuestion("")
    setAiResponse("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">🤖 AI Programming Tutor</DialogTitle>
          <DialogDescription className="text-slate-300">
            Ask for help with your current challenge. I'll explain concepts simply without giving away the full
            solution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like help with? For example: 'How do I iterate through an array?' or 'I'm stuck on the logic for this problem'"
              className="min-h-[100px] bg-slate-700 border-slate-600 text-white"
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting help...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ask AI Tutor
                </>
              )}
            </Button>
          </form>

          {aiResponse && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">AI Tutor Response:</h4>
              <div className="text-slate-200 whitespace-pre-wrap">{aiResponse}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
