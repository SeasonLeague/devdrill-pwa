"use client"

import { Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="footer mt-auto">
      <div className="footer-content">
        <p className="footer-text">
          Built with <Heart className="footer-heart inline h-4 w-4 mx-1" />
          by <span className="footer-name">Godspower Maurice</span>
        </p>
      </div>
    </footer>
  )
}
