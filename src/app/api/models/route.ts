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
    const staticModels = providerConfig.models;

    // Try to get live models if the provider supports it
    if (providerConfig.supportsModelListing) {
      try {
        const adapter = getAdapter(providerId);
        if (adapter.supportsModelListing()) {
          const liveModels = await adapter.listModels(apiKey || "");

          // Only use live models if we got at least as many as the static registry
          // This prevents the dashboard from showing fewer models than expected
          // when the live API filter is too restrictive
          if (liveModels.length >= staticModels.length) {
            models = liveModels;
            source = "live";
          } else {
            // Merge: Use static models as base, update with live data where available
            const liveModelIds = new Set(liveModels.map(m => m.id));
            const mergedModels = [...staticModels];

            // Add any live models that aren't in the static registry
            for (const liveModel of liveModels) {
              if (!mergedModels.some(m => m.id === liveModel.id)) {
                mergedModels.push(liveModel);
              }
            }

            models = mergedModels;
            source = liveModelIds.size > 0 ? "live" : "static";
          }
        }
      } catch {
        // Fall back to static models on error (silently)
      }
    }

    // Fall back to static models if live fetch failed or not supported
    if (models.length === 0) {
      models = staticModels;
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
