import SignupWrapper from "@/components/auth/signup-wrapper"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join DevDrill</h1>
          <p className="text-slate-400 text-sm sm:text-base">Start your programming practice journey</p>
        </div>
        <SignupWrapper />
      </div>
    </div>
  )
}
