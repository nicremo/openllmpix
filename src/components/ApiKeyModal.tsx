'use client'

import { useState, useCallback } from 'react'
import {
  getAllProviders,
  getStoredApiConfig,
  getStoredApiConfigAsync,
  saveApiConfig,
  saveApiConfigAsync,
} from '@/lib/providers/registry'
import { ProviderId, ApiKeyConfig, ProviderConfig } from '@/lib/providers/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Key, Check, Loader2, AlertCircle, Eye, EyeOff, Lock, ExternalLink, Video } from 'lucide-react'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (config: ApiKeyConfig) => void
}

// Re-export for backward compatibility
export type { ApiKeyConfig }
export type ApiProvider = ProviderId
export { getStoredApiConfig, getStoredApiConfigAsync, saveApiConfig, saveApiConfigAsync }
export function isApiKeyConfigured(): boolean {
  const config = getStoredApiConfig()
  return !!(config?.apiKey && config?.provider)
}

export default function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  // Initialize state from stored config (lazy initializer runs once on mount)
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(() => {
    if (typeof window !== 'undefined') {
      const config = getStoredApiConfig()
      return config?.provider ?? 'openrouter'
    }
    return 'openrouter'
  })
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const config = getStoredApiConfig()
      return config?.apiKey ?? ''
    }
    return ''
  })
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show all providers for open source version
  const providers = getAllProviders()

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setError(null)
    setLoading(false)
    setShowKey(false)
    onClose()
  }, [onClose])

  // Handle save (async for encrypted storage)
  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const config: ApiKeyConfig = {
        provider: selectedProvider,
        apiKey: apiKey.trim(),
      }

      // Use async encrypted save
      await saveApiConfigAsync(config)

      if (onSave) {
        onSave(config)
      }

      setTimeout(() => {
        handleClose()
      }, 300)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save API key'
      setError(errorMessage)
      setLoading(false)
    }
  }, [apiKey, selectedProvider, onSave, handleClose])

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        handleSave()
      }
    },
    [handleSave, loading]
  )

  const currentProvider = providers.find((p) => p.id === selectedProvider)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
            >
              <Key className="w-5 h-5" style={{ color: '#000' }} />
            </div>
            <div>
              <DialogTitle style={{ color: 'var(--text-primary)' }}>API Provider Setup</DialogTitle>
              <DialogDescription style={{ color: 'var(--text-tertiary)' }}>Choose your image generation provider</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="text-sm mb-3 block" style={{ color: 'var(--text-secondary)' }}>Select Provider</label>
            <div className="grid gap-2 max-h-56 overflow-y-auto pr-2">
              {providers.map((provider: ProviderConfig) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className="w-full p-3 rounded-lg text-left transition-all focus:outline-none"
                  style={{
                    background: selectedProvider === provider.id ? 'var(--bg-elevated)' : 'var(--bg-base)',
                    border: selectedProvider === provider.id ? '2px solid #f59e0b' : '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {provider.name}
                    </span>
                    {selectedProvider === provider.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#f59e0b' }}
                      >
                        <Check className="w-3 h-3" style={{ color: '#000' }} />
                      </div>
                    )}
                    {provider.supportsModelListing && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-base)', color: 'var(--success)' }}
                      >
                        Live Models
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {provider.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>API Key</label>
              {currentProvider && (
                <a
                  href={currentProvider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:opacity-80"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {currentProvider.helpText}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentProvider?.apiKeyPlaceholder || 'Enter your API key'}
                disabled={loading}
                className="w-full h-10 px-3 pr-10 rounded-lg font-mono text-sm"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading || !apiKey.trim()}
            className="w-full h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#000' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save & Continue
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-xs flex items-center justify-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <Lock className="w-3 h-3" />
            Your API key is stored securely in your browser
          </p>
          {/* Video Coming Soon - subtle hint */}
          <p className="text-xs text-center mt-2 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}>
            <Video className="w-3 h-3" />
            Video generation coming soon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
