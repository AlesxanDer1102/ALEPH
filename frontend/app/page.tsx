"use client"

import { Header } from "./components/Header"
import { useSmartAccountClient } from "@account-kit/react";

export default function Home() {


  const { client, address, isLoadingClient } = useSmartAccountClient({});

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-4 justify-center text-center">
      <Header></Header>
    </main>
  )
}
