"use client"
import { useState } from "react"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { Header } from "../components/Header"
import { encodeFunctionData } from "viem"
import { ESCROW_CONTRACT_ADDRESS, scrowPayAbi } from "../constants"


// Order status enum
enum OrderStatus {
  CREATED = 0,
  RELEASED = 1,
  REFUNDED = 2
}

interface OrderInfo {
  buyer: string
  merchant: string
  amount: bigint
  timeout: bigint
  status: number
}

export default function RefundPage() {
  const { client, address } = useSmartAccountClient({})
  const [orderId, setOrderId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [isCheckingOrder, setIsCheckingOrder] = useState(false)

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

  const checkOrderInfo = async (orderIdToCheck: string) => {
    if (!client || !orderIdToCheck.match(/^0x[a-fA-F0-9]{64}$/)) {
      return null
    }

    try {
      setIsCheckingOrder(true)
      const result = await client.readContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: scrowPayAbi,
        functionName: 'orders',
        args: [orderIdToCheck as `0x${string}`]
      })

      const order = {
        buyer: (result as any)[0],
        merchant: (result as any)[1], 
        amount: BigInt((result as any)[2]),
        timeout: BigInt((result as any)[4]), // timeout is at index 4
        status: Number((result as any)[6]) // status is at index 6
      }

      setOrderInfo(order)
      return order
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Order not found or failed to fetch order details")
      setOrderInfo(null)
      return null
    } finally {
      setIsCheckingOrder(false)
    }
  }

  const validateRefundConditions = (order: OrderInfo, userAddress: string): string | null => {
    // Check if user is the buyer
    if (order.buyer.toLowerCase() !== userAddress.toLowerCase()) {
      return "You are not the buyer of this order"
    }

    // Check order status
    if (order.status !== OrderStatus.CREATED) {
      switch (order.status) {
        case OrderStatus.RELEASED:
          return "Order has already been released to merchant"
        case OrderStatus.REFUNDED:
          return "Order has already been refunded"
        default:
          return "Invalid order status"
      }
    }

    // Check if timeout has passed
    const currentTime = Math.floor(Date.now() / 1000)
    if (Number(order.timeout) > currentTime) {
      const timeRemaining = Number(order.timeout) - currentTime
      const hoursRemaining = Math.ceil(timeRemaining / 3600)
      return `Order timeout has not passed yet. ${hoursRemaining} hours remaining.`
    }

    return null
  }

  const validateForm = (): string | null => {
    if (!orderId.match(/^0x[a-fA-F0-9]{64}$/)) {
      return "Invalid order ID format (must be 32 bytes hex)"
    }
    return null
  }

  const handleOrderIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOrderId(value)
    setError("")
    setSuccess("")
    setOrderInfo(null)

    // Auto-check order if valid format
    if (value.match(/^0x[a-fA-F0-9]{64}$/)) {
      await checkOrderInfo(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!client || !address) {
      setError("Wallet not connected")
      return
    }

    // Check order info if not already loaded
    let order = orderInfo
    if (!order) {
      order = await checkOrderInfo(orderId)
      if (!order) {
        return // Error already set in checkOrderInfo
      }
    }

    // Validate refund conditions
    const conditionError = validateRefundConditions(order, address)
    if (conditionError) {
      setError(conditionError)
      return
    }

    setError("")
    setSuccess("")
    
    try {
      console.log("Processing refund for order:", orderId)

      // Encode function data
      const data = encodeFunctionData({
        abi: scrowPayAbi,
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
                <div className="relative">
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={orderId}
                    onChange={handleOrderIdChange}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg font-mono text-sm text-gray-900 font-medium focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                    required
                  />
                  {isCheckingOrder && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-[#3A71FC] border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Enter the 32-byte hex order ID for the order you want to refund
                </p>
              </div>

              {/* Order Info Display */}
              {orderInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Order Information</h3>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Buyer:</strong> {orderInfo.buyer}</p>
                    <p><strong>Merchant:</strong> {orderInfo.merchant}</p>
                    <p><strong>Amount:</strong> {(Number(orderInfo.amount) / 1000000).toFixed(2)} USDC</p>
                    <p><strong>Timeout:</strong> {new Date(Number(orderInfo.timeout) * 1000).toLocaleString()}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        orderInfo.status === OrderStatus.CREATED ? 'bg-green-100 text-green-700' :
                        orderInfo.status === OrderStatus.RELEASED ? 'bg-blue-100 text-blue-700' :
                        orderInfo.status === OrderStatus.REFUNDED ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {orderInfo.status === OrderStatus.CREATED ? 'CREATED' :
                         orderInfo.status === OrderStatus.RELEASED ? 'RELEASED' :
                         orderInfo.status === OrderStatus.REFUNDED ? 'REFUNDED' : 'UNKNOWN'}
                      </span>
                    </p>
                    {address && orderInfo.buyer.toLowerCase() === address.toLowerCase() && 
                     orderInfo.status === OrderStatus.CREATED && (
                      <div className="mt-2 p-2 bg-green-100 rounded">
                        <p className="text-green-800 font-medium">✓ You are eligible to request a refund for this order</p>
                        {Number(orderInfo.timeout) > Math.floor(Date.now() / 1000) && (
                          <p className="text-orange-700 text-xs mt-1">
                            ⚠ Timeout hasn't passed yet. You can refund after {new Date(Number(orderInfo.timeout) * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    {address && orderInfo.buyer.toLowerCase() !== address.toLowerCase() && (
                      <div className="mt-2 p-2 bg-red-100 rounded">
                        <p className="text-red-800 font-medium">✗ You are not the buyer of this order</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Refund Conditions Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">Refund Conditions</h3>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Order must exist and be in CREATED status</li>
                  <li>• Order timeout must have passed</li>
                  <li>• Order must not have been released or refunded already</li>
                  <li>• Only the buyer can request a refund</li>
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
                disabled={
                  isSendingUserOperation || 
                  !client || 
                  !address ||
                  isCheckingOrder ||
                  !orderInfo ||
                  orderInfo.buyer.toLowerCase() !== address.toLowerCase() ||
                  orderInfo.status !== OrderStatus.CREATED ||
                  Number(orderInfo.timeout) > Math.floor(Date.now() / 1000)
                }
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] hover:from-[#2861eb] hover:to-[#1689d6] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {isCheckingOrder ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Checking Order...</span>
                  </div>
                ) : isSendingUserOperation ? (
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