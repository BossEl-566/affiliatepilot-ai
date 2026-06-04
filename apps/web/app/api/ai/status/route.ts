import { getAiRuntimeStatus } from "@/lib/ai/affiliateAi";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    ai: getAiRuntimeStatus(),
  });
}