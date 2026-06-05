import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getAuthCookieOptions,
  verifyAdminPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

function sanitizeRedirect(value: unknown) {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";

  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password =
      typeof body.password === "string" ? body.password : "";

    const redirectTo = sanitizeRedirect(body.redirectTo);

    if (!verifyAdminPassword(password)) {
      return Response.json(
        {
          ok: false,
          error: "Incorrect password.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo,
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      createSessionToken(),
      getAuthCookieOptions()
    );

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Login failed.",
      },
      { status: 500 }
    );
  }
}