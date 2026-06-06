import { sendTelegramPost } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await sendTelegramPost({
      text: [
        "✅ AffiliatePilot AI Telegram connection successful.",
        "",
        "Your publishing system can now send approved content to this channel.",
      ].join("\n"),
    });

    return Response.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Telegram channel test failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Telegram channel test failed.",
      },
      { status: 500 }
    );
  }
}