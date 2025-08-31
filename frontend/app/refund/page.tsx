"use client"
import { useState } from "react"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { Header } from "../components/Header"
import { encodeFunctionData } from "viem"

// Contract ABI for refund function
const REFUND_ABI = [{
  "inputs": [{
    "internalType": "bytes32",
    "name": "orderId",
    "type": "bytes32"
  }],
  "name": "refund",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}] as const

// Replace with your actual contract address
const ESCROW_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"

export default function RefundPage() {
  const { client, address } = useSmartAccountClient({})
  const [orderId, setOrderId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      console.log("Refund transaction successful:", hash)
      setSuccess(`Refund processed successfully! Transaction: ${hash}`)
      setOrderId("")
    },
    onError: (error) => {
      console.error("Refund transaction failed:", error)
      setError(error.message || "Failed to process refund")
    },
  })

  const validateForm = (): string | null => {
    if (!orderId.match(/^0x[a-fA-F0-9]{64}$/)) {
      return "Invalid order ID format (must be 32 bytes hex)"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!client) {
      setError("Wallet not connected")
      return
    }

    setError("")
    setSuccess("")
    
    try {
      console.log("Processing refund for order:", orderId)

      // Encode function data
      const data = encodeFunctionData({
        abi: REFUND_ABI,
        functionName: 'refund',
        args: [orderId as `0x${string}`]
      })

      // Send user operation
      sendUserOperation({
        uo: {
          target: ESCROW_CONTRACT_ADDRESS,
          data,
          value: BigInt(0),
        },
      })
      
    } catch (err) {
      console.error("Error processing refund:", err)
      setError(err instanceof Error ? err.message : "Failed to process refund")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Request Refund</h1>
            <p className="text-white/90 text-sm mt-1">
              Request a refund for an expired order that hasn't been released
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order ID */}
              <div className="space-y-2">
                <label htmlFor="orderId" className="block text-sm font-semibold text-[#3A71FC]">
                  Order ID
                </label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value)
                    setError("")
                    setSuccess("")
                  }}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 font-medium focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  required
                />
                <p className="text-xs text-gray-600">
                  Enter the 32-byte hex order ID for the order you want to refund
                </p>
              </div>

              {/* Refund Conditions Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Refund Conditions</h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Order must exist and be in CREATED status</li>
                  <li>• Order timeout must have passed</li>
                  <li>• Order must not have been released or refunded already</li>
                  <li>• Full amount will be returned to the buyer</li>
                </ul>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Success Display */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSendingUserOperation || !client}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] hover:from-[#2861eb] hover:to-[#1689d6] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {isSendingUserOperation ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing Refund...</span>
                  </div>
                ) : !client ? (
                  "Connect Wallet to Continue"
                ) : (
                  "Request Refund"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}