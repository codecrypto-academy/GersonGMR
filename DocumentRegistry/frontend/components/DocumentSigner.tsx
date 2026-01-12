"use client";

/**
 * @file DocumentSigner.tsx
 * @description Componente para firmar documentos con alerts y confirmación del browser
 */

import React, { useState, useCallback } from "react";
import { ethers } from "ethers";
import FileUploader from "./FileUploader";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useContract } from "@/hooks/useContract";

export default function DocumentSigner() {
  const { currentWallet, isConnected, requestSignature } = useMetaMask();
  const { signDocument, checkDocumentExists, isLoading, error: contractError } = useContract();
  const [documentHash, setDocumentHash] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isSigning, setIsSigning] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleFileSelected = useCallback((hash: string, name: string) => {
    setDocumentHash(hash);
    setFileName(name);
    setAlert(null);
  }, []);

  const handleSign = useCallback(async () => {
    if (!documentHash) {
      setAlert({
        type: "error",
        message: "Please select a document first",
      });
      return;
    }

    if (!isConnected || !currentWallet) {
      setAlert({
        type: "error",
        message: "Please connect a wallet first",
      });
      return;
    }

    setIsSigning(true);
    setAlert(null);

    try {
      // El hash ya viene del FileUploader en formato hex
      // Asegurarse de que tenga el formato correcto bytes32
      let hashBytes32 = documentHash;
      if (!hashBytes32.startsWith("0x")) {
        hashBytes32 = "0x" + hashBytes32;
      }
      // Asegurar que sea exactamente 32 bytes (64 caracteres hex + 0x)
      hashBytes32 = ethers.zeroPadValue(hashBytes32, 32);

      // Validar si el documento ya fue firmado previamente
      const alreadySigned = await checkDocumentExists(hashBytes32);
      if (alreadySigned) {
        throw new Error("This document has already been signed and cannot be signed again");
      }

      // Solicitar firma con confirmación del usuario (simula MetaMask)
      // Esto mostrará un alert en el browser para confirmar
      const signature = await requestSignature(hashBytes32);

      // Registrar en blockchain
      await signDocument(hashBytes32, signature);

      setAlert({
        type: "success",
        message: `Document "${fileName}" signed successfully!`,
      });

      // Limpiar después de 3 segundos
      setTimeout(() => {
        setDocumentHash("");
        setFileName("");
        setAlert(null);
      }, 3000);
    } catch (err: any) {
      let errorMessage = "Failed to sign document";

      if (err.message) {
        errorMessage = err.message;
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // Manejar errores específicos del contrato
      if (errorMessage.includes("already been signed") || errorMessage.includes("HashAlreadySigned")) {
        errorMessage = "This document has already been signed and cannot be signed again";
      } else if (errorMessage.includes("EmptyHash")) {
        errorMessage = "Invalid document hash";
      } else if (errorMessage.includes("InvalidSignature")) {
        errorMessage = "Invalid signature. Please try again.";
      } else if (errorMessage.includes("User rejected")) {
        errorMessage = "Signature request was rejected by user";
      }

      setAlert({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSigning(false);
    }
  }, [documentHash, fileName, isConnected, currentWallet, requestSignature, signDocument, checkDocumentExists]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sign Document</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload a document to calculate its hash and sign it on the blockchain
        </p>
      </div>

      {!isConnected ? (
        <div className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please connect a wallet to upload and sign documents
          </p>
        </div>
      ) : (
        <FileUploader
          onFileSelected={handleFileSelected}
          disabled={isSigning || isLoading}
        />
      )}

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

      <button
        onClick={handleSign}
        disabled={!documentHash || !isConnected || isSigning || isLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-colors
          ${
            !documentHash || !isConnected || isSigning || isLoading
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        {isSigning || isLoading ? "Signing..." : "Sign Document"}
      </button>

      {alert && (
        <div
          className={`
          p-4 rounded-lg border
          ${
            alert.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : alert.type === "error"
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          }
        `}
        >
          <div className="flex items-center">
            {alert.type === "success" && (
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
            )}
            {alert.type === "error" && (
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
            )}
            <p
              className={`
              text-sm font-medium
              ${
                alert.type === "success"
                  ? "text-green-800 dark:text-green-200"
                  : alert.type === "error"
                  ? "text-red-800 dark:text-red-200"
                  : "text-blue-800 dark:text-blue-200"
              }
            `}
            >
              {alert.message}
            </p>
          </div>
        </div>
      )}

      {contractError && !alert && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {contractError}
          </p>
        </div>
      )}
    </div>
  );
}

