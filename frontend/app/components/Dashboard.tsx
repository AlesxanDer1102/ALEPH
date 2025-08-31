"use client"
import { useSmartAccountClient } from "@account-kit/react"

export const Dashboard = () => {
  const { client, address, isLoadingClient } = useSmartAccountClient({})

  if (isLoadingClient) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-[#3A71FC]/20 to-[#1C9EEF]/20 rounded-lg mb-6 w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Smart Account Dashboard</h2>
        </div>
        <div className="p-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Account Address */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#3A71FC]/20 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-[#3A71FC] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#3A71FC]">Account Address</h3>
            </div>
            {address ? (
              <div className="bg-white rounded-lg border border-[#3A71FC]/30 p-4">
                <p className="text-xs font-mono text-gray-800 break-all leading-relaxed">{address}</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#3A71FC]/30 p-4">
                <p className="text-gray-600 italic text-center">No address available</p>
              </div>
            )}
          </div>

          {/* Client Status */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#1C9EEF]/20 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-[#1C9EEF] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1C9EEF]">Client Status</h3>
            </div>
            <div className="bg-white rounded-lg border border-[#1C9EEF]/30 p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${client ? 'bg-[#1C9EEF] animate-pulse' : 'bg-gray-400'} shadow-lg`}></div>
                <p className={`font-semibold ${client ? 'text-[#1C9EEF]' : 'text-gray-600'}`}>
                  {client ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>

          {/* Client Details */}
          {client && (
            <div className="bg-white rounded-xl p-6 border-2 border-[#3A71FC]/10 shadow-lg lg:col-span-2 xl:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#3A71FC]">Chain Information</h3>
              </div>
              <div className="bg-white rounded-lg border border-[#3A71FC]/20 p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Chain ID</span>
                    <span className="text-sm font-bold text-[#3A71FC] bg-[#3A71FC]/10 px-2 py-1 rounded">
                      {client.chain?.id || 'Unknown'}
                    </span>
                  </div>
                  <div className="border-t border-[#3A71FC]/20"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Chain Name</span>
                    <span className="text-sm font-bold text-[#1C9EEF] bg-[#1C9EEF]/10 px-2 py-1 rounded">
                      {client.chain?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          <div className="bg-white rounded-xl p-6 border-2 border-[#1C9EEF]/20 shadow-lg lg:col-span-2 xl:col-span-3">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1C9EEF]">System Status</h3>
            </div>
            <div className="bg-white rounded-lg border border-[#1C9EEF]/30 p-4">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center space-x-2 ${isLoadingClient ? 'text-[#1C9EEF]' : 'text-[#3A71FC]'}`}>
                  {isLoadingClient ? (
                    <div className="animate-spin h-5 w-5 border-2 border-[#1C9EEF] border-t-transparent rounded-full"></div>
                  ) : (
                    <div className="w-5 h-5 bg-[#3A71FC] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <p className="font-semibold">
                    {isLoadingClient ? 'Loading client...' : 'Client loaded successfully'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}