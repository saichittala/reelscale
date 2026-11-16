import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "../../sanity/client";
import { checkRole } from "../rbac";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name || "upload.jpg";
    const contentType = file.type || "image/jpeg";

    const asset = await writeClient.assets.upload("image", buffer, {
      filename,
      contentType,
    });

    return NextResponse.json({
      success: true,
      url: asset.url,
      assetId: asset._id,
    });
  } catch (error: any) {
    console.error("Image upload API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
