type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type SendTelegramPostInput = {
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document" | "unknown";
};

function getTelegramConfiguration() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  if (!channelId) {
    throw new Error("TELEGRAM_CHANNEL_ID is not configured.");
  }

  return {
    token,
    channelId,
  };
}

async function callTelegram<T>(
  method: string,
  payload: Record<string, unknown>
) {
  const { token } = getTelegramConfiguration();

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  const data = (await response.json()) as TelegramResponse<T>;

  if (!response.ok || !data.ok) {
    throw new Error(
      data.description || `Telegram request failed: ${method}`
    );
  }

  return data.result;
}

export async function testTelegramConnection() {
  return callTelegram("getMe", {});
}

export async function sendTelegramPost(input: SendTelegramPostInput) {
  const { channelId } = getTelegramConfiguration();

  if (input.mediaUrl && input.mediaType === "image") {
    return callTelegram("sendPhoto", {
      chat_id: channelId,
      photo: input.mediaUrl,
      caption: input.text,
    });
  }

  if (input.mediaUrl && input.mediaType === "video") {
    return callTelegram("sendVideo", {
      chat_id: channelId,
      video: input.mediaUrl,
      caption: input.text,
    });
  }

  if (input.mediaUrl && input.mediaType === "document") {
    return callTelegram("sendDocument", {
      chat_id: channelId,
      document: input.mediaUrl,
      caption: input.text,
    });
  }

  return callTelegram("sendMessage", {
    chat_id: channelId,
    text: input.text,
    disable_web_page_preview: false,
  });
}