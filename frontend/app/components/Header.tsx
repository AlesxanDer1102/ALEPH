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
    <header className="w-full bg-white shadow-lg border-b-2 border-[#3A71FC] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-[#3A71FC] tracking-tight">
              ALEPH
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-700 hover:text-[#3A71FC] font-medium transition-colors">
                Dashboard
              </a>
              <a href="/create-order" className="text-gray-700 hover:text-[#3A71FC] font-medium transition-colors">
                Create Order
              </a>
              <a href="/refund" className="text-gray-700 hover:text-[#3A71FC] font-medium transition-colors">
                Refund
              </a>
              <a href="/withdraw" className="text-gray-700 hover:text-[#3A71FC] font-medium transition-colors">
                Withdraw
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {signerStatus.isInitializing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#1C9EEF] border-t-transparent rounded-full"></div>
                <span className="text-[#1C9EEF] font-medium text-sm">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <span className="text-gray-700 text-sm font-medium">
                    Welcome, <span className="text-[#3A71FC] font-semibold">{user.email ?? "anon"}</span>
                  </span>
                </div>
                <button
                  className="px-4 py-2 bg-[#3A71FC] hover:bg-[#2861eb] text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                  onClick={() => logout()}
                >
                  Log out
                </button>
              </div>
            ) : (
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] hover:from-[#2861eb] hover:to-[#1689d6] text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                onClick={openAuthModal}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}