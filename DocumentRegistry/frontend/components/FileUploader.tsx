"use client";

/**
 * @file FileUploader.tsx
 * @description Componente para subir archivos y calcular su hash
 */

import React, { useCallback, useState } from "react";
import { ethers } from "ethers";

interface FileUploaderProps {
  onFileSelected: (hash: string, fileName: string) => void;
  disabled?: boolean;
}

export default function FileUploader({
  onFileSelected,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula el hash SHA-256 de un archivo
   */
  const calculateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // Convertir a bytes32 (32 bytes = 64 caracteres hex)
          const hashBytes32 = ethers.zeroPadValue("0x" + hashHex, 32);
          resolve(hashBytes32);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setIsProcessing(true);
      setError(null);

      try {
        const hash = await calculateFileHash(file);
        onFileSelected(hash, file.name);
      } catch (err: any) {
        const errorMessage =
          err.message || "Error processing file. Please try again.";
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isProcessing) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, isProcessing, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }
          ${disabled || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${!disabled && !isProcessing ? "hover:border-blue-400" : ""}
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled || isProcessing}
          accept="*/*"
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer ${disabled || isProcessing ? "cursor-not-allowed" : ""}`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Processing file...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Any file format supported
              </p>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

