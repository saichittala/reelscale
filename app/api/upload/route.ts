import { NextRequest, NextResponse } from "next/server";
import { writeClient } from "../../sanity/client";
import { checkRole } from "../rbac";
import { extractSanityAssetId } from "../../sanity/blog-sync";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const contentTypeHeader = request.headers.get("content-type") || "";

    // Support JSON body with imageUrl (e.g. for remote Unsplash/Pexels URLs)
    if (contentTypeHeader.includes("application/json")) {
      const body = await request.json();
      const imageUrl = (body.imageUrl || "").trim();
      const filename = body.filename || "featured-image.jpg";

      if (!imageUrl) {
        return NextResponse.json({ success: false, message: "No imageUrl provided" }, { status: 400 });
      }

      // If already a Sanity CDN URL
      const existingAssetId = extractSanityAssetId(imageUrl);
      if (existingAssetId) {
        return NextResponse.json({ success: true, url: imageUrl, assetId: existingAssetId });
      }

      // Download remote image on server (Node.js has no CORS restrictions)
      const res = await fetch(imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch remote image: ${res.statusText}`);
      }
      const mime = res.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const asset = await writeClient.assets.upload("image", buffer, {
        filename,
        contentType: mime,
      });

      return NextResponse.json({
        success: true,
        url: asset.url,
        assetId: asset._id,
      });
    }

    // Support multipart/form-data for direct file uploads
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
