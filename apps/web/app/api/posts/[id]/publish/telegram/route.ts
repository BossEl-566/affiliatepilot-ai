import { publishTelegramGeneratedPost } from "@/lib/publishing/publishTelegramGeneratedPost";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await publishTelegramGeneratedPost({
      postId: id,
      requestOrigin: new URL(request.url).origin,
    });

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Telegram publishing failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Telegram publishing failed.",
      },
      { status: 500 }
    );
  }
}