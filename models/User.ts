import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  // Basic user info
  age: {
    type: Number,
    min: 13,
    max: 120,
    default: null,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    default: null,
  },
  occupation: {
    type: String,
    enum: ["Software Engineer", "Data Analyst", "Student", "Designer", "Product Manager", "Other"],
    default: null,
  },
  customOccupation: {
    type: String,
    trim: true,
    default: null,
  },
  // Invitation system
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    length: 5,
  },
  invitedBy: {
    type: String, // The invite code of who invited them
    default: null,
  },
  invitedUsers: [
    {
      inviteCode: String,
      name: String,
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  skillLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: null,
  },
  score: {
    type: Number,
    default: 0,
  },
  completedTasks: [
    {
      taskId: String,
      title: String,
      difficulty: Number,
      points: Number,
      completedAt: { type: Date, default: Date.now },
      attempts: { type: Number, default: 1 },
      timeSpent: { type: Number, default: 0 }, // in seconds
      category: String,
    },
  ],
  // Current session tracking
  currentTask: {
    taskId: String,
    title: String,
    startedAt: Date,
    lastActiveAt: Date,
    timeSpent: { type: Number, default: 0 }, // in seconds
  },
  // Time tracking
  totalTimeSpent: {
    type: Number,
    default: 0, // in seconds
  },
  sessionStartTime: {
    type: Date,
    default: null,
  },
  dailyStreak: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    favoriteTopics: [String],
    weakAreas: [String],
    learningGoals: [String],
  },
  statistics: {
    totalTimeSpent: { type: Number, default: 0 },
    averageAttempts: { type: Number, default: 0 },
    strongestTopics: [String],
    improvementAreas: [String],
    weeklyProgress: [
      {
        week: Date,
        tasksCompleted: Number,
        pointsEarned: Number,
        timeSpent: Number,
      },
    ],
  },
  achievements: [
    {
      id: String,
      name: String,
      description: String,
      unlockedAt: { type: Date, default: Date.now },
      icon: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Generate unique invite code before saving
UserSchema.pre("save", function (next) {
  if (this.isNew && !this.inviteCode) {
    this.inviteCode = generateInviteCode()
  }
  next()
})

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
