"use client"

import { Header } from "./components/Header"
import { Dashboard } from "./components/Dashboard"
import { useSmartAccountClient } from "@account-kit/react"

export default function Home() {


  const { client, address, isLoadingClient } = useSmartAccountClient({})

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="bg-white">
        <Dashboard />
      </main>
    </div>
  )
}
