// @noErrors
import { createConfig, cookieStorage, configForExternalWallets } from "@account-kit/react"
import { QueryClient } from "@tanstack/react-query"
import { arbitrumSepolia, alchemy, sepolia } from "@account-kit/infra"
import { env } from "process"


export const externalWalletsConfig = configForExternalWallets({
    wallets: ["wallet_connect", "metamask"],
    chainType: ["evm"],
    walletConnectProjectId: env.NEXT_PUBLIC_PROJECT_ID || "",
})

export const config = createConfig(
    {
        transport: alchemy({
            // Replace with your API key
            apiKey: env.NEXT_PUBLIC_ALCHEMY_AA_API_KEY || "",
        }),
        chain: sepolia,
        ssr: true,
        storage: cookieStorage,
        enablePopupOauth: true,
        // For gas sponsorship (optional)
        // Learn more here: https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/sponsor-gas-evm
        policyId: env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || "",
    },
    {
        auth: {
            sections: [
                [{ type: "email" }],
                [
                    { type: "passkey" },
                    { type: "social", authProviderId: "google", mode: "popup" },
                ],
                [{ type: "external_wallets", ...externalWalletsConfig.uiConfig }],
            ],

            addPasskeyOnSignup: true,
        },
    },
)

export const queryClient = new QueryClient()