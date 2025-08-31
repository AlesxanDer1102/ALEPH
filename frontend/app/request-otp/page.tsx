"use client"
import { useState } from 'react'
import { Header } from "../components/Header"
import { useRequestOTP, useCurrentLocation, useDeviceId } from '../hooks/useAPI'

export default function RequestOTPPage() {
  const [orderId, setOrderId] = useState('')
  const [mode, setMode] = useState<'otp' | 'qr' | 'both'>('otp')

  // API hooks
  const otpRequest = useRequestOTP()
  const location = useCurrentLocation()
  const deviceId = useDeviceId()

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderId.trim()) {
      alert('Please enter an order ID')
      return
    }

    if (!orderId.match(/^0x[a-fA-F0-9]{64}$/)) {
      alert('Invalid order ID format. Must be 0x followed by 64 hex characters.')
      return
    }

    // Get buyer location
    const gpsLocation = await location.getCurrentLocation()
    if (!gpsLocation) {
      alert('Failed to get GPS location')
      return
    }

    // Request OTP/QR
    await otpRequest.execute({
      order_id: orderId,
      gps_buyer: gpsLocation,
      mode: mode,
      device_id: deviceId
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Request OTP for Delivery</h1>
            <p className="text-white/90 text-sm mt-1">
              As a buyer, request an OTP or QR code for delivery confirmation
            </p>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleRequestOTP} className="space-y-6">
              {/* Order ID Input */}
              <div className="space-y-2">
                <label htmlFor="orderId" className="block text-sm font-semibold text-[#3A71FC]">
                  Order ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Enter the order ID from your transaction receipt
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A71FC]">
                  Confirmation Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['otp', 'qr', 'both'] as const).map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        value={option}
                        checked={mode === option}
                        onChange={(e) => setMode(e.target.value as 'otp' | 'qr' | 'both')}
                        className="text-[#3A71FC] focus:ring-[#3A71FC]"
                      />
                      <span className="text-sm capitalize">{option === 'otp' ? 'OTP Only' : option === 'qr' ? 'QR Only' : 'Both'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p><strong>Device ID:</strong> {deviceId}</p>
                {location.state.data && (
                  <div className="mt-2">
                    <p><strong>Your Location (Demo):</strong> Times Square, NYC</p>
                    <p className="text-gray-600">Lat: {location.state.data.lat}, Lon: {location.state.data.lon}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={otpRequest.state.loading || !orderId.trim()}
                className="w-full bg-[#3A71FC] text-white py-3 px-4 rounded-lg hover:bg-[#3A71FC]/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {otpRequest.state.loading ? 'Requesting...' : 'Request OTP/QR Code'}
              </button>
            </form>

            {/* Error Display */}
            {otpRequest.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      {otpRequest.state.error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {otpRequest.state.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-green-800">OTP Generated Successfully!</h3>
                    
                    {otpRequest.state.data.otp && (
                      <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">One-Time Password (OTP)</p>
                            <p className="text-3xl font-mono font-bold text-green-700 mt-1">
                              {otpRequest.state.data.otp}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(otpRequest.state.data!.otp!)}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    {otpRequest.state.data.qr_payload && (
                      <div className="mt-4 p-4 bg-white border border-green-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">QR Code Payload</p>
                            <p className="text-xs font-mono text-gray-600 mt-1 break-all">
                              {otpRequest.state.data.qr_payload}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(otpRequest.state.data!.qr_payload!)}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-green-700">
                      <p><strong>Expires:</strong> {new Date(otpRequest.state.data.expires_at * 1000).toLocaleString()}</p>
                      <p className="mt-2 text-green-600">
                        💡 Share this OTP/QR with your delivery courier to confirm delivery
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}