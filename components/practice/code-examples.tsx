"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Copy } from "lucide-react"

interface CodeExamplesProps {
  language: string
  onInsertCode: (code: string) => void
}

export default function CodeExamples({ language, onInsertCode }: CodeExamplesProps) {
  const examples = {
    javascript: [
      {
        title: "Hello World",
        code: `console.log("Hello, World!");
console.log("Welcome to DevDrill!");`,
        description: "Basic console output",
      },
      {
        title: "Variables & Math",
        code: `let x = 10;
let y = 20;
console.log("x =", x);
console.log("y =", y);
console.log("x + y =", x + y);
x + y`,
        description: "Variables and expressions",
      },
      {
        title: "Arrays & Objects",
        code: `let numbers = [1, 2, 3, 4, 5];
console.log("Numbers:", numbers);

let person = { name: "Alice", age: 25 };
console.log("Person:", person);

numbers.length`,
        description: "Working with data structures",
      },
      {
        title: "Functions",
        code: `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
console.log(greet("DevDrill"));

greet("JavaScript")`,
        description: "Function definition and calls",
      },
    ],
    python: [
      {
        title: "Hello World",
        code: `print("Hello, World!")
print("Welcome to DevDrill!")`,
        description: "Basic print statements",
      },
      {
        title: "Variables & Math",
        code: `x = 10
y = 20
print("x =", x)
print("y =", y)
print("x + y =", x + y)`,
        description: "Variables and expressions",
      },
      {
        title: "Lists & Dictionaries",
        code: `numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)

person = {"name": "Alice", "age": 25}
print("Person:", person)`,
        description: "Working with data structures",
      },
      {
        title: "Functions",
        code: `def greet(name):
    return "Hello, " + name + "!"

print(greet("World"))
print(greet("DevDrill"))`,
        description: "Function definition and calls",
      },
    ],
  }

  const currentExamples = examples[language as keyof typeof examples] || examples.javascript

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center text-sm">
          <Code className="h-4 w-4 mr-2 text-blue-400" />
          Quick Examples
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentExamples.map((example, index) => (
          <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white text-sm font-medium">{example.title}</h4>
              <Button
                onClick={() => onInsertCode(example.code)}
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-6 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Use
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">{example.description}</p>
            <pre className="text-slate-300 text-xs font-mono bg-slate-800 p-2 rounded border border-slate-600 overflow-x-auto">
              {example.code}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
