import { testTelegramConnection } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST() {
  try {
    const bot = await testTelegramConnection();

    return Response.json({
      ok: true,
      bot,
    });
  } catch (error) {
    console.error("Telegram test failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Telegram test failed.",
      },
      { status: 500 }
    );
  }
}