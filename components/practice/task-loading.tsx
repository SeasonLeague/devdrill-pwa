"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, Code, Brain } from "lucide-react"

export default function TaskLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-blue-400 animate-pulse" />
            </div>
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">🤖 AI is crafting your challenge...</h2>

          <div className="space-y-3 text-slate-300">
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Analyzing your skill level</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Code className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Generating unique programming task</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Creating test cases and hints</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-6">This may take a few seconds...</p>
        </CardContent>
      </Card>
    </div>
  )
}
