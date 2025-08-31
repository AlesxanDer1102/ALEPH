"use client"
import {
  useAuthModal,
  useLogout,
  useSignerStatus,
  useUser,
} from "@account-kit/react"

export const Header = () => {
  const user = useUser()
  const { openAuthModal } = useAuthModal()
  const signerStatus = useSignerStatus()
  const { logout } = useLogout()

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">
          ALEPH
        </div>
        
        <div className="flex items-center">
          {signerStatus.isInitializing ? (
            <div className="text-gray-600">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                Welcome, {user.email ?? "anon"}
              </span>
              <button
                className="px-4 py-2 bg-[#3A71FC] hover:bg-[#2861eb] text-white rounded-md font-medium transition-colors"
                onClick={() => logout()}
              >
                Log out
              </button>
            </div>
          ) : (
            <button 
              className="px-4 py-2 bg-[#3A71FC] hover:bg-[#2861eb] text-white rounded-md font-medium transition-colors"
              onClick={openAuthModal}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}