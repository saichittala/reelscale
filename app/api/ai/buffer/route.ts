import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  getRollingBufferState,
  saveRollingBufferState,
  generateSingleStagedBlog,
  publishNextDailyBlog,
  ensureRollingBuffer,
  startBackgroundBufferFill,
  isBufferFillingActive,
} from "../../../lib/scheduler/rolling-buffer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const state = getRollingBufferState();
    return NextResponse.json({
      success: true,
      state,
      stagedCount: state.stagedBlogs.length,
      targetSize: state.targetSize,
      isFull: state.stagedBlogs.length >= state.targetSize,
      isGeneratingBuffer: isBufferFillingActive(),
      nextScheduledPublish: state.nextScheduledPublish,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch buffer state" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action = "status", count = 30, blogId, config } = body;

    switch (action) {
      case "generate-next":
      case "replenish-one": {
        const newBlog = await generateSingleStagedBlog();
        const state = getRollingBufferState();
        state.stagedBlogs.push(newBlog);
        saveRollingBufferState(state);

        return NextResponse.json({
          success: true,
          message: `Generated and staged "${newBlog.title}" (Buffer: ${state.stagedBlogs.length}/${state.targetSize})`,
          stagedBlog: newBlog,
          bufferCount: state.stagedBlogs.length,
          targetSize: state.targetSize,
        });
      }

      case "publish-next":
      case "publish-and-replenish": {
        const result = await publishNextDailyBlog();
        return NextResponse.json({
          success: true,
          message: `Published "${result.publishedBlog.title}" to production! Instant replenishment triggered in background to maintain 30-blog buffer.`,
          publishedBlog: result.publishedBlog,
          bufferCount: result.bufferState.stagedBlogs.length,
          targetSize: result.bufferState.targetSize,
          liveUrl: `https://reelscale.in/blog/${result.publishedBlog.slug}`,
        });
      }

      case "fill-buffer":
      case "ensure-30": {
        const target = Number(count) || 30;
        const started = startBackgroundBufferFill(target);
        const state = getRollingBufferState();

        return NextResponse.json({
          success: true,
          message: started
            ? `Background buffer fill started! Pre-generating articles with full content & photography up to ${target} blogs.`
            : `Buffer fill worker is already active (${state.stagedBlogs.length}/${target} ready).`,
          isGeneratingBuffer: true,
          currentCount: state.stagedBlogs.length,
          targetSize: target,
        });
      }

      case "remove": {
        if (!blogId) {
          return NextResponse.json({ success: false, message: "Missing blogId" }, { status: 400 });
        }
        const state = getRollingBufferState();
        state.stagedBlogs = state.stagedBlogs.filter((b) => b.id !== blogId && b.slug !== blogId);
        saveRollingBufferState(state);

        let replacement = null;
        if (state.autoReplenish) {
          replacement = await generateSingleStagedBlog();
          const freshState = getRollingBufferState();
          freshState.stagedBlogs.push(replacement);
          saveRollingBufferState(freshState);
        }

        return NextResponse.json({
          success: true,
          message: `Blog removed from buffer. ${replacement ? `Instantly replenished with "${replacement.title}"` : ""}`,
          replacement,
          bufferCount: getRollingBufferState().stagedBlogs.length,
        });
      }

      case "update-config": {
        const state = getRollingBufferState();
        if (config?.targetSize !== undefined) state.targetSize = Number(config.targetSize);
        if (config?.autoPublishDaily !== undefined) state.autoPublishDaily = Boolean(config.autoPublishDaily);
        if (config?.autoReplenish !== undefined) state.autoReplenish = Boolean(config.autoReplenish);
        if (config?.dailyPublishTime !== undefined) state.dailyPublishTime = String(config.dailyPublishTime);
        saveRollingBufferState(state);

        return NextResponse.json({
          success: true,
          message: "Rolling buffer configuration updated",
          state,
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Buffer API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process buffer action" },
      { status: 500 }
    );
  }
}
