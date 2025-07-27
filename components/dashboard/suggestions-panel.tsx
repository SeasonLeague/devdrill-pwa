"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Lightbulb, Target, Clock, Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  skillLevel?: string
}

interface Suggestions {
  nextTopics: Array<{
    topic: string
    reason: string
    difficulty: string
    estimatedTime: string
    priority: string
  }>
  skillGaps: Array<{
    area: string
    description: string
    suggestedActions: string[]
  }>
  achievements: Array<{
    goal: string
    description: string
    progress: string
  }>
  dailyGoal: {
    description: string
    tasks: number
    estimatedTime: string
  }
}

interface SuggestionsPanelProps {
  user: User
}

export default function SuggestionsPanel({ user }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/suggestions")
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-blue-500"
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-400" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="ml-2 text-slate-300">Analyzing your progress...</span>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-400" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-4">Unable to load suggestions</p>
          <Button onClick={fetchSuggestions} variant="outline" className="w-full bg-transparent">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-400" />
          AI Suggestions
        </CardTitle>
        <CardDescription className="text-slate-400">
          Personalized recommendations for your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Goal */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Target className="h-4 w-4 text-blue-400 mr-2" />
            <h4 className="font-semibold text-white">Today's Goal</h4>
          </div>
          <p className="text-slate-300 text-sm mb-2">{suggestions.dailyGoal.description}</p>
          <div className="flex items-center text-xs text-slate-400">
            <Clock className="h-3 w-3 mr-1" />
            {suggestions.dailyGoal.estimatedTime}
          </div>
        </div>

        {/* Next Topics */}
        <div>
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Lightbulb className="h-4 w-4 text-yellow-400 mr-2" />
            Recommended Topics
          </h4>
          <div className="space-y-3">
            {suggestions.nextTopics.slice(0, 2).map((topic, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-white text-sm">{topic.topic}</h5>
                  <Badge className={`${getPriorityColor(topic.priority)} text-white text-xs`}>{topic.priority}</Badge>
                </div>
                <p className="text-slate-300 text-xs mb-2">{topic.reason}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{topic.difficulty}</span>
                  <span>{topic.estimatedTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        {suggestions.skillGaps.length > 0 && (
          <div>
            <h4 className="font-semibold text-white mb-3">Areas to Improve</h4>
            <div className="space-y-2">
              {suggestions.skillGaps.slice(0, 1).map((gap, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-3">
                  <h5 className="font-medium text-white text-sm mb-1">{gap.area}</h5>
                  <p className="text-slate-300 text-xs mb-2">{gap.description}</p>
                  <ul className="text-xs text-slate-400">
                    {gap.suggestedActions.slice(0, 2).map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start">
                        <span className="mr-1">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={fetchSuggestions} variant="outline" className="w-full bg-transparent" size="sm">
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  )
}
