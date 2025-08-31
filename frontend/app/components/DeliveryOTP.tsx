"use client"
import { useState } from 'react'
import { useRequestOTP, useConfirmDelivery, useCurrentLocation, useDeviceId } from '../hooks/useAPI'

export const DeliveryOTP = () => {
  const [orderId, setOrderId] = useState('')
  const [mode, setMode] = useState<'otp' | 'qr' | 'both'>('otp')
  const [otp, setOtp] = useState('')
  const [courierId, setCourierId] = useState('')
  
  // API hooks
  const otpRequest = useRequestOTP()
  const deliveryConfirm = useConfirmDelivery()
  const location = useCurrentLocation()
  const deviceId = useDeviceId()

  const handleRequestOTP = async () => {
    const gpsLocation = await location.getCurrentLocation()
    if (!gpsLocation) {
      alert('Failed to get GPS location')
      return
    }

    await otpRequest.execute({
      order_id: orderId,
      gps_buyer: gpsLocation,
      mode: mode,
      device_id: deviceId
    })
  }

  const handleConfirmDelivery = async () => {
    const gpsLocation = await location.getCurrentLocation()
    if (!gpsLocation) {
      alert('Failed to get GPS location')
      return
    }

    await deliveryConfirm.execute({
      order_id: orderId,
      otp: otp,
      courier_id: courierId,
      gps_courier: gpsLocation
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Request OTP for Delivery</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'otp' | 'qr' | 'both')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="otp">OTP Only</option>
              <option value="qr">QR Only</option>
              <option value="both">Both OTP and QR</option>
            </select>
          </div>

          <button
            onClick={handleRequestOTP}
            disabled={otpRequest.state.loading || !orderId}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {otpRequest.state.loading ? 'Requesting...' : 'Request OTP/QR'}
          </button>

          {otpRequest.state.error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {otpRequest.state.error}
            </div>
          )}

          {otpRequest.state.data && (
            <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
              <h3 className="font-bold text-green-800">OTP Generated Successfully!</h3>
              {otpRequest.state.data.otp && (
                <p className="text-green-700">OTP: <span className="font-mono text-lg">{otpRequest.state.data.otp}</span></p>
              )}
              {otpRequest.state.data.qr_payload && (
                <p className="text-green-700">QR Payload: <span className="font-mono text-sm break-all">{otpRequest.state.data.qr_payload}</span></p>
              )}
              <p className="text-green-700">Expires: {new Date(otpRequest.state.data.expires_at * 1000).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {otpRequest.state.data && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Confirm Delivery</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Courier ID</label>
              <input
                type="text"
                value={courierId}
                onChange={(e) => setCourierId(e.target.value)}
                placeholder="Enter courier ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleConfirmDelivery}
              disabled={deliveryConfirm.state.loading || !otp || !courierId}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deliveryConfirm.state.loading ? 'Confirming...' : 'Confirm Delivery'}
            </button>

            {deliveryConfirm.state.error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {deliveryConfirm.state.error}
              </div>
            )}

            {deliveryConfirm.state.data && (
              <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
                <h3 className="font-bold text-green-800">Delivery Confirmed!</h3>
                <p className="text-green-700">Status: {deliveryConfirm.state.data.status}</p>
                <p className="text-green-700">TX Hash: <span className="font-mono text-sm break-all">{deliveryConfirm.state.data.tx_hash}</span></p>
                <p className="text-green-700">Auth Nonce: <span className="font-mono text-sm break-all">{deliveryConfirm.state.data.auth_nonce}</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Device ID and Location Info */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm">
        <p><strong>Device ID:</strong> {deviceId}</p>
        {location.state.data && (
          <div>
            <p><strong>Current Location:</strong></p>
            <p>Lat: {location.state.data.lat}, Lon: {location.state.data.lon}</p>
            <p>Timestamp: {new Date(location.state.data.timestamp * 1000).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}