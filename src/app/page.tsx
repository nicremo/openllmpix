"use client";

import { useState, useCallback, useRef, DragEvent, useEffect } from "react";
import ApiKeyModal, {
  getStoredApiConfigAsync,
  type ApiKeyConfig
} from "@/components/ApiKeyModal";
import ModelSelector from "@/components/ModelSelector";
import ImageLightbox from "@/components/ImageLightbox";
import { getAllProviders, mapModelId } from "@/lib/providers/registry";
import { getClientAdapter } from "@/lib/providers/client-adapters";
import type { ProviderId, GenerateRequest } from "@/lib/providers/types";
import { useImageUpload } from "@/hooks/useImageUpload";
import { saveJobs, loadJobs, clearJobs, saveChatSession, loadChatSession, type ChatSession } from "@/lib/storage";

type Mode = "text-to-image" | "image-to-image";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type JobStatus = "generating" | "completed" | "error";

interface ImageSlot {
  id: string; // Unique ID for each image
  status: 'loading' | 'completed' | 'error';
  imageUrl?: string;
  error?: string;
  fromChatStudio?: boolean;
  chatPrompt?: string;
  model?: string;
  modelName?: string;
}

interface GenerationJob {
  id: string;
  status: JobStatus;
  prompt: string;
  mode: Mode;
  aspectRatio: AspectRatio;
  model: string;
  referenceImages: string[];
  results: string[];
  imageSlots: ImageSlot[];
  error?: string;
  timestamp: number;
}

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

// Chat Studio Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
  referenceImageCount?: number;
  editPrompt?: string;
}

interface ChatActiveImage {
  id: string; // Unique ID for session storage
  imageUrl: string;
  prompt: string;
  model: string;
  modelName?: string;
  aspectRatio: string;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const EXAMPLE_PROMPTS = {
  "text-to-image": [
    "A minimalist desk setup with warm lighting",
    "Futuristic cityscape at golden hour",
    "Abstract geometric patterns in muted tones",
  ],
  "image-to-image": [
    "Change the background to a sunset beach",
    "Add a vintage film grain effect",
    "Transform into Van Gogh painting style",
  ],
};

// Image-to-Image Models for Chat Studio
const IMAGE_TO_IMAGE_MODELS = [
  { id: 'nano-banana-pro', name: 'Pro', description: 'complex tasks', price: '$0.05/img' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', description: 'fast tasks', price: '$0.03/img' },
];

// Build provider display names from registry
const PROVIDER_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  getAllProviders().map(p => [p.id, p.name])
);

export default function Home() {
  const [mode, setMode] = useState<Mode>("text-to-image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedModel, setSelectedModel] = useState("");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiKeyConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    prompt: string;
    mode: Mode;
    aspectRatio: AspectRatio;
    model: string;
    timestamp: number;
    referenceImages: string[];
    allImages: string[];
    currentIndex: number;
    editPrompt?: string;
  } | null>(null);

  // Right Panel Tab
  const [rightPanelTab, setRightPanelTab] = useState<'gallery' | 'chat'>('gallery');

  // Chat Studio State
  const [chatActiveImage, setChatActiveImage] = useState<ChatActiveImage | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContextImages, setChatContextImages] = useState<string[]>([]);
  const [chatDisplayImage, setChatDisplayImage] = useState('');
  const [chatZoomImage, setChatZoomImage] = useState<string | null>(null);
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [chatSelectedModel, setChatSelectedModel] = useState(IMAGE_TO_IMAGE_MODELS[0].id);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Chat Image Upload Hook
  const chatImageUpload = useImageUpload(chatContextImages, {
    maxImages: 4,
    maxImageSize: 2048,
    onImagesAdded: (newImages) => {
      setChatContextImages(prev => [...prev, ...newImages]);
      if (!chatDisplayImage && newImages.length > 0) {
        setChatDisplayImage(newImages[0]);
      }
    },
    onError: (error) => console.error('Chat image upload error:', error)
  });

  // Check for API key on mount and show modal if not configured
  useEffect(() => {
    const loadConfig = async () => {
      const config = await getStoredApiConfigAsync();
      if (config) {
        setApiConfig(config);
      } else {
        setShowApiKeyModal(true);
      }
    };
    loadConfig();
  }, []);

  // Load generation history from IndexedDB on mount
  useEffect(() => {
    loadJobs<GenerationJob>().then(storedJobs => {
      if (storedJobs.length > 0) {
        setJobs(storedJobs);
      }
    });
  }, []);

  // Save generation history to IndexedDB when it changes
  useEffect(() => {
    const completedJobs = jobs.filter(job =>
      job.status === "completed" || job.status === "error" ||
      job.imageSlots?.some(s => s.status === "completed")
    );
    if (completedJobs.length > 0) {
      saveJobs(completedJobs);
    }
  }, [jobs]);

  // File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // Handle file upload
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith("image/"));

    for (const file of imageFiles) {
      try {
        const base64 = await fileToBase64(file);
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: base64,
          name: file.name,
        };
        setUploadedImages((prev) => [...prev, newImage]);
      } catch {
        // Silent fail - file processing error
      }
    }
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // Remove uploaded image
  const removeUploadedImage = useCallback((id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  // Handle paste
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFiles([file]);
          }
        }
      }
    },
    [handleFiles]
  );

  // Handle API Key Modal save
  const handleApiKeySave = useCallback((config: ApiKeyConfig) => {
    setApiConfig(config);
    setShowApiKeyModal(false);
  }, []);

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (!apiConfig?.apiKey?.trim()) {
      setError("API key required");
      setShowApiKeyModal(true);
      return;
    }

    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    if (mode === "image-to-image" && uploadedImages.length === 0) {
      setError("Please upload at least one reference image");
      return;
    }

    setError(null);

    // Create job immediately with all slots in loading state
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newJob: GenerationJob = {
      id: jobId,
      status: "generating",
      prompt: prompt.trim(),
      mode,
      aspectRatio,
      model: selectedModel,
      referenceImages: uploadedImages.map((img) => img.url),
      results: [],
      imageSlots: Array.from({ length: numberOfImages }, (_, i) => ({
        id: `${jobId}-img-${i}-${Date.now()}`,
        status: 'loading' as const,
      })),
      timestamp: Date.now(),
    };

    setJobs((prev) => [newJob, ...prev]);

    // Helper function to generate image
    const generateImage = async (): Promise<{ images: string[] }> => {
      const providerId = apiConfig.provider as ProviderId;
      const clientAdapter = getClientAdapter(providerId);

      const request: GenerateRequest = {
        prompt: prompt.trim(),
        aspectRatio,
        model: selectedModel,
        apiKey: apiConfig.apiKey,
        provider: providerId,
        mode,
        referenceImages: uploadedImages.map((img) => img.url),
        numberOfImages: 1,
      };

      const result = await clientAdapter.generate(request);
      return { images: result.images };
    };

    // Create parallel API requests for each image
    const imagePromises = Array.from({ length: numberOfImages }, (_, index) => {
      return generateImage()
        .then((data) => {
          // Update this specific slot with completed image (preserve ID)
          setJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    imageSlots: job.imageSlots.map((slot, i) =>
                      i === index
                        ? { ...slot, status: 'completed' as const, imageUrl: data.images[0] }
                        : slot
                    ),
                    results: [...job.results, data.images[0]],
                  }
                : job
            )
          );
          return data.images[0];
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : "An error occurred";
          // Update this specific slot with error (preserve ID)
          setJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    imageSlots: job.imageSlots.map((slot, i) =>
                      i === index
                        ? { ...slot, status: 'error' as const, error: errorMessage }
                        : slot
                    ),
                  }
                : job
            )
          );
          throw err;
        });
    });

    // Wait for all requests to settle
    Promise.allSettled(imagePromises)
      .then((results) => {
        const hasErrors = results.some((r) => r.status === 'rejected');
        const allFailed = results.every((r) => r.status === 'rejected');

        // Update job status
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: (allFailed ? "error" : "completed") as JobStatus,
                  error: allFailed ? "All images failed to generate" : undefined,
                }
              : job
          )
        );

        if (hasErrors && !allFailed) {
          setError("Some images failed to generate");
        } else if (allFailed) {
          setError("All images failed to generate");
        }
      })
      .catch((err) => {
        console.error("Unexpected error in generation:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      });
  }, [prompt, aspectRatio, selectedModel, numberOfImages, apiConfig, mode, uploadedImages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleDownload = useCallback((imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-${Date.now()}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const openLightbox = useCallback((
    imageUrl: string,
    job: GenerationJob,
    imageIndex: number
  ) => {
    setLightboxData({
      isOpen: true,
      imageUrl,
      prompt: job.prompt,
      mode: job.mode,
      aspectRatio: job.aspectRatio,
      model: job.model,
      timestamp: job.timestamp,
      referenceImages: job.referenceImages,
      allImages: job.imageSlots?.filter(s => s.status === 'completed').map(s => s.imageUrl!) || job.results,
      currentIndex: imageIndex,
    });
  }, []);

  const navigateLightbox = useCallback((newIndex: number) => {
    if (!lightboxData) return;
    const allImages = lightboxData.allImages;
    if (newIndex >= 0 && newIndex < allImages.length) {
      setLightboxData(prev => prev ? {
        ...prev,
        imageUrl: allImages[newIndex],
        currentIndex: newIndex,
      } : null);
    }
  }, [lightboxData]);

  // Open lightbox for Chat Studio images
  const openChatLightbox = useCallback((
    imageUrl: string,
    editPrompt: string,
    originalImage: ChatActiveImage | null
  ) => {
    setLightboxData({
      isOpen: true,
      imageUrl,
      prompt: originalImage?.prompt || 'Chat Studio Edit',
      mode: 'image-to-image',
      aspectRatio: (originalImage?.aspectRatio || '1:1') as AspectRatio,
      model: chatSelectedModel,
      timestamp: Date.now(),
      referenceImages: chatContextImages,
      allImages: [imageUrl],
      currentIndex: 0,
      editPrompt,
    });
  }, [chatSelectedModel, chatContextImages]);

  // ===== Chat Studio Functions =====

  // Edit image via API (client-side)
  const handleEditImage = useCallback(async (
    editPrompt: string,
    referenceImages: string[],
    modelId: string
  ): Promise<string | null> => {
    if (!apiConfig?.apiKey) return null;
    if (referenceImages.length === 0) return null;

    try {
      const providerId = (apiConfig?.provider || "openrouter") as ProviderId;
      const clientAdapter = getClientAdapter(providerId);

      const request: GenerateRequest = {
        prompt: editPrompt,
        aspectRatio: "1:1",
        model: mapModelId(modelId, providerId),
        apiKey: apiConfig.apiKey,
        provider: providerId,
        mode: "image-to-image",
        referenceImages: referenceImages,
        numberOfImages: 1,
      };

      const result = await clientAdapter.generate(request);
      return result.images[0] || null;
    } catch (error) {
      console.error("Edit image error:", error);
      return null;
    }
  }, [apiConfig]);

  // Handle chat generation
  const handleChatGenerate = useCallback(async () => {
    if (!chatInput.trim() || isChatGenerating || !chatActiveImage) return;

    if (chatContextImages.length === 0) {
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Bitte füge mindestens ein Bild zum Kontext hinzu.',
        timestamp: Date.now(),
      }]);
      return;
    }

    const userMessage = chatInput.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      referenceImageCount: chatContextImages.length,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatGenerating(true);

    try {
      const newImageUrl = await handleEditImage(userMessage, chatContextImages, chatSelectedModel);
      if (newImageUrl) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-response`,
          role: 'assistant',
          content: chatContextImages.length > 1
            ? `Bild aus ${chatContextImages.length} Referenzen erstellt:`
            : 'Hier ist dein bearbeitetes Bild:',
          imageUrl: newImageUrl,
          timestamp: Date.now(),
          editPrompt: userMessage,
        };
        setChatMessages(prev => [...prev, assistantMsg]);
        setChatDisplayImage(newImageUrl);
        // FIFO: Add new image, remove oldest if > 4
        setChatContextImages(prev => {
          if (prev.length >= 4) return [...prev.slice(1), newImageUrl];
          return [...prev, newImageUrl];
        });

        // Add to Gallery: Find original job or create new one
        const modelInfo = IMAGE_TO_IMAGE_MODELS.find(m => m.id === chatSelectedModel);
        const newSlotId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newSlot: ImageSlot = {
          id: newSlotId,
          status: 'completed',
          imageUrl: newImageUrl,
          fromChatStudio: true,
          chatPrompt: userMessage,
          model: chatSelectedModel,
          modelName: modelInfo?.name || 'Chat Studio',
        };

        setJobs(prev => {
          // Find job that contains the original image
          const originalImageUrl = chatActiveImage?.imageUrl;
          const jobIndex = prev.findIndex(job =>
            job.imageSlots.some(slot => slot.imageUrl === originalImageUrl)
          );

          if (jobIndex !== -1) {
            // Add to existing job
            const updatedJobs = [...prev];
            updatedJobs[jobIndex] = {
              ...updatedJobs[jobIndex],
              imageSlots: [...updatedJobs[jobIndex].imageSlots, newSlot],
              results: [...updatedJobs[jobIndex].results, newImageUrl],
            };
            return updatedJobs;
          } else {
            // Create new job for Chat Studio edits
            const newJob: GenerationJob = {
              id: `chat-${Date.now()}`,
              status: 'completed',
              prompt: chatActiveImage?.prompt || 'Chat Studio Edit',
              mode: 'image-to-image',
              aspectRatio: '1:1',
              model: chatSelectedModel,
              referenceImages: chatContextImages,
              results: [newImageUrl],
              imageSlots: [newSlot],
              timestamp: Date.now(),
            };
            return [newJob, ...prev];
          }
        });
      } else {
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Fehler bei der Bildgenerierung. Bitte versuche es erneut.',
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      console.error('Chat generation error:', error);
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Ein Fehler ist aufgetreten.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsChatGenerating(false);
    }
  }, [chatInput, isChatGenerating, chatActiveImage, chatContextImages, handleEditImage, chatSelectedModel, setJobs]);

  // Select image for chat editing
  const handleSelectChatImage = useCallback(async (img: ChatActiveImage) => {
    setChatActiveImage(img);

    // Try to load existing session using the unique image ID
    const existingSession = await loadChatSession(img.id);

    if (existingSession && existingSession.messages.length > 0) {
      // Restore saved session
      setChatMessages(existingSession.messages as ChatMessage[]);
      setChatContextImages(existingSession.contextImages);
      setChatDisplayImage(existingSession.displayImage || img.imageUrl);
    } else {
      // Start new session
      setChatContextImages([img.imageUrl]);
      setChatDisplayImage(img.imageUrl);
      setChatMessages([{
        id: `msg-initial-${Date.now()}`,
        role: 'assistant',
        content: `Bild geladen. Original-Prompt: "${img.prompt}"`,
        imageUrl: img.imageUrl,
        timestamp: Date.now(),
      }]);
    }
  }, []);

  // Go back from chat editing
  const handleChatBack = useCallback(() => {
    setChatActiveImage(null);
    setChatContextImages([]);
    setChatDisplayImage('');
    setChatMessages([]);
  }, []);

  // Add image to context
  const handleAddToContext = useCallback((imageUrl: string) => {
    if (chatContextImages.length >= 4) return;
    if (chatContextImages.includes(imageUrl)) return;
    setChatContextImages(prev => [...prev, imageUrl]);
  }, [chatContextImages]);

  // Remove image from context
  const handleRemoveFromContext = useCallback((imageUrl: string) => {
    setChatContextImages(prev => prev.filter(img => img !== imageUrl));
    if (chatDisplayImage === imageUrl) {
      setChatDisplayImage(chatContextImages[0] || '');
    }
  }, [chatContextImages, chatDisplayImage]);

  // Download chat image
  const handleChatDownload = useCallback((imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `chat-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-save chat session to IndexedDB
  useEffect(() => {
    if (chatActiveImage && chatMessages.length > 0) {
      const session: ChatSession = {
        imageId: chatActiveImage.id, // Use unique image ID
        messages: chatMessages,
        contextImages: chatContextImages,
        displayImage: chatDisplayImage,
        activeImage: chatActiveImage,
        timestamp: Date.now(),
      };
      saveChatSession(session);
    }
  }, [chatMessages, chatContextImages, chatDisplayImage, chatActiveImage]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)" }}
      onPaste={handlePaste}
    >
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
      />

      {/* Image Lightbox */}
      {lightboxData && (
        <ImageLightbox
          isOpen={lightboxData.isOpen}
          onClose={() => setLightboxData(null)}
          imageUrl={lightboxData.imageUrl}
          prompt={lightboxData.prompt}
          mode={lightboxData.mode}
          aspectRatio={lightboxData.aspectRatio}
          model={lightboxData.model}
          timestamp={lightboxData.timestamp}
          referenceImages={lightboxData.referenceImages}
          allImages={lightboxData.allImages}
          currentIndex={lightboxData.currentIndex}
          onNavigate={navigateLightbox}
          editPrompt={lightboxData.editPrompt}
        />
      )}

      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-6 border-b"
        style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            OPENLLMPIX
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              color: "rgb(34, 197, 94)",
              borderColor: "rgba(34, 197, 94, 0.3)"
            }}
          >
            open source
          </span>
          {apiConfig && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            >
              {PROVIDER_DISPLAY_NAMES[apiConfig.provider]}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowApiKeyModal(true)}
          className="text-xs px-3 py-1.5 rounded-md border flex items-center gap-2"
          style={{
            borderColor: "var(--border-default)",
            color: apiConfig ? "var(--success)" : "var(--text-secondary)",
            background: "transparent",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {apiConfig ? "Settings" : "Setup Required"}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <div
          className="w-[420px] h-full flex flex-col border-r flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
        >
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mode Switcher */}
            <div className="mb-6">
              <div
                className="flex p-1 rounded-lg"
                style={{ background: "var(--bg-base)" }}
              >
                <button
                  onClick={() => setMode("text-to-image")}
                  className="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: mode === "text-to-image" ? "var(--bg-elevated)" : "transparent",
                    color: mode === "text-to-image" ? "var(--text-primary)" : "var(--text-tertiary)",
                  }}
                >
                  Text to Image
                </button>
                <button
                  onClick={() => setMode("image-to-image")}
                  className="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: mode === "image-to-image" ? "var(--bg-elevated)" : "transparent",
                    color: mode === "image-to-image" ? "var(--text-primary)" : "var(--text-tertiary)",
                  }}
                >
                  Image to Image
                </button>
              </div>
            </div>

            {/* Image Upload (Image-to-Image mode) */}
            {mode === "image-to-image" && (
              <div className="mb-6">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Reference Images
                </label>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeUploadedImage(img.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.7)", color: "var(--text-primary)" }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: isDragging ? "var(--accent-secondary)" : "var(--border-default)",
                    background: isDragging ? "rgba(59, 130, 246, 0.05)" : "var(--bg-base)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Drop images here or click to upload
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Paste from clipboard also works
                  </p>
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="mb-6">
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                {mode === "image-to-image" ? "Edit Instructions" : "Prompt"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "image-to-image"
                    ? "Describe how to modify the image..."
                    : "Describe your image..."
                }
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                style={{
                  background: "var(--bg-base)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Example Prompts */}
            <div className="mb-6">
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Examples
              </label>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS[mode].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="text-left text-xs px-3 py-2 rounded-md truncate"
                    style={{ background: "var(--bg-base)", color: "var(--text-secondary)" }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            {apiConfig && (
              <div className="mb-6">
                <ModelSelector
                  provider={apiConfig.provider}
                  apiKey={apiConfig.apiKey}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  mode={mode}
                />
              </div>
            )}

            {/* Aspect Ratio */}
            {mode === "text-to-image" && (
              <div className="mb-6">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Aspect Ratio
                </label>
                <div className="flex gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className="flex-1 h-8 rounded-md text-xs font-mono"
                      style={{
                        background: aspectRatio === ar.value ? "var(--accent-primary)" : "var(--bg-base)",
                        color: aspectRatio === ar.value ? "var(--accent-foreground)" : "var(--text-secondary)",
                      }}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Number of Images */}
            <div className="mb-6">
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Images
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumberOfImages(num)}
                    className="flex-1 h-8 rounded-md text-xs font-medium"
                    style={{
                      background: numberOfImages === num ? "var(--accent-primary)" : "var(--bg-base)",
                      color: numberOfImages === num ? "var(--accent-foreground)" : "var(--text-secondary)",
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            {error && (
              <div
                className="mb-3 p-2.5 rounded-lg text-xs"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--error)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || !selectedModel || (mode === "image-to-image" && uploadedImages.length === 0)}
              className="w-full h-10 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "var(--accent-foreground)" }}
            >
              {jobs.some(job => job.status === "generating") ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>
          {/* Tab Navigation */}
          <div className="flex border-b px-4" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              onClick={() => setRightPanelTab('gallery')}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: rightPanelTab === 'gallery' ? "var(--accent-primary)" : "transparent",
                color: rightPanelTab === 'gallery' ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              Gallery
            </button>
            <button
              onClick={() => setRightPanelTab('chat')}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: rightPanelTab === 'chat' ? "var(--accent-primary)" : "transparent",
                color: rightPanelTab === 'chat' ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              Chat Studio
            </button>
          </div>

          {/* Gallery Tab */}
          {rightPanelTab === 'gallery' && (
            <div className="flex-1 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Generated images will appear here
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Your generations are saved locally
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Generations ({jobs.length})
                    </span>
                    <button
                      onClick={() => {
                        setJobs([]);
                        clearJobs();
                      }}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "var(--text-tertiary)", background: "var(--bg-surface)" }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border overflow-hidden"
                        style={{
                          borderColor: job.status === "generating" ? "var(--accent-secondary)" : "var(--border-subtle)",
                          background: "var(--bg-surface)",
                        }}
                      >
                        {/* Job Header */}
                        <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {job.status === "generating" && (
                                  <span
                                    className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-secondary)" }}
                                  >
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating
                                  </span>
                                )}
                                {job.status === "completed" && (
                                  <span
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success)" }}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Done
                                  </span>
                                )}
                                {job.status === "error" && (
                                  <span
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--error)" }}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Error
                                  </span>
                                )}
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: "var(--bg-elevated)", color: "var(--text-tertiary)" }}
                                >
                                  {job.mode === "text-to-image" ? "Text->Image" : "Image->Image"}
                                </span>
                                <span
                                  className="text-xs font-mono"
                                  style={{ color: "var(--text-tertiary)" }}
                                >
                                  {job.aspectRatio}
                                </span>
                              </div>
                              <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {job.prompt}
                              </p>
                              {job.error && (
                                <p className="text-xs mt-2" style={{ color: "var(--error)" }}>
                                  {job.error}
                                </p>
                              )}
                            </div>

                            {job.referenceImages.length > 0 && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                {job.referenceImages.slice(0, 3).map((img, i) => (
                                  <div
                                    key={i}
                                    className="w-12 h-12 rounded-lg overflow-hidden"
                                    style={{ background: "var(--bg-base)" }}
                                  >
                                    <img src={img} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {job.referenceImages.length > 3 && (
                                  <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xs"
                                    style={{ background: "var(--bg-base)", color: "var(--text-tertiary)" }}
                                  >
                                    +{job.referenceImages.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Job Results */}
                        {job.imageSlots && job.imageSlots.length > 0 && (
                          <div className="p-3">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {job.imageSlots.map((slot, index) => (
                                <div
                                  key={index}
                                  className="group relative rounded-lg overflow-hidden aspect-square"
                                  style={{ background: "var(--bg-base)" }}
                                >
                                  {slot.status === 'loading' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent-secondary)" }}>
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                          Generating...
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {slot.status === 'completed' && slot.imageUrl && (
                                    <>
                                      <img
                                        src={slot.imageUrl}
                                        alt={`Result ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      {/* Chat Studio Badge */}
                                      {slot.fromChatStudio && (
                                        <div
                                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                          style={{ background: "#f59e0b", color: "#000" }}
                                          title={slot.chatPrompt}
                                        >
                                          Chat Studio
                                        </div>
                                      )}
                                      <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                                        style={{ background: "rgba(0, 0, 0, 0.7)" }}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(slot.imageUrl!, job, index);
                                          }}
                                          className="p-2 rounded-lg"
                                          style={{ background: "var(--accent-primary)", color: "var(--accent-foreground)" }}
                                          title="View"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(slot.imageUrl!, index);
                                          }}
                                          className="p-2 rounded-lg"
                                          style={{ background: "var(--accent-primary)", color: "var(--accent-foreground)" }}
                                          title="Download"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newRef: UploadedImage = {
                                              id: `${Date.now()}-ref`,
                                              url: slot.imageUrl!,
                                              name: "Generated image",
                                            };
                                            setUploadedImages((prev) => [...prev, newRef]);
                                            setMode("image-to-image");
                                          }}
                                          className="p-2 rounded-lg border"
                                          style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                                          title="Use as reference"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectChatImage({
                                              id: slot.id,
                                              imageUrl: slot.imageUrl!,
                                              prompt: job.prompt,
                                              model: job.model,
                                              aspectRatio: job.aspectRatio,
                                            });
                                            setRightPanelTab('chat');
                                          }}
                                          className="p-2 rounded-lg"
                                          style={{ background: "#f59e0b", color: "#000" }}
                                          title="Edit in Chat Studio"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </>
                                  )}

                                  {slot.status === 'error' && (
                                    <div className="w-full h-full flex items-center justify-center p-4">
                                      <div className="flex flex-col items-center gap-2 text-center">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--error)" }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs" style={{ color: "var(--error)" }}>
                                          {slot.error || "Failed"}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp Footer */}
                        <div
                          className="px-4 py-2 text-xs"
                          style={{ color: "var(--text-tertiary)", background: "var(--bg-subtle)" }}
                        >
                          {new Date(job.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Studio Tab */}
          {rightPanelTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!chatActiveImage ? (
                /* Image Selection Grid */
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                      Select an image to edit
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Choose from your generated images or upload a new one
                    </p>
                  </div>

                  {/* Upload Drop Zone */}
                  <div
                    onDragEnter={chatImageUpload.handleDragEnter}
                    onDragLeave={chatImageUpload.handleDragLeave}
                    onDragOver={chatImageUpload.handleDragOver}
                    onDrop={chatImageUpload.handleDrop}
                    onClick={() => chatImageUpload.openFilePicker()}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-4"
                    style={{
                      borderColor: chatImageUpload.isDragging ? "#f59e0b" : "var(--border-default)",
                      background: chatImageUpload.isDragging ? "rgba(245, 158, 11, 0.05)" : "var(--bg-surface)",
                    }}
                  >
                    <input
                      ref={chatImageUpload.fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={chatImageUpload.handleFileInput}
                      className="hidden"
                    />
                    <svg
                      className="w-8 h-8 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Drop images here or click to upload
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                      Supports HEIC, TIFF, JPG, PNG, WebP
                    </p>
                  </div>

                  {/* Generated Images Grid */}
                  {jobs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {jobs.flatMap(job =>
                        job.imageSlots
                          .filter(slot => slot.status === 'completed' && slot.imageUrl)
                          .map((slot, idx) => (
                            <div
                              key={`${job.id}-${idx}`}
                              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                              onClick={() => handleSelectChatImage({
                                id: slot.id,
                                imageUrl: slot.imageUrl!,
                                prompt: job.prompt,
                                model: job.model,
                                aspectRatio: job.aspectRatio,
                              })}
                            >
                              <img
                                src={slot.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                style={{ background: "rgba(0, 0, 0, 0.6)" }}
                              >
                                <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "#f59e0b", color: "#000" }}>
                                  Edit
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Chat Interface */
                <div className="flex-1 flex overflow-hidden">
                  {/* Left: Image Preview */}
                  <div className="w-1/2 p-4 flex flex-col border-r" style={{ borderColor: "var(--border-subtle)" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={handleChatBack}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                        style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                      </button>
                      <select
                        value={chatSelectedModel}
                        onChange={(e) => setChatSelectedModel(e.target.value)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          background: "var(--bg-surface)",
                          borderColor: "var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {IMAGE_TO_IMAGE_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name} - {m.description} ({m.price})</option>
                        ))}
                      </select>
                    </div>

                    {/* Main Image */}
                    <div
                      className="flex-1 rounded-lg overflow-hidden cursor-pointer relative"
                      style={{ background: "var(--bg-surface)" }}
                      onClick={() => chatDisplayImage && setChatZoomImage(chatDisplayImage)}
                    >
                      {chatDisplayImage ? (
                        <img
                          src={chatDisplayImage}
                          alt="Current"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No image selected</p>
                        </div>
                      )}
                      {chatDisplayImage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatDownload(chatDisplayImage);
                          }}
                          className="absolute top-2 right-2 p-2 rounded-lg"
                          style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Context Images */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Context ({chatContextImages.length}/4)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {chatContextImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer group"
                            style={{
                              border: chatDisplayImage === img ? "2px solid #f59e0b" : "2px solid transparent",
                            }}
                            onClick={() => setChatDisplayImage(img)}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromContext(img);
                              }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {chatContextImages.length < 4 && (
                          <button
                            onClick={() => chatImageUpload.openFilePicker()}
                            className="w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center"
                            style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Chat */}
                  <div className="w-1/2 flex flex-col">
                    {/* Messages */}
                    <div
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[85%] rounded-lg p-3"
                            style={{
                              background: msg.role === 'user' ? "var(--accent-primary)" : "var(--bg-surface)",
                              color: msg.role === 'user' ? "var(--accent-foreground)" : "var(--text-primary)",
                            }}
                          >
                            <p className="text-sm">{msg.content}</p>
                            {msg.referenceImageCount && (
                              <p className="text-xs mt-1 opacity-70">
                                {msg.referenceImageCount} reference image{msg.referenceImageCount > 1 ? 's' : ''}
                              </p>
                            )}
                            {msg.imageUrl && (
                              <div
                                className="mt-2 rounded-lg overflow-hidden cursor-pointer relative group"
                                onClick={() => openChatLightbox(msg.imageUrl!, msg.editPrompt || msg.content, chatActiveImage)}
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt=""
                                  className="w-full max-w-[200px] rounded-lg"
                                />
                                {/* Hover overlay */}
                                <div
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none"
                                >
                                  <span className="text-white text-xs font-medium">View Details</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isChatGenerating && (
                        <div className="flex justify-start">
                          <div
                            className="rounded-lg p-3"
                            style={{ background: "var(--bg-surface)" }}
                          >
                            <div className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent-secondary)" }}>
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                                Generating...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleChatGenerate();
                            }
                          }}
                          placeholder="Describe how to edit the image..."
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={{
                            background: "var(--bg-surface)",
                            borderColor: "var(--border-default)",
                            color: "var(--text-primary)",
                          }}
                          disabled={isChatGenerating}
                        />
                        <button
                          onClick={handleChatGenerate}
                          disabled={isChatGenerating || !chatInput.trim() || chatContextImages.length === 0}
                          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                          style={{ background: "#f59e0b", color: "#000" }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zoom Modal */}
        {chatZoomImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0, 0, 0, 0.9)" }}
            onClick={() => setChatZoomImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
              onClick={() => setChatZoomImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={chatZoomImage}
              alt="Zoomed"
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
