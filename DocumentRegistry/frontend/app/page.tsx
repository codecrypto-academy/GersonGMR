"use client";

/**
 * @file page.tsx
 * @description Página principal con tabs para Sign, Verify y History
 */

import React, { useState } from "react";
import DocumentSigner from "@/components/DocumentSigner";
import DocumentVerifier from "@/components/DocumentVerifier";
import DocumentHistory from "@/components/DocumentHistory";
import WalletSelector from "@/components/WalletSelector";

type Tab = "sign" | "verify" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("sign");

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "sign", label: "Sign Document", icon: "✍️" },
    { id: "verify", label: "Verify Document", icon: "✓" },
    { id: "history", label: "History", icon: "📜" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Document Registry
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Blockchain-based document signing and verification
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con Wallet Selector */}
          <div className="lg:col-span-1">
            <WalletSelector />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-lg overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-6 py-4 text-sm font-medium transition-colors
                      ${
                        activeTab === tab.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg p-6">
              {activeTab === "sign" && <DocumentSigner />}
              {activeTab === "verify" && <DocumentVerifier />}
              {activeTab === "history" && <DocumentHistory />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
