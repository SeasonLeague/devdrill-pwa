"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
}

interface AchievementsPanelProps {
  achievements: Achievement[]
}

export default function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const recentAchievements = achievements.slice(-3).reverse()

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Complete your first task to earn achievements!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{achievement.name}</h4>
                  <p className="text-slate-300 text-xs">{achievement.description}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              </div>
            ))}
            {achievements.length > 3 && (
              <p className="text-slate-400 text-xs text-center mt-4">+{achievements.length - 3} more achievements</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
