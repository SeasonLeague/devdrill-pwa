import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

const skillLevelPrompts = {
  Beginner: {
    topics: [
      "creating variables",
      "basic data types (string, number, boolean)",
      "string concatenation",
      "simple if statements",
      "basic for loops",
      "basic while loops",
      "type conversion",
      "simple string methods",
      "basic arithmetic operations",
      "comparing values",
      "working with arrays basics",
      "simple function creation",
    ],
    complexity: "extremely simple, single concept problems for absolute beginners",
    points: "5-15",
    examples: [
      "Create a variable and assign it a value",
      "Use if/else to check a condition",
      "Write a simple for loop",
      "Concatenate two strings",
      "Convert a string to a number",
    ],
  },
  Intermediate: {
    topics: [
      "array methods (push, pop, slice)",
      "object creation and access",
      "nested loops",
      "function parameters and return values",
      "string manipulation methods",
      "basic error handling",
      "working with multiple data types",
      "simple algorithms",
    ],
    complexity: "moderate complexity building on basic concepts",
    points: "20-35",
    examples: [
      "Use array methods to manipulate data",
      "Create and work with objects",
      "Write functions with parameters",
    ],
  },
  Advanced: {
    topics: [
      "advanced array methods (map, filter, reduce)",
      "closures and scope",
      "asynchronous programming basics",
      "complex data structures",
      "algorithm optimization",
      "design patterns",
      "advanced problem solving",
    ],
    complexity: "challenging problems requiring advanced thinking",
    points: "40-60",
    examples: ["Implement complex algorithms", "Work with advanced JavaScript features", "Solve optimization problems"],
  },
}

export async function generateTask(skillLevel: string, completedTasks: string[] = []): Promise<Task> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })

  const levelConfig = skillLevelPrompts[skillLevel as keyof typeof skillLevelPrompts] || skillLevelPrompts.Beginner
  const randomTopic = levelConfig.topics[Math.floor(Math.random() * levelConfig.topics.length)]

  const prompt = `
You are a programming instructor creating coding challenges for absolute beginners. Generate a ${skillLevel.toLowerCase()} level programming task about "${randomTopic}".

IMPORTANT FOR BEGINNERS: Assume the student knows NOTHING about programming. Start with the most basic concepts.

Requirements:
- Create a ${levelConfig.complexity}
- Points should be in range ${levelConfig.points}
- The task should be different from these completed tasks: ${completedTasks.join(", ") || "none"}
- Focus on ${skillLevel === "Beginner" ? "JavaScript basics - variables, if/else, loops, strings, numbers, booleans" : "JavaScript/TypeScript"}
- Include proper test cases that are very simple to understand
- For beginners, explain WHAT each concept does, not just HOW to use it

Examples of beginner topics: ${levelConfig.examples?.join(", ") || "basic programming concepts"}

Please respond with a valid JSON object in this exact format:
{
  "title": "Task Title (make it encouraging for beginners)",
  "description": "Clear, simple description explaining the concept and what the function should do. For beginners, explain WHY this is useful.",
  "requirements": [
    "Very simple, step-by-step requirement 1",
    "Very simple, step-by-step requirement 2", 
    "Very simple, step-by-step requirement 3"
  ],
  "hints": [
    "Encouraging hint that explains the concept",
    "Step-by-step guidance hint",
    "Example or analogy hint"
  ],
  "functionName": "simpleDescriptiveName",
  "testCases": [
    {
      "input": [simple_input],
      "expected": simple_expected_result,
      "description": "Clear description of what should happen"
    },
    {
      "input": [simple_input2],
      "expected": simple_expected_result2,
      "description": "Clear description of what should happen"
    },
    {
      "input": [simple_input3],
      "expected": simple_expected_result3,
      "description": "Clear description of what should happen"
    }
  ],
  "difficulty": ${skillLevel === "Beginner" ? "1-2" : skillLevel === "Intermediate" ? "3-5" : "6-10"},
  "points": ${levelConfig.points.split("-")[0]}-${levelConfig.points.split("-")[1]}
}

Important notes for beginners:
- Use very simple test cases (single numbers, short strings, true/false)
- Explain programming concepts in plain English
- Make the task feel achievable and encouraging
- Use real-world analogies when possible
- Function names should be very descriptive (like "addTwoNumbers" not "add")

Generate a beginner-friendly programming challenge now.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response")
    }

    const taskData = JSON.parse(jsonMatch[0])

    // Generate a unique ID based on title and timestamp
    const taskId =
      taskData.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now()

    const task: Task = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      requirements: taskData.requirements,
      hints: taskData.hints,
      testCases: taskData.testCases,
      difficulty:
        typeof taskData.difficulty === "number"
          ? taskData.difficulty
          : Number.parseInt(taskData.difficulty) ||
            (skillLevel === "Beginner" ? 1 : skillLevel === "Intermediate" ? 3 : 6),
      points:
        typeof taskData.points === "number"
          ? taskData.points
          : Number.parseInt(taskData.points) ||
            (skillLevel === "Beginner" ? 10 : skillLevel === "Intermediate" ? 25 : 45),
      functionName: taskData.functionName,
    }

    return task
  } catch (error) {
    console.error("Error generating task with AI:", error)

    // Fallback to a simple generated task if AI fails
    return generateFallbackTask(skillLevel)
  }
}

function generateFallbackTask(skillLevel: string): Task {
  const fallbackTasks = {
    Beginner: {
      title: "Create Your First Variable",
      description:
        "Variables are like boxes that store information. In this challenge, you'll create a variable to store your name and return it. Think of it like putting your name on a name tag!",
      requirements: [
        'Create a function called "createNameVariable"',
        "Inside the function, create a variable called 'myName' and assign it the string 'Student'",
        "Return the myName variable",
      ],
      hints: [
        "Variables in JavaScript are created using 'let' or 'const'",
        "Strings (text) are wrapped in quotes like 'Hello' or \"Hello\"",
        "Use the 'return' keyword to give back the value",
      ],
      functionName: "createNameVariable",
      testCases: [{ input: [], expected: "Student", description: "createNameVariable() should return 'Student'" }],
      difficulty: 1,
      points: 5,
    },
    Intermediate: {
      title: "Array Manipulation Practice",
      description: "Work with arrays to add and remove elements using built-in methods.",
      requirements: [
        'Create a function named "manipulateArray" that accepts an array parameter',
        "Add the number 4 to the end of the array",
        "Remove the first element from the array",
        "Return the modified array",
      ],
      hints: [
        "Use the push() method to add elements to the end",
        "Use the shift() method to remove the first element",
        "Remember to return the modified array",
      ],
      functionName: "manipulateArray",
      testCases: [
        { input: [[1, 2, 3]], expected: [2, 3, 4], description: "manipulateArray([1,2,3]) should return [2,3,4]" },
        { input: [[5, 6]], expected: [6, 4], description: "manipulateArray([5,6]) should return [6,4]" },
      ],
      difficulty: 3,
      points: 25,
    },
    Advanced: {
      title: "Implement Array Filter",
      description: "Create a custom filter function that mimics the behavior of Array.prototype.filter().",
      requirements: [
        'Create a function named "customFilter" that accepts an array and a callback function',
        "Iterate through the array and apply the callback to each element",
        "Return a new array containing only elements where the callback returns true",
      ],
      hints: [
        "Use a for loop or forEach to iterate through the array",
        "Call the callback function with each element",
        "Only add elements to the result array when callback returns true",
      ],
      functionName: "customFilter",
      testCases: [
        {
          input: [[1, 2, 3, 4, 5], "x => x > 3"],
          expected: [4, 5],
          description: "customFilter([1,2,3,4,5], x => x > 3) should return [4,5]",
        },
      ],
      difficulty: 7,
      points: 45,
    },
  }

  const fallback = fallbackTasks[skillLevel as keyof typeof fallbackTasks] || fallbackTasks.Beginner

  return {
    id: `fallback-${skillLevel.toLowerCase()}-${Date.now()}`,
    ...fallback,
  }
}
