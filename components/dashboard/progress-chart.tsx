"use client"

interface Statistics {
  skillDistribution: {
    Beginner: number
    Intermediate: number
    Advanced: number
  }
  totalTasks: number
}

interface ProgressChartProps {
  statistics: Statistics
}

export default function ProgressChart({ statistics }: ProgressChartProps) {
  const { skillDistribution, totalTasks } = statistics

  const getPercentage = (count: number) => {
    return totalTasks > 0 ? (count / totalTasks) * 100 : 0
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white text-sm">Skill Distribution</h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Beginner</span>
            <span className="text-slate-300">{skillDistribution.Beginner} tasks</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getPercentage(skillDistribution.Beginner)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Intermediate</span>
            <span className="text-slate-300">{skillDistribution.Intermediate} tasks</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getPercentage(skillDistribution.Intermediate)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">Advanced</span>
            <span className="text-slate-300">{skillDistribution.Advanced} tasks</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getPercentage(skillDistribution.Advanced)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
