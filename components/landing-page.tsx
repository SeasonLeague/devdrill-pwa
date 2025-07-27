"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Zap, Trophy, Brain } from "lucide-react"
import PWAInstallBanner from "./pwa-install-banner"
import Footer from "./footer"

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <PWAInstallBanner />

      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <Code className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          <span className="text-xl sm:text-2xl font-bold text-white">DevDrill</span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-transparent">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center flex-1">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
          Stay Sharp as a<span className="text-blue-400 block mt-2">Software Engineer</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Practice programming with interactive challenges, get AI-powered hints, and track your progress as you level
          up your coding skills.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link href="/auth/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base"
            >
              Start Practicing
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base bg-transparent"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">Why Choose DevDrill?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="feature-card">
            <CardHeader className="p-4 sm:p-6">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white text-lg sm:text-xl">Dynamic Challenges</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CardDescription className="text-slate-300 text-sm sm:text-base">
                Get personalized programming tasks that adapt to your skill level and progress.
              </CardDescription>
            </CardContent>
          </div>

          <div className="feature-card">
            <CardHeader className="p-4 sm:p-6">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white text-lg sm:text-xl">AI-Powered Help</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CardDescription className="text-slate-300 text-sm sm:text-base">
                Get hints and explanations from our AI tutor without spoiling the solution.
              </CardDescription>
            </CardContent>
          </div>

          <div className="feature-card">
            <CardHeader className="p-4 sm:p-6">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white text-lg sm:text-xl">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CardDescription className="text-slate-300 text-sm sm:text-base">
                Monitor your improvement with detailed scoring and achievement tracking.
              </CardDescription>
            </CardContent>
          </div>

          <div className="feature-card">
            <CardHeader className="p-4 sm:p-6">
              <Code className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white text-lg sm:text-xl">PWA Ready</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CardDescription className="text-slate-300 text-sm sm:text-base">
                Install as an app and practice offline. Works seamlessly across all devices.
              </CardDescription>
            </CardContent>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Ready to Level Up Your Skills?</h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Join thousands of developers who are staying sharp with DevDrill.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base">
            Get Started Free
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  )
}
