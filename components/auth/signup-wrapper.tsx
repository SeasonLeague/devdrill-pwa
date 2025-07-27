"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import SignupForm from "./signup-form"

function SignupFormWithParams() {
  const searchParams = useSearchParams()
  const inviteFromUrl = searchParams.get("invite")

  return <SignupForm inviteFromUrl={inviteFromUrl} />
}

export default function SignupWrapper() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto">
          <div className="bg-slate-800 border-slate-700 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
              <div className="h-10 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <SignupFormWithParams />
    </Suspense>
  )
}
