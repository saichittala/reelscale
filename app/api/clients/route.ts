import { NextRequest, NextResponse } from "next/server";
import { checkRole } from "../rbac";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return NextResponse.json({ success: true, clients: [] });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        id, 
        name, 
        business, 
        phone, 
        instagram, 
        reels, 
        ppr, 
        image, 
        billing_model, 
        plan, 
        base_rate, 
        bargain, 
        revenue, 
        date
      FROM clients
      ORDER BY id ASC;
    `;

    const clients = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      clientName: r.name,
      business: r.business || "",
      phone: r.phone || "",
      instagram: r.instagram || "",
      reels: Number(r.reels || 0),
      pricePerReel: Number(r.ppr || 0),
      ppr: Number(r.ppr || 0),
      image: r.image || "",
      billingModel: r.billing_model || "Reel-to-Reel",
      plan: r.plan || "",
      baseRate: Number(r.base_rate || 0),
      bargain: Number(r.bargain || 0),
      revenue: Number(r.revenue || 0),
      date: r.date || "",
    }));

    // Return both format: root array or object with clients field
    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rbac = await checkRole(request, ["admin"]);
  if (!rbac.authorized) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;
    const sql = getDb();

    switch (action) {
      case "add": {
        const clientName = data.clientName || data.name;
        const reels = Number(data.reels || 0);
        const ppr = Number(data.pricePerReel || data.ppr || 0);
        const revenue = reels * ppr;

        const rows = await sql`
          INSERT INTO clients (
            name, business, phone, instagram, reels, ppr, image, billing_model, plan, base_rate, bargain, revenue, date
          ) VALUES (
            ${clientName},
            ${data.business || ''},
            ${String(data.phone || '')},
            ${data.instagram || ''},
            ${reels},
            ${ppr},
            ${data.image || ''},
            ${data.billingModel || 'Reel-to-Reel'},
            ${data.plan || ''},
            ${Number(data.baseRate || 0)},
            ${Number(data.bargain || 0)},
            ${revenue},
            ${data.date || new Date().toISOString().slice(0, 10)}
          )
          RETURNING *;
        `;
        return NextResponse.json({ success: true, client: rows[0] });
      }

      case "update": {
        const clientName = data.clientName || data.name;
        const reels = Number(data.reels || 0);
        const ppr = Number(data.pricePerReel || data.ppr || 0);
        const revenue = reels * ppr;

        const rows = await sql`
          UPDATE clients
          SET
            name = ${clientName},
            business = ${data.business || ''},
            phone = ${String(data.phone || '')},
            instagram = ${data.instagram || ''},
            reels = ${reels},
            ppr = ${ppr},
            image = ${data.image || ''},
            billing_model = ${data.billingModel || 'Reel-to-Reel'},
            plan = ${data.plan || ''},
            base_rate = ${Number(data.baseRate || 0)},
            bargain = ${Number(data.bargain || 0)},
            revenue = ${revenue},
            date = ${data.date || ''},
            updated_at = NOW()
          WHERE id = ${Number(data.id)}
          RETURNING *;
        `;
        return NextResponse.json({ success: true, client: rows[0] });
      }

      case "delete": {
        await sql`
          DELETE FROM clients
          WHERE id = ${Number(data.id)};
        `;
        return NextResponse.json({ success: true, message: "Client deleted" });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Clients API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
