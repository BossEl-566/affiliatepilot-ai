type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export type TelegramMessage = {
  message_id: number;
  chat?: {
    id: number | string;
    title?: string;
    username?: string;
  };
};

type SendTelegramPostInput = {
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document" | "unknown";
};

type SendTelegramPostResult = {
  primaryMessage: TelegramMessage;
  followUpMessages: TelegramMessage[];
};

const TELEGRAM_TEXT_LIMIT = 4096;
const TELEGRAM_CAPTION_LIMIT = 1024;

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

  if (!response.ok || !data.ok || !data.result) {
    throw new Error(
      data.description || `Telegram request failed: ${method}`
    );
  }

  return data.result;
}

function splitTelegramText(text: string, maxLength: number) {
  const normalized = text.trim();

  if (!normalized) return [""];
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf("\n", maxLength);

    if (splitIndex < Math.floor(maxLength * 0.5)) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }

    if (splitIndex < Math.floor(maxLength * 0.5)) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

async function sendTextChunks(text: string) {
  const { channelId } = getTelegramConfiguration();

  const chunks = splitTelegramText(text, TELEGRAM_TEXT_LIMIT);
  const messages: TelegramMessage[] = [];

  for (const chunk of chunks) {
    const message = await callTelegram<TelegramMessage>("sendMessage", {
      chat_id: channelId,
      text: chunk,
    });

    messages.push(message);
  }

  return messages;
}

export async function testTelegramConnection() {
  return callTelegram("getMe", {});
}

export async function sendTelegramPost(
  input: SendTelegramPostInput
): Promise<SendTelegramPostResult> {
  const { channelId } = getTelegramConfiguration();

  const cleanText = input.text.trim();

  if (!cleanText) {
    throw new Error("Telegram post text cannot be empty.");
  }

  if (!input.mediaUrl) {
    const messages = await sendTextChunks(cleanText);

    return {
      primaryMessage: messages[0],
      followUpMessages: messages.slice(1),
    };
  }

  const caption = cleanText.slice(0, TELEGRAM_CAPTION_LIMIT);

  let primaryMessage: TelegramMessage;

  if (input.mediaType === "image") {
    primaryMessage = await callTelegram<TelegramMessage>("sendPhoto", {
      chat_id: channelId,
      photo: input.mediaUrl,
      caption,
    });
  } else if (input.mediaType === "video") {
    primaryMessage = await callTelegram<TelegramMessage>("sendVideo", {
      chat_id: channelId,
      video: input.mediaUrl,
      caption,
    });
  } else {
    primaryMessage = await callTelegram<TelegramMessage>("sendDocument", {
      chat_id: channelId,
      document: input.mediaUrl,
      caption,
    });
  }

  const followUpMessages =
    cleanText.length > TELEGRAM_CAPTION_LIMIT
      ? await sendTextChunks(cleanText.slice(TELEGRAM_CAPTION_LIMIT))
      : [];

  return {
    primaryMessage,
    followUpMessages,
  };
}