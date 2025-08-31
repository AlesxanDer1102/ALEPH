"use client"
import { useState, useEffect } from "react"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { Header } from "../components/Header"
import { encodeFunctionData } from "viem"
import { ESCROW_CONTRACT_ADDRESS, scrowPayAbi } from "../constants"


export default function WithdrawPage() {
  const { client, address } = useSmartAccountClient({})
  const [amount, setAmount] = useState("")
  const [withdrawAll, setWithdrawAll] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [merchantBalance, setMerchantBalance] = useState<string>("")
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

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

  const checkMerchantBalance = async () => {
    if (!client || !address) return

    try {
      setIsCheckingBalance(true)
      const result = await client.readContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: scrowPayAbi,
        functionName: 'merchantBalances',
        args: [address as `0x${string}`]
      })

      const balance = (Number(result) / 1000000).toFixed(2)
      setMerchantBalance(balance)
    } catch (err) {
      console.error("Error checking merchant balance:", err)
      setError("Failed to fetch merchant balance")
    } finally {
      setIsCheckingBalance(false)
    }
  }

  useEffect(() => {
    if (client && address) {
      checkMerchantBalance()
    }
  }, [client, address])

  const validateForm = (): string | null => {
    if (!withdrawAll) {
      if (!amount || parseFloat(amount) <= 0) {
        return "Amount must be greater than 0"
      }
      const balance = parseFloat(merchantBalance)
      const requestedAmount = parseFloat(amount)
      if (requestedAmount > balance) {
        return `Insufficient balance. You have ${balance} USDC available`
      }
    }

    const balance = parseFloat(merchantBalance)
    if (balance <= 0) {
      return "No balance available to withdraw"
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
        abi: scrowPayAbi,
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
            <h1 className="text-white" style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-h2)',
              fontWeight: 'var(--weight-bold)',
              lineHeight: 'var(--leading-header)'
            }}>Withdraw Funds</h1>
            <p className="text-white/90 mt-1" style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: 'var(--text-body-md)',
              fontWeight: 'var(--weight-regular)',
              lineHeight: 'var(--leading-body)'
            }}>
              Withdraw your accumulated merchant balance from completed orders
              {merchantBalance && (
                <span className="block text-white font-medium mt-1">
                  Available: {merchantBalance} USDC
                </span>
              )}
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Withdrawal Type */}
              <div className="space-y-4">
                <label className="block text-[#3A71FC]" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-semibold)'
                }}>
                  Withdrawal Amount
                  {merchantBalance && (
                    <span className="ml-2 text-gray-600" style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: 'var(--weight-regular)'
                    }}>
                      Available: {merchantBalance} USDC
                    </span>
                  )}
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
                  <label htmlFor="withdrawAll" className="text-gray-700" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}>
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
                  <label htmlFor="withdrawPartial" className="text-gray-700" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-body-md)',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Withdraw specific amount
                  </label>
                </div>
              </div>

              {/* Amount Input (only shown for partial withdrawal) */}
              {!withdrawAll && (
                <div className="space-y-2">
                  <label htmlFor="amount" className="block text-[#3A71FC]" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-label)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>
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
                    className="w-full px-4 py-3 border-2 border-[#3A71FC]/30 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:border-[#3A71FC] focus:bg-white transition-colors placeholder:text-gray-500"
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-body-md)',
                      fontWeight: 'var(--weight-semibold)'
                    }}
                    required={!withdrawAll}
                  />
                  <p className="text-gray-600" style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 'var(--weight-regular)',
                    lineHeight: 'var(--leading-body)'
                  }}>
                    Specify the amount to withdraw (will be converted to 6 decimal format)
                    {merchantBalance && parseFloat(amount) > parseFloat(merchantBalance) && (
                      <span className="block text-red-600 font-medium mt-1">
                        ⚠ Amount exceeds your available balance
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Withdrawal Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-blue-800 mb-2" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 'var(--weight-semibold)'
                }}>Withdrawal Information</h3>
                <ul className="text-blue-700 space-y-1" style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 'var(--weight-regular)',
                  lineHeight: 'var(--leading-body)'
                }}>
                  <li>• Only merchants can withdraw their accumulated balance</li>
                  <li>• Balance comes from completed (released) orders</li>
                  <li>• Withdrawals are processed immediately</li>
                  <li>• Use amount 0 or &#34 withdraw all &#34 to claim entire balance</li>
                  <li>• Connected wallet must be the merchant address</li>
                </ul>
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
                disabled={isSendingUserOperation || !client || isCheckingBalance || parseFloat(merchantBalance) <= 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] hover:from-[#2861eb] hover:to-[#1689d6] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 'var(--text-button)',
                  fontWeight: 'var(--weight-semibold)'
                }}
              >
                {isCheckingBalance ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-button)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>Checking Balance...</span>
                  </div>
                ) : isSendingUserOperation ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: 'var(--text-button)',
                      fontWeight: 'var(--weight-semibold)'
                    }}>Processing Withdrawal...</span>
                  </div>
                ) : !client ? (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>Connect Wallet to Continue</span>
                ) : parseFloat(merchantBalance) <= 0 ? (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>No Balance Available</span>
                ) : withdrawAll ? (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>Withdraw All Balance ({merchantBalance} USDC)</span>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: 'var(--text-button)',
                    fontWeight: 'var(--weight-semibold)'
                  }}>{`Withdraw ${amount || '0'} USDC`}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}