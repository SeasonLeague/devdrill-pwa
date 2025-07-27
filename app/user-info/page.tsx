import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import UserInfoCollection from "@/components/user-info-collection"

export default async function UserInfoPage() {
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

    return <UserInfoCollection user={user} />
  } catch (error) {
    redirect("/auth/login")
  }
}
