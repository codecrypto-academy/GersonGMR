import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/contexts/Web3Context";

export const metadata: Metadata = {
  title: "DAO Voting - Gasless Voting Platform",
  description: "Decentralized Autonomous Organization with gasless voting using meta-transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
