"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeSyntaxHighlighterProps {
  code: string
  language: string
  className?: string
}

export default function CodeSyntaxHighlighter({ code, language, className = "" }: CodeSyntaxHighlighterProps) {
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: "transparent",
      margin: 0,
      padding: 0,
      fontSize: "14px",
      lineHeight: "1.5",
      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: "transparent",
      fontSize: "14px",
      lineHeight: "1.5",
      fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    },
  }

  return (
    <SyntaxHighlighter
      language={language === "javascript" ? "javascript" : "python"}
      style={customStyle}
      className={className}
      showLineNumbers={false}
      wrapLines={true}
      customStyle={{
        background: "transparent",
        padding: 0,
        margin: 0,
      }}
    >
      {code}
    </SyntaxHighlighter>
  )
}
