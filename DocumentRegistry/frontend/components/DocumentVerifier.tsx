"use client";

/**
 * @file DocumentVerifier.tsx
 * @description Componente para verificar documentos
 */

import React, { useState, useCallback } from "react";
import { ethers } from "ethers";
import FileUploader from "./FileUploader";
import { useContract } from "@/hooks/useContract";

export default function DocumentVerifier() {
  const { verifyDocument, isLoading, error: contractError } = useContract();
  const [documentHash, setDocumentHash] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    timestamp: bigint | null;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((hash: string, name: string) => {
    setDocumentHash(hash);
    setFileName(name);
    setVerificationResult(null);
    setError(null);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!documentHash) {
      setError("Please select a document first");
      return;
    }

    if (!signerAddress) {
      setError("Please enter the signer address");
      return;
    }

    // Validar formato de address
    if (!ethers.isAddress(signerAddress)) {
      setError("Invalid Ethereum address format");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const hashBytes32 = ethers.zeroPadValue(documentHash, 32);
      const result = await verifyDocument(hashBytes32, signerAddress);

      setVerificationResult({
        isValid: result.isValid,
        timestamp: result.timestamp,
      });
    } catch (err: any) {
      let errorMessage = "Failed to verify document";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // Manejar errores específicos
      if (errorMessage.includes("HashNotFound")) {
        errorMessage = "Document hash not found in the registry";
      }

      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }, [documentHash, signerAddress, verifyDocument]);

  const formatTimestamp = (timestamp: bigint | null): string => {
    if (!timestamp || timestamp === BigInt(0)) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Verify Document</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a document and provide the signer address to verify its
          authenticity
        </p>
      </div>

      <FileUploader
        onFileSelected={handleFileSelected}
        disabled={isVerifying || isLoading}
      />

      {documentHash && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selected File:
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {fileName}
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Document Hash:
          </p>
          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
            {documentHash}
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="signer-address"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Signer Address
        </label>
        <input
          type="text"
          id="signer-address"
          value={signerAddress}
          onChange={(e) => setSignerAddress(e.target.value)}
          placeholder="0x..."
          disabled={isVerifying || isLoading}
          className={`
            w-full px-4 py-2 rounded-lg border
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            font-mono text-sm
          `}
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={!documentHash || !signerAddress || isVerifying || isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-colors
          ${
            !documentHash || !signerAddress || isVerifying || isLoading
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }
        `}
      >
        {isVerifying || isLoading ? "Verifying..." : "Verify Document"}
      </button>

      {verificationResult && (
        <div
          className={`
          p-4 rounded-lg border
          ${
            verificationResult.isValid
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }
        `}
        >
          <div className="flex items-center mb-2">
            {verificationResult.isValid ? (
              <>
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Document Verified Successfully
                </p>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Document Not Verified
                </p>
              </>
            )}
          </div>
          {verificationResult.isValid && verificationResult.timestamp && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Signed on: {formatTimestamp(verificationResult.timestamp)}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {contractError && !error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {contractError}
          </p>
        </div>
      )}
    </div>
  );
}

