"use client"
import { useSmartAccountClient, useSendUserOperation } from "@account-kit/react"
import { useState, useEffect } from "react"
import { encodeFunctionData } from "viem"

interface OrderEvent {
  orderId: string
  txHash: string
  blockNumber: number
  merchant?: string
  buyer?: string
  amount?: string
  fee?: string
  network?: string
  createdAt?: string
  rindexerId?: string
}

interface OrderData {
  created?: OrderEvent
  released?: OrderEvent
  refunded?: OrderEvent
  expired?: OrderEvent
}

export const Dashboard = () => {
  const { client, address, isLoadingClient } = useSmartAccountClient({})
  const [orders, setOrders] = useState<Record<string, OrderData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderEvents = async () => {
    if (!client?.account.address) return

    setLoading(true)
    setError(null)

    const query = `
      query allOrderEvents {
        allOrderReleaseds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
          nodes {
            merchant
            orderId
            txHash
            blockNumber
          }
        }
        allOrderCreateds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
          nodes {
            txHash
            rindexerId
            orderId
            network
            merchant
            fee
            createdAt
            buyer
            amount
          }
        }
        allOrderRefundeds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
          nodes {
            orderId
            network
            buyer
            amount
            blockNumber
          }
        }
        allOrderExpireds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
          nodes {
            orderId
            network
            blockNumber
            txHash
          }
        }
      }
    `

    try {
      const response = await fetch("/api/graphql", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      console.log("data", result)

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      const orderMap: Record<string, OrderData> = {}

      console.log("Current user address:", client?.account.address)
      console.log("Order Created events:", result.data.allOrderCreateds.nodes)

      result.data.allOrderCreateds.nodes.forEach((event: OrderEvent) => {
        console.log("Checking order:", event.orderId, "buyer:", event.buyer, "merchant:", event.merchant)
        const userAddress = client?.account.address?.toLowerCase()
        const buyerAddress = event.buyer?.toLowerCase()
        const merchantAddress = event.merchant?.toLowerCase()
        
        if (buyerAddress === userAddress || merchantAddress === userAddress) {
          console.log("Order matches user:", event.orderId)
          if (!orderMap[event.orderId]) {
            orderMap[event.orderId] = {}
          }
          orderMap[event.orderId].created = event
        }
      })

      result.data.allOrderReleaseds.nodes.forEach((event: OrderEvent) => {
        if (orderMap[event.orderId]) {
          orderMap[event.orderId].released = event
        }
      })

      result.data.allOrderRefundeds.nodes.forEach((event: OrderEvent) => {
        if (orderMap[event.orderId]) {
          orderMap[event.orderId].refunded = event
        }
      })

      result.data.allOrderExpireds.nodes.forEach((event: OrderEvent) => {
        if (orderMap[event.orderId]) {
          orderMap[event.orderId].expired = event
        }
      })

      console.log("Final orderMap:", orderMap)
      setOrders(orderMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (client?.account.address && !isLoadingClient) {
      fetchOrderEvents()
    }
  }, [client?.account.address, isLoadingClient])

  const getOrderStatus = (order: OrderData) => {
    if (order.released) return { status: 'Released', color: 'green' }
    if (order.refunded) return { status: 'Refunded', color: 'yellow' }
    if (order.expired) return { status: 'Expired', color: 'red' }
    if (order.created) return { status: 'Created', color: 'blue' }
    return { status: 'Unknown', color: 'gray' }
  }

  const getUserRole = (order: OrderData, userAddress: string) => {
    const userAddr = userAddress?.toLowerCase()
    const buyerAddr = order.created?.buyer?.toLowerCase()
    const merchantAddr = order.created?.merchant?.toLowerCase()
    
    if (buyerAddr === userAddr) return 'Buyer'
    if (merchantAddr === userAddr) return 'Merchant'
    return 'Unknown'
  }

  const filteredOrders = Object.entries(orders).filter(([_, order]) => {
    const userAddress = client?.account.address?.toLowerCase()
    const buyerAddress = order.created?.buyer?.toLowerCase()
    const merchantAddress = order.created?.merchant?.toLowerCase()
    const matches = order.created && (buyerAddress === userAddress || merchantAddress === userAddress)
    console.log("Filtering order:", order, "matches:", matches)
    return matches
  })
  
  console.log("Filtered orders:", filteredOrders)

  const { sendUserOperation: sendFaucetOperation, isSendingUserOperation: isSendingFaucet } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      console.log("Faucet transaction successful:", hash)
      setError(null)
    },
    onError: (error) => {
      console.error("Faucet transaction failed:", error)
      setError(error.message || "Failed to mint USDC tokens")
    },
  })

  const handleFaucetMint = async () => {
    if (!client) return

    const USDC_CONTRACT = '0x613cd54CF57424Db3e4D66B108d847D26E6630C0'
    
    const data = encodeFunctionData({
      abi: [
        {
          name: 'faucet',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }
      ],
      functionName: 'faucet',
      args: []
    })
    
    console.log('Faucet data:', data)
    
    sendFaucetOperation({
      uo: {
        target: USDC_CONTRACT,
        data: data,
      }
    })
  }

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

            {/* USDC Mock Faucet */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#1C9EEF]/20 shadow-lg lg:col-span-2 xl:col-span-3">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1C9EEF]">USDC Mock Faucet</h3>
              </div>
              <div className="bg-white rounded-lg border border-[#1C9EEF]/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Get test USDC tokens for Sepolia testing
                    </p>
                    <p className="text-xs text-gray-500 font-mono break-all">
                      Contract: 0x613cd54CF57424Db3e4D66B108d847D26E6630C0
                    </p>
                  </div>
                  <button
                    onClick={handleFaucetMint}
                    disabled={isSendingFaucet || !client}
                    className="px-4 py-2 bg-[#3A71FC] text-white rounded-lg hover:bg-[#3A71FC]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSendingFaucet ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Minting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Get USDC</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-xl p-6 border-2 border-[#1C9EEF]/20 shadow-lg lg:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#3A71FC] to-[#1C9EEF] rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1C9EEF]">My Orders</h3>
                </div>
                <button
                  onClick={fetchOrderEvents}
                  disabled={loading}
                  className="px-3 py-1 bg-[#3A71FC] text-white text-sm rounded-lg hover:bg-[#3A71FC]/80 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="bg-white rounded-lg border border-[#1C9EEF]/30 p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredOrders.map(([orderId, order]) => {
                    const status = getOrderStatus(order)
                    const role = getUserRole(order, client?.account.address!)
                    const statusColors = {
                      green: 'bg-green-100 text-green-800 border-green-200',
                      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      red: 'bg-red-100 text-red-800 border-red-200',
                      blue: 'bg-blue-100 text-blue-800 border-blue-200',
                      gray: 'bg-gray-100 text-gray-800 border-gray-200'
                    }

                    return (
                      <div key={orderId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-mono text-sm font-semibold text-gray-700">#{orderId}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status.color as keyof typeof statusColors]}`}>
                                {status.status}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#3A71FC]/10 text-[#3A71FC] border border-[#3A71FC]/20">
                                {role}
                              </span>
                            </div>

                            {order.created && (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Amount:</span>
                                  <span className="ml-2 text-gray-900">{order.created.amount}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Network:</span>
                                  <span className="ml-2 text-gray-900">{order.created.network}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Fee:</span>
                                  <span className="ml-2 text-gray-900">{order.created.fee}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Created:</span>
                                  <span className="ml-2 text-gray-900">
                                    {order.created.createdAt ? new Date(parseInt(order.created.createdAt) * 1000).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="mt-2 text-xs text-gray-500">
                              <span className="font-medium">TX:</span>
                              {(order.released?.txHash || order.created?.txHash) ? (
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${order.released?.txHash || order.created?.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 font-mono break-all text-blue-600 hover:text-blue-800 underline"
                                >
                                  {order.released?.txHash || order.created?.txHash}
                                </a>
                              ) : (
                                <span className="ml-1 font-mono break-all">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-[#1C9EEF]/30 p-8 text-center">
                  <div className="w-16 h-16 bg-[#1C9EEF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#1C9EEF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No orders found</p>
                  <p className="text-gray-500 text-sm mt-1">Orders where you are the buyer or merchant will appear here</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}