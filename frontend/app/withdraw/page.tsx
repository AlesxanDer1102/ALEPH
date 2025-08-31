"use client"
import { useState } from "react"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { Header } from "../components/Header"
import { encodeFunctionData } from "viem"

// Contract ABI for withdraw function
const WITHDRAW_ABI = [{
  "inputs": [{
    "internalType": "uint256",
    "name": "amount",
    "type": "uint256"
  }],
  "name": "withdraw",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}] as const

// Replace with your actual contract address
const ESCROW_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"

export default function WithdrawPage() {
  const { client, address } = useSmartAccountClient({})
  const [amount, setAmount] = useState("")
  const [withdrawAll, setWithdrawAll] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      console.log("Withdraw transaction successful:", hash)
      setSuccess(`Withdrawal processed successfully! Transaction: ${hash}`)
      setAmount("")
      setWithdrawAll(true)
    },
    onError: (error) => {
      console.error("Withdraw transaction failed:", error)
      setError(error.message || "Failed to process withdrawal")
    },
  })

  const validateForm = (): string | null => {
    if (!withdrawAll) {
      if (!amount || parseFloat(amount) <= 0) {
        return "Amount must be greater than 0"
      }
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
      // Convert amount to USDC format (6 decimals), or 0 for withdraw all
      const amountInUSDC = withdrawAll ? BigInt(0) : BigInt(Math.floor(parseFloat(amount) * 1000000))

      console.log("Processing withdrawal:", {
        amount: amountInUSDC.toString(),
        withdrawAll,
        merchant: address
      })

      // Encode function data
      const data = encodeFunctionData({
        abi: WITHDRAW_ABI,
        functionName: 'withdraw',
        args: [amountInUSDC]
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
      console.error("Error processing withdrawal:", err)
      setError(err instanceof Error ? err.message : "Failed to process withdrawal")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
            <p className="text-white/90 text-sm mt-1">
              Withdraw your accumulated merchant balance from completed orders
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Withdrawal Type */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[#3A71FC]">
                  Withdrawal Amount
                </label>
                
                {/* Withdraw All Option */}
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="withdrawAll"
                    name="withdrawType"
                    checked={withdrawAll}
                    onChange={() => {
                      setWithdrawAll(true)
                      setAmount("")
                      setError("")
                      setSuccess("")
                    }}
                    className="w-4 h-4 text-[#3A71FC] border-2 border-[#3A71FC]/30 focus:ring-[#3A71FC] focus:ring-2"
                  />
                  <label htmlFor="withdrawAll" className="text-sm font-medium text-gray-700">
                    Withdraw all available balance
                  </label>
                </div>

                {/* Partial Withdrawal Option */}
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="withdrawPartial"
                    name="withdrawType"
                    checked={!withdrawAll}
                    onChange={() => {
                      setWithdrawAll(false)
                      setError("")
                      setSuccess("")
                    }}
                    className="w-4 h-4 text-[#3A71FC] border-2 border-[#3A71FC]/30 focus:ring-[#3A71FC] focus:ring-2"
                  />
                  <label htmlFor="withdrawPartial" className="text-sm font-medium text-gray-700">
                    Withdraw specific amount
                  </label>
                </div>
              </div>

              {/* Amount Input (only shown for partial withdrawal) */}
              {!withdrawAll && (
                <div className="space-y-2">
                  <label htmlFor="amount" className="block text-sm font-semibold text-[#3A71FC]">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setError("")
                      setSuccess("")
                    }}
                    placeholder="100.00"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                    required={!withdrawAll}
                  />
                  <p className="text-xs text-gray-600">
                    Specify the amount to withdraw (will be converted to 6 decimal format)
                  </p>
                </div>
              )}

              {/* Withdrawal Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Withdrawal Information</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Only merchants can withdraw their accumulated balance</li>
                  <li>• Balance comes from completed (released) orders</li>
                  <li>• Withdrawals are processed immediately</li>
                  <li>• Use amount 0 or "withdraw all" to claim entire balance</li>
                  <li>• Connected wallet must be the merchant address</li>
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
                    <span>Processing Withdrawal...</span>
                  </div>
                ) : !client ? (
                  "Connect Wallet to Continue"
                ) : withdrawAll ? (
                  "Withdraw All Balance"
                ) : (
                  `Withdraw ${amount || '0'} USDC`
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}