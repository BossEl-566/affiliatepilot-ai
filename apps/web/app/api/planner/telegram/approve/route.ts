import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const plannerBatchId =
      typeof body.plannerBatchId === "string"
        ? body.plannerBatchId.trim()
        : "";

    if (!plannerBatchId) {
      return Response.json(
        {
          ok: false,
          error: "Planner batch ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await GeneratedPostModel.updateMany(
      {
        plannerBatchId,
        platform: "telegram",
        status: "draft",
      },
      {
        $set: {
          status: "approved",
        },
      }
    );

    return Response.json({
      ok: true,
      approved: result.modifiedCount,
    });
  } catch (error) {
    console.error("Failed to approve Telegram plan:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve Telegram plan.",
      },
      { status: 500 }
    );
  }
}