"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Send, Loader2, Copy, RotateCcw } from "lucide-react"
import CodeSyntaxHighlighter from "./syntax-highlighter"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  onLanguageChange: (language: string) => void
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  isSubmitting: boolean
  functionName: string
}

export default function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  functionName,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineNumbers, setLineNumbers] = useState<number[]>([1])
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    updateLineNumbers()
  }, [value])

  const updateLineNumbers = () => {
    const lines = value.split("\n").length
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = textarea

    // Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault()
      const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd)
      onChange(newValue)

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2
      }, 0)
    }

    // Enter key for auto-indentation
    if (e.key === "Enter") {
      e.preventDefault()
      const lines = value.substring(0, selectionStart).split("\n")
      const currentLine = lines[lines.length - 1]
      const indent = currentLine.match(/^\s*/)?.[0] || ""

      // Add extra indent for certain patterns
      let extraIndent = ""
      if (language === "javascript") {
        if (currentLine.trim().endsWith("{") || currentLine.trim().endsWith("(")) {
          extraIndent = "  "
        }
      } else if (language === "python") {
        if (currentLine.trim().endsWith(":")) {
          extraIndent = "    " // Python uses 4 spaces
        }
      }

      const newValue = value.substring(0, selectionStart) + "\n" + indent + extraIndent + value.substring(selectionEnd)
      onChange(newValue)

      setTimeout(() => {
        const newPosition = selectionStart + 1 + indent.length + extraIndent.length
        textarea.selectionStart = textarea.selectionEnd = newPosition
      }, 0)
    }

    // Bracket auto-completion
    const brackets: { [key: string]: string } = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
    }

    if (brackets[e.key] && selectionStart === selectionEnd) {
      e.preventDefault()
      const newValue = value.substring(0, selectionStart) + e.key + brackets[e.key] + value.substring(selectionEnd)
      onChange(newValue)

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
      }, 0)
    }

    // Handle closing brackets - skip if next character is the closing bracket
    if ([")", "]", "}", '"', "'"].includes(e.key)) {
      const nextChar = value.charAt(selectionStart)
      if (nextChar === e.key) {
        e.preventDefault()
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
        }, 0)
      }
    }
  }

  const getPlaceholder = () => {
    if (language === "python") {
      return `# Write any Python code here...\nprint("Hello, World!")\n\n# Or work on your ${functionName} function:\ndef ${functionName}():\n    # Your code here\n    pass`
    } else {
      return `// Write any JavaScript code here...\nconsole.log("Hello, World!");\n\n// Or work on your ${functionName} function:\nfunction ${functionName}() {\n  // Your code here\n}`
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(value)
  }

  const resetCode = () => {
    const template = getPlaceholder()
    onChange(template)
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersElement = e.currentTarget.parentElement?.querySelector(".line-numbers")
    if (lineNumbersElement) {
      lineNumbersElement.scrollTop = e.currentTarget.scrollTop
    }
  }

  return (
    <div className="modern-card group">
      <div className="flex items-center justify-between mb-4 p-4 pb-0">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Code Editor</h3>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="javascript" className="text-white hover:bg-slate-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>JavaScript</span>
                </div>
              </SelectItem>
              <SelectItem value="python" className="text-white hover:bg-slate-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Python</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={copyCode} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Copy className="h-4 w-4" />
          </Button>
          <Button onClick={resetCode} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <div className="flex bg-slate-900 rounded-lg border border-slate-700 overflow-hidden min-h-[400px]">
            {/* Line numbers */}
            <div className="line-numbers bg-slate-800 px-3 py-4 text-slate-400 text-sm font-mono select-none border-r border-slate-700 overflow-hidden">
              {lineNumbers.map((num) => (
                <div key={num} className="leading-6 text-right h-6">
                  {num}
                </div>
              ))}
            </div>

            {/* Code editor container */}
            <div className="flex-1 relative">
              {/* Syntax highlighting overlay */}
              <div className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-hidden">
                <CodeSyntaxHighlighter code={value || " "} language={language} className="syntax-highlighter" />
              </div>

              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={!value ? getPlaceholder() : ""}
                className={`w-full min-h-[400px] p-4 bg-transparent text-transparent font-mono text-sm leading-6 resize-none outline-none placeholder-slate-500 relative z-10 caret-blue-400 ${
                  isFocused ? "text-transparent" : "text-transparent"
                }`}
                style={{
                  caretColor: "#3b82f6",
                  color: "transparent",
                }}
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Tab for indent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Auto-complete brackets</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={onRun}
              disabled={isRunning || !value.trim()}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Code
                </>
              )}
            </Button>

            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !value.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Solution
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
