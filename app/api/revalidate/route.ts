import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { redisInvalidatePattern } from "../../lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.SANITY_REVALIDATE_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const tag = body?.tag || searchParams.get("tag");
    const path = body?.path || searchParams.get("path") || "/";

    try {
      (revalidateTag as any)(tag || "testimonials");
      await redisInvalidatePattern("sanity:*");
    } catch {
      // ignore
    }

    revalidatePath(path, "page");
    revalidatePath("/", "layout");

    return NextResponse.json({
      revalidated: true,
      path,
      tag: tag || "testimonials",
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Error revalidating" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.SANITY_REVALIDATE_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const tag = searchParams.get("tag") || "testimonials";
    const path = searchParams.get("path") || "/";

    try {
      (revalidateTag as any)(tag);
      await redisInvalidatePattern("sanity:*");
    } catch {
      // ignore
    }

    revalidatePath(path, "page");
    revalidatePath("/", "layout");

    return NextResponse.json({
      revalidated: true,
      path,
      tag,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Error revalidating" },
      { status: 500 }
    );
  }
}
