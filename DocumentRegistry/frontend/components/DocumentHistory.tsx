"use client";

/**
 * @file DocumentHistory.tsx
 * @description Componente para mostrar el historial de firmas
 */

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useContract } from "@/hooks/useContract";

interface SignatureInfo {
  hash: string;
  timestamp: bigint;
  signature: string;
  signer: string;
}

export default function DocumentHistory() {
  const { currentWallet, isConnected } = useMetaMask();
  const { getSignerHistory, getDocument, isLoading } = useContract();
  const [signatures, setSignatures] = useState<SignatureInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadHistory = useCallback(async () => {
    // No limpiar el historial si aún no se ha inicializado (evita limpiar durante la restauración)
    if (!isConnected || !currentWallet) {
      // Solo limpiar si ya se había inicializado previamente (usuario desconectó)
      if (hasInitialized) {
        setSignatures([]);
      }
      return;
    }

    setIsLoadingHistory(true);
    setError(null);

    try {
      // Obtener todos los hashes firmados por el wallet actual
      const hashes = await getSignerHistory(currentWallet.address);

      // Obtener información detallada de cada documento
      const documentPromises = hashes.map(async (hash) => {
        try {
          const doc = await getDocument(hash);
          return {
            hash: doc.hash,
            timestamp: doc.timestamp,
            signature: doc.signature,
            signer: doc.signer,
          };
        } catch (err) {
          // Si hay error al obtener un documento, continuar con los demás
          console.error(`Error loading document for hash ${hash}:`, err);
          return null;
        }
      });

      const results = await Promise.all(documentPromises);
      const validSignatures = results.filter(
        (sig): sig is SignatureInfo => sig !== null
      );

      // Ordenar por timestamp (más reciente primero)
      validSignatures.sort((a, b) => {
        if (a.timestamp > b.timestamp) return -1;
        if (a.timestamp < b.timestamp) return 1;
        return 0;
      });

      setSignatures(validSignatures);
      setHasInitialized(true); // Marcar como inicializado después de cargar exitosamente
    } catch (err: any) {
      let errorMessage = "Failed to load signature history";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      setError(errorMessage);
      // Solo limpiar si ya estaba inicializado
      if (hasInitialized) {
        setSignatures([]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isConnected, currentWallet, getSignerHistory, getDocument, hasInitialized]);

  useEffect(() => {
    // Esperar a que la wallet se restaure desde localStorage antes de cargar
    // Verificar si hay una wallet guardada en localStorage
    const savedWalletIndex = localStorage.getItem("connectedWalletIndex");
    const isRestoring = savedWalletIndex !== null && !isConnected;
    
    // Solo cargar si:
    // 1. Hay wallet conectada Y
    // 2. No se está restaurando (ya se restauró o nunca hubo una guardada) Y
    // 3. No se ha inicializado aún
    if (isConnected && currentWallet && !isRestoring && !hasInitialized) {
      loadHistory();
    }
  }, [isConnected, currentWallet, hasInitialized, loadHistory]);

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  if (!isConnected || !currentWallet) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Document History</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View all documents you have signed
          </p>
        </div>
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Please connect a wallet to view your signature history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Document History</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View all documents you have signed
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={isLoadingHistory || isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              isLoadingHistory || isLoading
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          `}
        >
          {isLoadingHistory ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoadingHistory ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : signatures.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No signed documents found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signatures.map((sig, index) => (
            <div
              key={`${sig.hash}-${index}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Hash (Complete)
                  </p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                    {sig.hash}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatTimestamp(sig.timestamp)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                    Signer Address
                  </p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {sig.signer}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">
                    Signature
                  </p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {sig.signature}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

