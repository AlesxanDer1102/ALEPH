"use client"
import { useState } from 'react'
import { Header } from "../components/Header"
import { useConfirmDelivery, useCourierLocation } from '../hooks/useAPI'

export default function ConfirmDeliveryPage() {
  const [formData, setFormData] = useState({
    orderId: '',
    otp: '',
    qrToken: '',
    courierId: '',
    photoUri: ''
  })
  const [confirmationType, setConfirmationType] = useState<'otp' | 'qr'>('otp')

  // API hooks
  const deliveryConfirm = useConfirmDelivery()
  const courierLocation = useCourierLocation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.orderId.trim() || !formData.courierId.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!formData.orderId.match(/^0x[a-fA-F0-9]{64}$/)) {
      alert('Invalid order ID format. Must be 0x followed by 64 hex characters.')
      return
    }

    if (confirmationType === 'otp' && !formData.otp.trim()) {
      alert('Please enter the OTP')
      return
    }

    if (confirmationType === 'qr' && !formData.qrToken.trim()) {
      alert('Please enter the QR token')
      return
    }

    // Get courier location
    const gpsLocation = await courierLocation.getCourierLocation()
    if (!gpsLocation) {
      alert('Failed to get courier GPS location')
      return
    }

    // Prepare request data
    const requestData = {
      order_id: formData.orderId,
      courier_id: formData.courierId,
      gps_courier: gpsLocation,
      ...(confirmationType === 'otp' ? { otp: formData.otp } : { qr_token: formData.qrToken }),
      ...(formData.photoUri && { photo_uri: formData.photoUri })
    }

    await deliveryConfirm.execute(requestData)
  }

  const resetForm = () => {
    setFormData({
      orderId: '',
      otp: '',
      qrToken: '',
      courierId: '',
      photoUri: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1C9EEF] to-[#3A71FC] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Confirm Delivery</h1>
            <p className="text-white/90 text-sm mt-1">
              As a courier, confirm successful delivery using OTP or QR code
            </p>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleConfirmDelivery} className="space-y-6">
              {/* Order ID Input */}
              <div className="space-y-2">
                <label htmlFor="orderId" className="block text-sm font-semibold text-[#3A71FC]">
                  Order ID *
                </label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent"
                  required
                />
              </div>

              {/* Courier ID Input */}
              <div className="space-y-2">
                <label htmlFor="courierId" className="block text-sm font-semibold text-[#3A71FC]">
                  Courier ID *
                </label>
                <input
                  type="text"
                  id="courierId"
                  name="courierId"
                  value={formData.courierId}
                  onChange={handleInputChange}
                  placeholder="Enter your courier ID"
                  className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent"
                  required
                />
              </div>

              {/* Confirmation Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#3A71FC]">
                  Confirmation Method
                </label>
                <div className="flex space-x-4">
                  {(['otp', 'qr'] as const).map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="confirmationType"
                        value={type}
                        checked={confirmationType === type}
                        onChange={(e) => setConfirmationType(e.target.value as 'otp' | 'qr')}
                        className="text-[#3A71FC] focus:ring-[#3A71FC]"
                      />
                      <span className="text-sm uppercase font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* OTP or QR Token Input */}
              {confirmationType === 'otp' ? (
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-semibold text-[#3A71FC]">
                    OTP Code *
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent font-mono text-lg"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Enter the 6-digit OTP provided by the buyer
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="qrToken" className="block text-sm font-semibold text-[#3A71FC]">
                    QR Token *
                  </label>
                  <input
                    type="text"
                    id="qrToken"
                    name="qrToken"
                    value={formData.qrToken}
                    onChange={handleInputChange}
                    placeholder="Enter QR token from scanned code"
                    className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Scan the QR code provided by the buyer and enter the token
                  </p>
                </div>
              )}

              {/* Photo URI (Optional) */}
              <div className="space-y-2">
                <label htmlFor="photoUri" className="block text-sm font-semibold text-[#3A71FC]">
                  Delivery Photo URL (Optional)
                </label>
                <input
                  type="url"
                  id="photoUri"
                  name="photoUri"
                  value={formData.photoUri}
                  onChange={handleInputChange}
                  placeholder="https://example.com/delivery-photo.jpg"
                  className="w-full px-4 py-3 border border-[#3A71FC]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A71FC] focus:border-transparent"
                />
                <p className="text-xs text-gray-600">
                  Optional: URL to a photo of the delivered package
                </p>
              </div>

              {/* Location Info */}
              {courierLocation.state.data && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800">📍 Courier Location (Demo)</p>
                  <p className="text-blue-700">~50m from delivery point</p>
                  <p className="text-blue-600">
                    Lat: {courierLocation.state.data.lat}, Lon: {courierLocation.state.data.lon}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={deliveryConfirm.state.loading}
                className="w-full bg-[#1C9EEF] text-white py-3 px-4 rounded-lg hover:bg-[#1C9EEF]/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {deliveryConfirm.state.loading ? 'Confirming Delivery...' : 'Confirm Delivery'}
              </button>
            </form>

            {/* Error Display */}
            {deliveryConfirm.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Delivery Confirmation Failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      {deliveryConfirm.state.error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {deliveryConfirm.state.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-green-800">🎉 Delivery Confirmed Successfully!</h3>
                    
                    <div className="mt-4 space-y-3">
                      <div className="p-4 bg-white border border-green-300 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Status:</p>
                            <p className="text-green-700 font-semibold">{deliveryConfirm.state.data.status}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Transaction Hash:</p>
                            <p className="text-xs font-mono text-gray-600 break-all">
                              {deliveryConfirm.state.data.tx_hash}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Auth Nonce:</p>
                            <p className="text-xs font-mono text-gray-600 break-all">
                              {deliveryConfirm.state.data.auth_nonce}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Expires:</p>
                            <p className="text-gray-600">
                              {new Date(deliveryConfirm.state.data.expires_at * 1000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-green-700">
                        <p>💰 The funds have been released to the merchant automatically!</p>
                        <p className="mt-1 text-green-600">
                          The blockchain transaction is processing. You can track it using the transaction hash above.
                        </p>
                      </div>

                      <button
                        onClick={resetForm}
                        className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Confirm Another Delivery
                      </button>
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