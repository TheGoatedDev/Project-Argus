import type { Metadata } from "next";
import { Chakra_Petch, Orbitron } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

const bodyFont = Chakra_Petch({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-body",
});

const displayFont = Orbitron({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800", "900"],
    variable: "--font-heading",
});

export const metadata: Metadata = {
    title: "Argus",
    description: "OSINT Aggregation Platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={cn(
                "dark font-sans",
                bodyFont.variable,
                displayFont.variable,
            )}
        >
            <body>
                <Providers>
                    <NavBar />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
