import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../rbac";
import { getDb } from "../../lib/db";
import { redisGet, redisSet, redisDel } from "../../lib/redis";

export const dynamic = "force-dynamic";

const REDIS_CACHE_KEY = "db:sales";
const CACHE_TTL_SECONDS = 120; // 2 minutes cache

export async function GET(request: Request) {
  const rbac = await checkRole(request, ["admin", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, sales: [] });
  }

  try {
    const cached = await redisGet<{ success: boolean; sales: any[] }>(REDIS_CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const sql = getDb();
    const rows = await sql`
      SELECT 
        id, 
        category, 
        company_name, 
        contact_person, 
        phone_number, 
        notes, 
        contacted, 
        created_date
      FROM sales
      ORDER BY id DESC;
    `;

    const sales = rows.map((r: any) => ({
      id: r.id,
      category: r.category || "",
      companyName: r.company_name || "",
      contactPerson: r.contact_person || "",
      phoneNumber: r.phone_number || "",
      notes: r.notes || "",
      contacted: r.contacted || "No",
      createdDate: r.created_date || "",
    }));

    const result = {
      success: true,
      sales,
      leads: sales,
    };

    await redisSet(REDIS_CACHE_KEY, result, CACHE_TTL_SECONDS);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sales GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin", "sales"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;
    const sql = getDb();

    // Invalidate Redis cache
    await redisDel(REDIS_CACHE_KEY);

    switch (action) {
      case "add": {
        const rows = await sql`
          INSERT INTO sales (
            category, company_name, contact_person, phone_number, notes, contacted, created_date
          ) VALUES (
            ${data.category || ''},
            ${data.companyName || ''},
            ${data.contactPerson || ''},
            ${String(data.phoneNumber || '')},
            ${data.notes || ''},
            ${data.contacted || 'No'},
            ${data.createdDate || new Date().toISOString().slice(0, 10)}
          )
          RETURNING *;
        `;
        return NextResponse.json({ success: true, lead: rows[0], sale: rows[0] });
      }

      case "update": {
        const rows = await sql`
          UPDATE sales
          SET
            category = ${data.category || ''},
            company_name = ${data.companyName || ''},
            contact_person = ${data.contactPerson || ''},
            phone_number = ${String(data.phoneNumber || '')},
            notes = ${data.notes || ''},
            contacted = ${data.contacted || 'No'},
            created_date = ${data.createdDate || ''},
            updated_at = NOW()
          WHERE id = ${Number(data.id)}
          RETURNING *;
        `;
        return NextResponse.json({ success: true, lead: rows[0], sale: rows[0] });
      }

      case "delete": {
        await sql`
          DELETE FROM sales
          WHERE id = ${Number(data.id)};
        `;
        return NextResponse.json({ success: true, message: "Sale deleted" });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Sales API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
