import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import { sourceFeaturedImage } from "../../../lib/images/image-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, category, keyword } = body;

    if (!title && !keyword) {
      return NextResponse.json(
        { success: false, message: "Title or keyword is required to search image" },
        { status: 400 }
      );
    }

    const keywords: string[] = [];
    if (title) keywords.push(title.trim());
    if (keyword && keyword !== title) keywords.push(keyword.trim());
    if (category) keywords.push(`${category.trim()} video shoot`);

    const image = await sourceFeaturedImage(keywords);

    return NextResponse.json({
      success: true,
      image,
      message: `Found random image from ${image.provider}`,
    });
  } catch (error: any) {
    console.error("AI image search error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to source image" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("title") || "video production";
    const category = searchParams.get("category");

    const keywords = [query.trim()];
    if (category) keywords.push(`${category.trim()} video shoot`);

    const image = await sourceFeaturedImage(keywords);

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to source image" },
      { status: 500 }
    );
  }
}
