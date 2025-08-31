"use client"
import { useState } from "react"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { Header } from "../components/Header"
import { encodeFunctionData } from "viem"

interface OrderParams {
  buyer: string
  merchant: string
  amount: string
  timeout: string
  orderId: string
}

// Contract ABI for createOrder function
const ESCROW_ABI = [{
  "inputs": [{
    "components": [
      { "internalType": "address", "name": "buyer", "type": "address" },
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint64", "name": "timeout", "type": "uint64" },
      { "internalType": "bytes32", "name": "orderId", "type": "bytes32" }
    ],
    "internalType": "struct EscrowPay.OrderParams",
    "name": "p",
    "type": "tuple"
  }],
  "name": "createOrder",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}] as const

// Replace with your actual contract address
const ESCROW_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"

export default function CreateOrderPage() {
  const { client, address } = useSmartAccountClient({})
  const [formData, setFormData] = useState<OrderParams>({
    buyer: "",
    merchant: "",
    amount: "",
    timeout: "",
    orderId: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      console.log("Transaction successful:", hash)
      setSuccess(`Order created successfully! Transaction: ${hash}`)
      // Reset form
      setFormData({
        buyer: address || "",
        merchant: "",
        amount: "",
        timeout: "",
        orderId: ""
      })
    },
    onError: (error) => {
      console.error("Transaction failed:", error)
      setError(error.message || "Failed to create order")
    },
  })

  // Auto-fill buyer address when wallet connects
  useState(() => {
    if (address && !formData.buyer) {
      setFormData(prev => ({ ...prev, buyer: address }))
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const generateOrderId = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    const orderId = "0x" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
    setFormData(prev => ({ ...prev, orderId }))
  }

  const validateForm = (): string | null => {
    if (!formData.buyer.match(/^0x[a-fA-F0-9]{40}$/)) {
      return "Invalid buyer address format"
    }
    if (!formData.merchant.match(/^0x[a-fA-F0-9]{40}$/)) {
      return "Invalid merchant address format"
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return "Amount must be greater than 0"
    }
    if (!formData.timeout) {
      return "Timeout is required"
    }
    const timeoutDate = new Date(formData.timeout)
    if (timeoutDate <= new Date()) {
      return "Timeout must be in the future"
    }
    if (!formData.orderId.match(/^0x[a-fA-F0-9]{64}$/)) {
      return "Invalid order ID format"
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
      // Convert timeout to Unix timestamp
      const timeoutTimestamp = BigInt(Math.floor(new Date(formData.timeout).getTime() / 1000))

      // Convert amount to USDC format (6 decimals)
      const amountInUSDC = BigInt(Math.floor(parseFloat(formData.amount) * 1000000))

      // Prepare OrderParams struct
      const orderParams = {
        buyer: formData.buyer as `0x${string}`,
        merchant: formData.merchant as `0x${string}`,
        amount: amountInUSDC,
        timeout: timeoutTimestamp,
        orderId: formData.orderId as `0x${string}`
      }

      console.log("Creating order with params:", orderParams)

      // Encode function data
      const data = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'createOrder',
        args: [orderParams]
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
      console.error("Error creating order:", err)
      setError(err instanceof Error ? err.message : "Failed to create order")
    }
  }

  const minDateTime = new Date()
  minDateTime.setMinutes(minDateTime.getMinutes() + 5)
  const minDateTimeString = minDateTime.toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Create Escrow Order</h1>
            <p className="text-white/90 text-sm mt-1">
              Create a new USDC escrow order with automatic release mechanism
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Buyer Address */}
              <div className="space-y-2">
                <label htmlFor="buyer" className="block text-sm font-semibold text-[#3A71FC]">
                  Buyer Address
                </label>
                <input
                  type="text"
                  id="buyer"
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 font-medium focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  required
                />
                <p className="text-xs text-gray-600">
                  The wallet address that will deposit USDC (auto-filled if connected)
                </p>
              </div>

              {/* Merchant Address */}
              <div className="space-y-2">
                <label htmlFor="merchant" className="block text-sm font-semibold text-[#3A71FC]">
                  Merchant Address
                </label>
                <input
                  type="text"
                  id="merchant"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 font-medium focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  required
                />
                <p className="text-xs text-gray-600">
                  The wallet address that will receive payment after order completion
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-semibold text-[#3A71FC]">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="100.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  required
                />
                <p className="text-xs text-gray-600">
                  Amount in USDC to be escrowed (will be converted to 6 decimal format)
                </p>
              </div>

              {/* Timeout */}
              <div className="space-y-2">
                <label htmlFor="timeout" className="block text-sm font-semibold text-[#3A71FC]">
                  Timeout
                </label>
                <input
                  type="datetime-local"
                  id="timeout"
                  name="timeout"
                  value={formData.timeout}
                  onChange={handleInputChange}
                  min={minDateTimeString}
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors"
                  required
                />
                <p className="text-xs text-gray-600">
                  After this time, the buyer can request a refund if order hasn't been released
                </p>
              </div>

              {/* Order ID */}
              <div className="space-y-2">
                <label htmlFor="orderId" className="block text-sm font-semibold text-[#3A71FC]">
                  Order ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 font-medium focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateOrderId}
                    className="px-4 py-3 bg-[#1C9EEF] hover:bg-[#1689d6] text-white rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  Unique identifier for this order (32 bytes hex). Use Generate for random ID.
                </p>
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
                    <span>Creating Order...</span>
                  </div>
                ) : !client ? (
                  "Connect Wallet to Continue"
                ) : (
                  "Create Escrow Order"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}