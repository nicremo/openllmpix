"use client";

import { useEffect, useCallback } from "react";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  mode: "text-to-image" | "image-to-image";
  aspectRatio: string;
  model: string;
  modelName?: string;
  timestamp: number;
  referenceImages?: string[];
  allImages?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  provider?: string;
  generationId?: string;
  editPrompt?: string;
  onOpenInlineChatStudio?: (data: {
    imageUrl: string;
    prompt: string;
    model: string;
    modelName?: string;
    aspectRatio: string;
    generationId?: string;
  }) => void;
}

export default function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  mode,
  aspectRatio,
  model,
  modelName,
  timestamp,
  referenceImages = [],
  allImages = [],
  currentIndex = 0,
  onNavigate,
  provider,
  generationId,
  editPrompt,
  onOpenInlineChatStudio,
}: ImageLightboxProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (!isOpen || !onNavigate || allImages.length <= 1) return;

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < allImages.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyNav);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyNav);
    };
  }, [isOpen, currentIndex, allImages.length, onNavigate]);

  // Download image handler
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openllmpix-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  }, [imageUrl, timestamp]);

  // Format timestamp
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  const hasMultipleImages = allImages.length > 1;
  const canNavigateLeft = hasMultipleImages && currentIndex > 0;
  const canNavigateRight = hasMultipleImages && currentIndex < allImages.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 200ms ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Left Navigation Arrow */}
      {canNavigateLeft && onNavigate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 z-10 w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-80 transition-all hover:scale-110"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          }}
          title="Previous image (←)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Navigation Arrow */}
      {canNavigateRight && onNavigate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 z-10 w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-80 transition-all hover:scale-110"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          }}
          title="Next image (→)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Card Container */}
      <div
        className="relative rounded-2xl p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          maxWidth: "90vw",
          maxHeight: "90vh",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          animation: "scaleIn 300ms ease-out",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Header with Close and Download buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Image Details
          </h2>
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
              title="Download image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
              title="Close (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image Section */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Main Image Display */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative max-w-full">
                  <img
                    src={imageUrl}
                    alt={prompt}
                    className="max-w-full max-h-[50vh] object-contain rounded-xl"
                    style={{
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                    }}
                  />

                  {/* Model Tag */}
                  {(modelName || model) && (
                    <div
                      className="absolute bottom-4 left-4 px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {modelName || model.split('/').pop()?.replace(/-/g, ' ')}
                    </div>
                  )}

                  {/* Image Counter */}
                  {hasMultipleImages && (
                    <div
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {currentIndex + 1} / {allImages.length}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar - Info Section */}
            <div className="lg:w-96 flex-shrink-0 flex flex-col" style={{ maxHeight: "60vh" }}>
              <div className="space-y-4 overflow-y-auto flex-1">
                  {/* Prompt */}
                  <div>
                    <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      {editPrompt ? "Original Prompt" : "Prompt"}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {prompt}
                    </p>
                  </div>

                  {/* Edit Prompt (Chat Studio) */}
                  {editPrompt && (
                    <div>
                      <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#f59e0b" }}>
                        Edit Prompt
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {editPrompt}
                      </p>
                    </div>
                  )}

                  {/* Model */}
                  {model && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        Model
                      </h4>
                      <div
                        className="px-3 py-2 rounded-lg text-sm font-medium break-all"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {model}
                      </div>
                    </div>
                  )}

                  {/* Mode */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Mode
                    </h4>
                    <div
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {mode === "text-to-image" ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                          </svg>
                          Text-to-Image
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Image-to-Image
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Aspect Ratio
                    </h4>
                    <p className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                      {aspectRatio}
                    </p>
                  </div>

                  {/* Provider */}
                  {provider && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        Provider
                      </h4>
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {provider}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      Created
                    </h4>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {formatTimestamp(timestamp)}
                    </p>
                  </div>

                  {/* Reference Images */}
                  {referenceImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                        Reference Images
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {referenceImages.map((refImg, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <img
                              src={refImg}
                              alt={`Reference ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit in Chat Studio Link */}
                  {onOpenInlineChatStudio && (
                    <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <button
                        onClick={() => {
                          onOpenInlineChatStudio({
                            imageUrl: imageUrl,
                            prompt,
                            model,
                            modelName,
                            aspectRatio,
                            generationId,
                          });
                          onClose();
                        }}
                        className="text-sm hover:underline transition-all"
                        style={{ color: "#f59e0b" }}
                      >
                        Edit in Chat Studio →
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
