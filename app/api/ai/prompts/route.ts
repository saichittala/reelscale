import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../../rbac";
import {
  getAllPromptTemplates,
  getPromptTemplateById,
  updatePromptTemplate,
  getPromptVersionHistory,
  rollbackPromptVersion,
  restoreDefaultPrompt,
  testPromptExecution,
} from "../../../lib/ai/prompt-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "blogger"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const template = await getPromptTemplateById(id);
      if (!template) {
        return NextResponse.json(
          { success: false, message: `Prompt template '${id}' not found` },
          { status: 404 }
        );
      }
      const versions = await getPromptVersionHistory(id);
      return NextResponse.json({ success: true, template, prompt: template, versions });
    }

    const templates = await getAllPromptTemplates();
    return NextResponse.json({ success: true, templates, prompts: templates });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch prompts" },
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
    const body = await request.json();
    const { action, id, templateId, ...payload } = body;
    const targetId = id || templateId;

    const userTemplate = payload.user_template || payload.user_prompt_template;

    switch (action) {
      case "save":
      case "update": {
        if (!targetId || !payload.system_prompt || !userTemplate) {
          return NextResponse.json(
            { success: false, message: "Missing required fields (id, system_prompt, user_template/user_prompt_template)" },
            { status: 400 }
          );
        }
        const updated = await updatePromptTemplate(targetId, {
          system_prompt: payload.system_prompt,
          user_template: userTemplate,
          change_summary: payload.change_summary,
          updated_by: rbac.email || "Admin",
        });
        const versions = await getPromptVersionHistory(targetId);
        return NextResponse.json({
          success: true,
          message: `Prompt template '${targetId}' updated successfully to version ${updated.current_version_number}`,
          template: updated,
          prompt: updated,
          versions,
        });
      }

      case "rollback": {
        const versionNumber = Number(payload.version_number);
        if (!targetId || !versionNumber) {
          return NextResponse.json(
            { success: false, message: "Missing required fields (id, version_number)" },
            { status: 400 }
          );
        }
        const rolledBack = await rollbackPromptVersion(
          targetId,
          versionNumber,
          rbac.email || "Admin"
        );
        const versions = await getPromptVersionHistory(targetId);
        return NextResponse.json({
          success: true,
          message: `Rolled back to version ${versionNumber}`,
          template: rolledBack,
          prompt: rolledBack,
          versions,
        });
      }

      case "restore_default":
      case "restore-default": {
        if (!targetId) {
          return NextResponse.json(
            { success: false, message: "Missing template id" },
            { status: 400 }
          );
        }
        const restored = await restoreDefaultPrompt(targetId, rbac.email || "Admin");
        const versions = await getPromptVersionHistory(targetId);
        return NextResponse.json({
          success: true,
          message: `Restored '${targetId}' to factory default`,
          template: restored,
          prompt: restored,
          versions,
        });
      }

      case "test": {
        if (!targetId) {
          return NextResponse.json(
            { success: false, message: "Missing template id" },
            { status: 400 }
          );
        }
        const result = await testPromptExecution({
          templateId: targetId,
          system_prompt: payload.system_prompt,
          user_template: userTemplate,
          testVariables: payload.test_variables,
          model: payload.model,
        });
        return NextResponse.json({ success: true, result });
      }

      case "get-versions": {
        if (!targetId) {
          return NextResponse.json(
            { success: false, message: "Missing template id" },
            { status: 400 }
          );
        }
        const versions = await getPromptVersionHistory(targetId);
        return NextResponse.json({ success: true, versions });
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action '${action}'` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process prompt action" },
      { status: 500 }
    );
  }
}
