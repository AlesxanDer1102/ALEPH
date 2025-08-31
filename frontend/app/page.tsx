"use client"

import { Header } from "./components/Header"
import { Dashboard } from "./components/Dashboard"
import { useSmartAccountClient, useUser } from "@account-kit/react"

export default function Home() {
  const user = useUser()
  const { client, address, isLoadingClient } = useSmartAccountClient({})

  // Debug logging
  console.log("Auth state:", { user: !!user, client: !!client, address, isLoadingClient })

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-white">
        {isLoadingClient ? (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin h-8 w-8 border-2 border-[#3A71FC] border-t-transparent rounded-full"></div>
                <span className="text-lg font-medium text-[#3A71FC]">Loading Account...</span>
              </div>
              <p className="text-gray-600">
                Setting up your smart account wallet...
              </p>
            </div>
          </div>
        ) : client ? (
          <Dashboard />
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ALEPH</h2>
                <p className="text-gray-600">
                  Please connect your wallet to access the Escrow Dashboard and manage your USDC orders.
                </p>
              </div>
              <div className="space-y-4 text-sm text-gray-500">
                <p>• Create secure escrow orders</p>
                <p>• Request refunds for expired orders</p>
                <p>• Withdraw merchant balances</p>
                <p>• Track order status in real-time</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
