// @noErrors
import { createConfig, cookieStorage, configForExternalWallets } from "@account-kit/react"
import { QueryClient } from "@tanstack/react-query"
import { alchemy, sepolia } from "@account-kit/infra"

export const externalWalletsConfig = configForExternalWallets({
    wallets: ["wallet_connect", "metamask"],
    chainType: ["evm"],
    walletConnectProjectId: "4ef621c5cc218c4e769d39a1b2f14b8a",
})

export const config = createConfig(
    {
        transport: alchemy({
            apiKey: "s68ftd4vS3JDby3xS71_M4sU-KtxRLWJ",
        }),
        chain: sepolia,
        ssr: false,
        storage: cookieStorage,
        enablePopupOauth: true,
        // For gas sponsorship (optional)
        policyId: "4a2d2b13-03a3-4e35-b9de-a1375b3e31fe",
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