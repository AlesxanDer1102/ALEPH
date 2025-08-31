// @noErrors
import { createConfig, cookieStorage, configForExternalWallets } from "@account-kit/react"
import { QueryClient } from "@tanstack/react-query"
import { alchemy, sepolia } from "@account-kit/infra"
// Safe environment variable loading with fallbacks
const getEnvVar = (key: string, fallback: string = ""): string => {
    if (typeof window !== "undefined") {
        // Client-side: use process.env with NEXT_PUBLIC_ prefix
        return (process.env as any)[`NEXT_PUBLIC_${key}`] || fallback
    }
    // Server-side: use process.env directly
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || fallback
}

export const externalWalletsConfig = configForExternalWallets({
    wallets: ["wallet_connect", "metamask"],
    chainType: ["evm"],
    walletConnectProjectId: getEnvVar("WALLETCONNECT_PROJECT_ID", "4ef621c5cc218c4e769d39a1b2f14b8a"),
})

export const config = createConfig(
    {
        transport: alchemy({
            apiKey: getEnvVar("ALCHEMY_API_KEY", "s68ftd4vS3JDby3xS71_M4sU-KtxRLWJ"),
        }),
        chain: sepolia,
        ssr: false,
        storage: cookieStorage,
        enablePopupOauth: true,
        // For gas sponsorship (optional)
        policyId: getEnvVar("ALCHEMY_POLICY_ID", "4a2d2b13-03a3-4e35-b9de-a1375b3e31fe"),
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