import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/providers/adapters";
import { getProvider } from "@/lib/providers/registry";
import { ProviderId, ProviderModel } from "@/lib/providers/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/models?provider=<providerId>
 *
 * Fetches available models for a provider.
 * For providers that support live model listing (like OpenRouter),
 * it will fetch from their API. Otherwise, returns static models.
 */
export async function GET(request: NextRequest) {
  try {
    const providerId = request.nextUrl.searchParams.get("provider") as ProviderId | null;
    const apiKey = request.headers.get("x-api-key");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider parameter is required" },
        { status: 400 }
      );
    }

    // Get provider config
    let providerConfig;
    try {
      providerConfig = getProvider(providerId);
    } catch {
      return NextResponse.json(
        { error: `Unknown provider: ${providerId}` },
        { status: 400 }
      );
    }

    let models: ProviderModel[] = [];
    let source: "live" | "static" = "static";

    // Try to get live models if the provider supports it
    if (providerConfig.supportsModelListing) {
      try {
        const adapter = getAdapter(providerId);
        if (adapter.supportsModelListing()) {
          models = await adapter.listModels(apiKey || "");
          source = "live";
        }
      } catch {
        // Fall back to static models on error (silently)
      }
    }

    // Fall back to static models if live fetch failed or not supported
    if (models.length === 0) {
      models = providerConfig.models;
      source = "static";
    }

    return NextResponse.json({
      models,
      source,
      provider: providerId,
      defaultModel: providerConfig.defaultModel,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
