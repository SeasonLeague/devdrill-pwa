import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import Dashboard from "@/components/dashboard"
import LandingPage from "@/components/landing-page"

export default async function Home() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (token) {
    try {
      const user = await verifyToken(token)
      if (user) {
        return <Dashboard user={user} />
      }
    } catch (error) {
      // Token invalid, show landing page
    }
  }

  return <LandingPage />
}
