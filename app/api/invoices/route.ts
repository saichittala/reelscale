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
    return NextResponse.json({ success: true, documents: [] });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        id,
        number,
        type,
        status,
        client_id,
        client_name,
        company_name,
        client_email,
        client_phone,
        billing_address,
        gstin,
        project_name,
        service,
        issue_date,
        due_date,
        validity_date,
        line_items,
        subtotal,
        discount,
        tax,
        expenses,
        total,
        payment_details,
        terms,
        notes,
        created_at,
        updated_at
      FROM invoices
      ORDER BY created_at DESC;
    `;

    const documents = rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      type: r.type,
      status: r.status,
      clientId: r.client_id || "",
      clientName: r.client_name || "",
      companyName: r.company_name || "",
      clientEmail: r.client_email || "",
      clientPhone: r.client_phone || "",
      billingAddress: r.billing_address || "",
      gstin: r.gstin || "",
      projectName: r.project_name || "",
      service: r.service || "",
      issueDate: r.issue_date || "",
      dueDate: r.due_date || "",
      validityDate: r.validity_date || "",
      lineItems: typeof r.line_items === "string" ? JSON.parse(r.line_items) : (r.line_items || []),
      subtotal: Number(r.subtotal || 0),
      discount: Number(r.discount || 0),
      tax: Number(r.tax || 0),
      expenses: Number(r.expenses || 0),
      total: Number(r.total || 0),
      paymentDetails: typeof r.payment_details === "string" ? JSON.parse(r.payment_details) : (r.payment_details || {}),
      terms: r.terms || "",
      notes: r.notes || "",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      documents,
      invoices: documents,
    });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoices" },
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
      case "save":
      case "add": {
        const id = data.id || `doc-${Date.now()}`;
        const lineItems = JSON.stringify(data.lineItems || []);
        const paymentDetails = JSON.stringify(data.paymentDetails || {});

        const rows = await sql`
          INSERT INTO invoices (
            id, number, type, status, client_id, client_name, company_name, client_email,
            client_phone, billing_address, gstin, project_name, service, issue_date, due_date, validity_date,
            line_items, subtotal, discount, tax, expenses, total, payment_details, terms, notes
          ) VALUES (
            ${id},
            ${data.number || ''},
            ${data.type || 'Invoice'},
            ${data.status || 'Draft'},
            ${String(data.clientId || '')},
            ${data.clientName || ''},
            ${data.companyName || ''},
            ${data.clientEmail || ''},
            ${data.clientPhone || ''},
            ${data.billingAddress || ''},
            ${data.gstin || ''},
            ${data.projectName || ''},
            ${data.service || ''},
            ${data.issueDate || ''},
            ${data.dueDate || ''},
            ${data.validityDate || ''},
            ${lineItems}::jsonb,
            ${Number(data.subtotal || 0)},
            ${Number(data.discount || 0)},
            ${Number(data.tax || 0)},
            ${Number(data.expenses || 0)},
            ${Number(data.total || 0)},
            ${paymentDetails}::jsonb,
            ${data.terms || ''},
            ${data.notes || ''}
          )
          ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            client_id = EXCLUDED.client_id,
            client_name = EXCLUDED.client_name,
            company_name = EXCLUDED.company_name,
            client_email = EXCLUDED.client_email,
            client_phone = EXCLUDED.client_phone,
            billing_address = EXCLUDED.billing_address,
            gstin = EXCLUDED.gstin,
            project_name = EXCLUDED.project_name,
            service = EXCLUDED.service,
            issue_date = EXCLUDED.issue_date,
            due_date = EXCLUDED.due_date,
            validity_date = EXCLUDED.validity_date,
            line_items = EXCLUDED.line_items,
            subtotal = EXCLUDED.subtotal,
            discount = EXCLUDED.discount,
            tax = EXCLUDED.tax,
            expenses = EXCLUDED.expenses,
            total = EXCLUDED.total,
            payment_details = EXCLUDED.payment_details,
            terms = EXCLUDED.terms,
            notes = EXCLUDED.notes,
            updated_at = NOW()
          RETURNING *;
        `;
        return NextResponse.json({ success: true, document: rows[0] });
      }

      case "delete": {
        await sql`
          DELETE FROM invoices
          WHERE id = ${String(data.id)};
        `;
        return NextResponse.json({ success: true, message: "Document deleted" });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Invoices API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
