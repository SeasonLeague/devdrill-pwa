"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Smartphone, Monitor } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem("pwa-banner-dismissed")
    if (dismissed) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Show banner after a short delay if not installed
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        setShowBanner(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowBanner(false)
      setIsInstalled(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("pwa-banner-dismissed", "true")
  }

  if (isInstalled || !showBanner) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-lg animate-in slide-in-from-top duration-500">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm truncate">Install DevDrill App</h3>
                <p className="text-xs text-blue-100 hidden sm:block">Get the full experience with offline access</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3 lg:space-x-4 text-xs text-blue-100">
              <div className="flex items-center space-x-1">
                <Smartphone className="h-3 w-3" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor className="h-3 w-3" />
                <span>Desktop & mobile</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {deferredPrompt ? (
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-xs sm:text-sm px-2 sm:px-3"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Install</span>
                <span className="sm:hidden">Add</span>
              </Button>
            ) : (
              <div className="text-xs text-blue-100 px-2 sm:px-3 py-1 bg-white/10 rounded-full whitespace-nowrap">
                <span className="hidden sm:inline">Add to Home Screen available</span>
                <span className="sm:hidden">Available</span>
              </div>
            )}

            <Button onClick={handleDismiss} size="sm" variant="ghost" className="text-white hover:bg-white/10 p-1">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Animated gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
    </div>
  )
}
