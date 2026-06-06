import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { MediaAssetModel } from "@/models/MediaAsset";
import { sendTelegramPost } from "@/lib/telegram";

type PublishTelegramGeneratedPostInput = {
  postId: string;
  requestOrigin: string;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeHashtag(tag: string) {
  const cleanTag = tag.trim().replace(/^#/, "");

  return cleanTag ? `#${cleanTag}` : "";
}

function isValidPublicHttpUrl(value?: string) {
  if (!value?.trim()) return false;

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function getPublicOrigin(requestOrigin: string) {
  const configuredOrigin = process.env.APP_BASE_URL?.trim();

  return new URL(configuredOrigin || requestOrigin).origin;
}

function buildTelegramPostText(input: {
  title?: string;
  hook?: string;
  caption?: string;
  callToAction?: string;
  hashtags?: string[];
  trackingLink: string;
}) {
  const sections: string[] = [];

  if (input.title?.trim()) {
    sections.push(input.title.trim());
  }

  if (input.hook?.trim()) {
    sections.push(input.hook.trim());
  }

  if (input.caption?.trim()) {
    sections.push(input.caption.trim());
  }

  if (input.callToAction?.trim()) {
    sections.push(`👉 ${input.callToAction.trim()}`);
  }

  sections.push(`🔗 ${input.trackingLink}`);

  const hashtags = (input.hashtags || [])
    .map(normalizeHashtag)
    .filter(Boolean)
    .join(" ");

  if (hashtags) {
    sections.push(hashtags);
  }

  return sections.join("\n\n");
}

export async function publishTelegramGeneratedPost(
  input: PublishTelegramGeneratedPostInput
) {
  await connectToDatabase();

  if (!isValidObjectId(input.postId)) {
    throw new Error("Invalid post ID.");
  }

  const lockToken = randomUUID();
  const now = new Date();
  const staleLockThreshold = new Date(Date.now() - 5 * 60 * 1000);

  const post = await GeneratedPostModel.findOneAndUpdate(
    {
      _id: input.postId,
      platform: "telegram",
      status: {
        $in: ["approved", "scheduled"],
      },
      telegramPublishedAt: null,
      $or: [
        {
          telegramPublishingLock: {
            $exists: false,
          },
        },
        {
          telegramPublishingLock: "",
        },
        {
          telegramPublishingLock: null,
        },
        {
          telegramPublishingStartedAt: {
            $lt: staleLockThreshold,
          },
        },
      ],
    },
    {
      $set: {
        telegramPublishingLock: lockToken,
        telegramPublishingStartedAt: now,
        telegramError: "",
      },
    },
    {
      new: true,
    }
  ).lean();

  if (!post) {
    throw new Error(
      "This post is already published, currently publishing, or not approved."
    );
  }

  try {
    const product = await AffiliateProductModel.findById(
      post.affiliateProductId
    ).lean();

    if (!product) {
      throw new Error("Attached affiliate product not found.");
    }

    if (!product.trackingCode) {
      throw new Error("The attached product does not have a tracking code.");
    }

    const mediaAsset =
      post.mediaAssetId && isValidObjectId(String(post.mediaAssetId))
        ? await MediaAssetModel.findById(post.mediaAssetId).lean()
        : null;

    if (mediaAsset?.fileUrl && !isValidPublicHttpUrl(mediaAsset.fileUrl)) {
      throw new Error(
        "The attached media URL is invalid. Re-upload the file through Media Library and attach the Cloudinary asset."
      );
    }

    const origin = getPublicOrigin(input.requestOrigin);

    const query = new URLSearchParams({
      postId: String(post._id),
      platform: "telegram",
    });

    const trackingLink = `${origin}/r/${
      product.trackingCode
    }?${query.toString()}`;

    const text = buildTelegramPostText({
      title: post.title,
      hook: post.hook,
      caption: post.caption,
      callToAction: post.callToAction,
      hashtags: post.hashtags,
      trackingLink,
    });

    const telegramResult = await sendTelegramPost({
      text,
      mediaUrl: mediaAsset?.fileUrl,
      mediaType: mediaAsset?.mediaType,
    });

    const publishedAt = new Date();

    const updatedPost = await GeneratedPostModel.findOneAndUpdate(
      {
        _id: post._id,
        telegramPublishingLock: lockToken,
      },
      {
        $set: {
          status: "published",
          publishedAt,
          telegramMessageId:
            telegramResult.primaryMessage.message_id,
          telegramChatId: String(
            telegramResult.primaryMessage.chat?.id || ""
          ),
          telegramPublishedAt: publishedAt,
          telegramError: "",
        },
        $unset: {
          telegramPublishingLock: "",
          telegramPublishingStartedAt: "",
        },
      },
      {
        new: true,
      }
    );

    if (!updatedPost) {
      throw new Error("Published post could not be saved.");
    }

    return {
      post: updatedPost,
      telegram: telegramResult,
      trackingLink,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Telegram publishing failed.";

    await GeneratedPostModel.findOneAndUpdate(
      {
        _id: post._id,
        telegramPublishingLock: lockToken,
      },
      {
        $set: {
          status: "failed",
          telegramError: message,
        },
        $unset: {
          telegramPublishingLock: "",
          telegramPublishingStartedAt: "",
        },
      }
    );

    throw error;
  }
}