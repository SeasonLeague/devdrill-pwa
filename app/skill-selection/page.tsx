import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import SkillSelection from "@/components/skill-selection"

export default async function SkillSelectionPage() {
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

    return <SkillSelection user={user} />
  } catch (error) {
    redirect("/auth/login")
  }
}
