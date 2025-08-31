"use client"
import React, { useState } from "react"
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

// USDC ABI for approve function
const USDC_ABI = [{
  "name": "approve",
  "inputs": [
    {"type": "address", "name": "spender"},
    {"type": "uint256", "name": "amount"}
  ],
  "outputs": [{"type": "bool"}],
  "stateMutability": "nonpayable",
  "type": "function"
}, {
  "name": "balanceOf",
  "inputs": [{"type": "address", "name": "account"}],
  "outputs": [{"type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
}, {
  "name": "allowance",
  "inputs": [
    {"type": "address", "name": "owner"},
    {"type": "address", "name": "spender"}
  ],
  "outputs": [{"type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
}] as const

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

// Contract addresses
const ESCROW_CONTRACT_ADDRESS = "0xBfb13d12798bD5Be9169Db0a986BbDCaed2700B5"
const USDC_CONTRACT_ADDRESS = "0x613cd54CF57424Db3e4D66B108d847D26E6630C0"

export default function CreateOrderPage() {
  const { client, address } = useSmartAccountClient({})
  // Initialize with current wallet address if available
  console.log( client?.account)
  const [formData, setFormData] = useState<OrderParams>({
    buyer: client?.account?.address || address || "",
    merchant: "",
    amount: "",
    timeout: "",
    orderId: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>("")

  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      console.log("Transaction successful:", hash)
      setSuccess(`Order created successfully! Transaction: ${hash}`)
      // Reset form
      setFormData({
        buyer: client?.account?.address || address || "",
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

  // Auto-fill buyer address when wallet connects and check balance
  React.useEffect(() => {
    const buyerAddress = client?.account?.address || address
    if (buyerAddress && buyerAddress !== formData.buyer) {
      setFormData(prev => ({ ...prev, buyer: buyerAddress }))
      checkUSDCBalance()
    }
  }, [client?.account?.address, address, formData.buyer])

  // Check balance when client changes
  React.useEffect(() => {
    if (client && address) {
      checkUSDCBalance()
    }
  }, [client, address])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const generateOrderId = () => {
    const timestamp = Date.now()
    const randomBytes = crypto.getRandomValues(new Uint8Array(28))
    const timestampBytes = new Uint8Array(4)
    timestampBytes[0] = (timestamp >> 24) & 0xFF
    timestampBytes[1] = (timestamp >> 16) & 0xFF
    timestampBytes[2] = (timestamp >> 8) & 0xFF
    timestampBytes[3] = timestamp & 0xFF
    
    const combined = new Uint8Array(32)
    combined.set(timestampBytes, 0)
    combined.set(randomBytes, 4)
    
    const orderId = "0x" + Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('')
    setFormData(prev => ({ ...prev, orderId }))
  }

  const checkUSDCBalance = async () => {
    if (!client || !address) return
    
    try {
      const data = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })

      const result = await client.readContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })

      const balance = (Number(result) / 1000000).toFixed(2)
      setUsdcBalance(balance)
    } catch (err) {
      console.error("Error checking USDC balance:", err)
    }
  }

  const checkUSDCAllowance = async (amount: bigint) => {
    if (!client || !address) return false
    
    try {
      const allowance = await client.readContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, ESCROW_CONTRACT_ADDRESS as `0x${string}`]
      })

      return BigInt(allowance) >= amount
    } catch (err) {
      console.error("Error checking allowance:", err)
      return false
    }
  }

  const approveUSDC = async (amount: bigint) => {
    if (!client) return false

    try {
      setIsApproving(true)
      setError("")

      const data = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [ESCROW_CONTRACT_ADDRESS as `0x${string}`, amount]
      })

      return new Promise((resolve, reject) => {
        sendUserOperation({
          uo: {
            target: USDC_CONTRACT_ADDRESS,
            data,
            value: BigInt(0),
          },
        }, {
          onSuccess: ({ hash }) => {
            console.log("USDC approval successful:", hash)
            setIsApproved(true)
            setIsApproving(false)
            resolve(true)
          },
          onError: (error) => {
            console.error("USDC approval failed:", error)
            setError(`Approval failed: ${error.message}`)
            setIsApproving(false)
            reject(error)
          }
        })
      })
    } catch (err) {
      setIsApproving(false)
      console.error("Error approving USDC:", err)
      setError(err instanceof Error ? err.message : "Failed to approve USDC")
      return false
    }
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
      // Convert amount to USDC format (6 decimals)
      const amountInUSDC = BigInt(Math.floor(parseFloat(formData.amount) * 1000000))

      // Check USDC balance
      const balance = parseFloat(usdcBalance)
      const requiredAmount = parseFloat(formData.amount)
      if (balance < requiredAmount) {
        setError(`Insufficient USDC balance. You have ${balance} USDC but need ${requiredAmount} USDC`)
        return
      }

      // Check if we need to approve USDC spending
      const hasAllowance = await checkUSDCAllowance(amountInUSDC)
      
      if (!hasAllowance && !isApproved) {
        // Need to approve first
        const approved = await approveUSDC(amountInUSDC)
        if (!approved) {
          return // Error already set in approveUSDC
        }
      }

      // Convert timeout to Unix timestamp
      const timeoutTimestamp = BigInt(Math.floor(new Date(formData.timeout).getTime() / 1000))

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
            <h1 className="text-white" style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-h2)',
              fontWeight: 'var(--weight-bold)',
              lineHeight: 'var(--leading-header)'
            }}>Create Escrow Order</h1>
            <p className="text-white/90 mt-1" style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: 'var(--text-body-md)',
              fontWeight: 'var(--weight-regular)',
              lineHeight: 'var(--leading-body)'
            }}>
              Create a new USDC escrow order with automatic release mechanism
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Buyer Address */}
              <div className="space-y-2">
                <label htmlFor="buyer" className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
                  Buyer Address
                </label>
                <input
                  type="text"
                  id="buyer"
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}
                  required
                />
                <p className="text-gray-600" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  The wallet address that will deposit USDC (auto-filled if connected)
                </p>
              </div>

              {/* Merchant Address */}
              <div className="space-y-2">
                <label htmlFor="merchant" className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
                  Merchant Address
                </label>
                <input
                  type="text"
                  id="merchant"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}
                  required
                />
                <p className="text-gray-600" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  The wallet address that will receive payment after order completion
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
                  Amount (USDC)
                  {usdcBalance && (
                    <span className="ml-2 text-gray-600" style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 'var(--weight-regular)'
                    }}>
                      Balance: {usdcBalance} USDC
                    </span>
                  )}
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
                  max={usdcBalance || undefined}
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-semibold)'
                  }}
                  required
                />
                <p className="text-gray-600" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  Amount in USDC to be escrowed (will be converted to 6 decimal format)
                  {usdcBalance && parseFloat(formData.amount) > parseFloat(usdcBalance) && (
                    <span className="block text-red-600 mt-1" style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 'var(--weight-medium)'
                    }}>
                      ⚠ Amount exceeds your balance
                    </span>
                  )}
                </p>
              </div>

              {/* Timeout */}
              <div className="space-y-2">
                <label htmlFor="timeout" className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
                  Timeout
                </label>
                <input
                  type="datetime-local"
                  id="timeout"
                  name="timeout"
                  value={formData.timeout}
                  onChange={handleInputChange}
                  min={minDateTimeString}
                  className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors"
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-semibold)'
                  }}
                  required
                />
                <p className="text-gray-600" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  After this time, the buyer can request a refund if order hasn't been released
                </p>
              </div>

              {/* Order ID */}
              <div className="space-y-2">
                <label htmlFor="orderId" className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
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
                    className="flex-1 px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-body-md)',
                      fontWeight: 'var(--weight-medium)'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={generateOrderId}
                    className="px-4 py-3 bg-[#1C9EEF] hover:bg-[#1689d6] text-white rounded-lg transition-colors whitespace-nowrap"
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-body-md)',
                      fontWeight: 'var(--weight-semibold)'
                    }}
                  >
                    Generate
                  </button>
                </div>
                <p className="text-gray-600" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  Unique identifier for this order (32 bytes hex). Use Generate for random ID.
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}>{error}</p>
                </div>
              )}

              {/* Success Display */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}>{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSendingUserOperation || isApproving || !client}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] hover:from-[#2861eb] hover:to-[#1689d6] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-button)',
                  fontWeight: 'var(--weight-semibold)'
                }}
              >
                {isApproving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-button)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>Approving USDC...</span>
                  </div>
                ) : isSendingUserOperation ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-button)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>Creating Order...</span>
                  </div>
                ) : !client ? (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>Connect Wallet to Continue</span>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>Create Escrow Order</span>
                )}
              </button>

              {/* Info about process */}
              {client && !isApproved && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-regular)'
                  }}>
                    <strong style={{ fontWeight: 'var(--weight-semibold)' }}>📋 Process:</strong> This will require two transactions:
                  </p>
                  <ol className="text-blue-700 mt-2 ml-4 list-decimal" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-regular)',
                    lineHeight: 'var(--leading-body)'
                  }}>
                    <li>Approve USDC spending (if not already approved)</li>
                    <li>Create the escrow order</li>
                  </ol>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}