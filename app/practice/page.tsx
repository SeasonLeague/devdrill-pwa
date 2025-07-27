import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import ModernPracticeInterface from "@/components/practice/modern-practice-interface"

export default async function PracticePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/auth/login")
  }

  try {
    const user = await verifyToken(token)
    if (!user) {
      redirect("/auth/login")
    }

    if (!user.skillLevel) {
      redirect("/skill-selection")
    }

    return <ModernPracticeInterface user={user} />
  } catch (error) {
    redirect("/auth/login")
  }
}
