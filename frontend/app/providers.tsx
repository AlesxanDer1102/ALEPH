"use client"
import { config, queryClient } from "@/config"
import { AlchemyAccountProvider, AlchemyAccountsProviderProps } from "@account-kit/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { PropsWithChildren } from "react"

export const Providers = (
    props: PropsWithChildren<{
        initialState?: AlchemyAccountsProviderProps["initialState"]
    }>,
) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AlchemyAccountProvider
                config={config}
                queryClient={queryClient}
                initialState={props.initialState}
            >
                {props.children}
            </AlchemyAccountProvider>
        </QueryClientProvider>
    )
}
