import { createColorSet, withAccountKitUi } from "@account-kit/react/tailwind"
export default withAccountKitUi(
    {
        content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
    },
    {
        colors: {
            "btn-primary": createColorSet("#3b82f6", "#1d4ed8"),
            "fg-accent-brand": createColorSet("#3b82f6", "#60a5fa"),
            active: createColorSet("#94a3b8", "#94a3b8"),
        },
    },
)