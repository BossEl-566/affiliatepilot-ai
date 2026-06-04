import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SaleModel } from "@/models/Sale";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { LeadModel } from "@/models/Lead";

export const runtime = "nodejs";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET() {
  try {
    await connectToDatabase();

    const sales = await SaleModel.find().sort({ soldAt: -1 }).lean();

    const productIds = Array.from(
      new Set(sales.map((sale) => String(sale.affiliateProductId)))
    );

    const leadIds = Array.from(
      new Set(
        sales
          .map((sale) => sale.leadId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    const [products, leads] = await Promise.all([
      AffiliateProductModel.find({
        _id: { $in: productIds },
      })
        .select("name platformName trackingCode")
        .lean(),

      LeadModel.find({
        _id: { $in: leadIds },
      })
        .select("name username contact")
        .lean(),
    ]);

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        {
          _id: String(product._id),
          name: product.name,
          platformName: product.platformName,
          trackingCode: product.trackingCode,
        },
      ])
    );

    const leadMap = new Map(
      leads.map((lead) => [
        String(lead._id),
        {
          _id: String(lead._id),
          name: lead.name,
          username: lead.username,
          contact: lead.contact,
        },
      ])
    );

    const enrichedSales = sales.map((sale) => ({
      ...sale,
      affiliateProduct:
        productMap.get(String(sale.affiliateProductId)) || null,
      lead: sale.leadId ? leadMap.get(String(sale.leadId)) || null : null,
    }));

    const confirmedSales = sales.filter(
      (sale) => sale.status === "confirmed" || sale.status === "paid"
    );

    const stats = {
      totalSales: sales.length,
      confirmedSales: confirmedSales.length,
      totalRevenue: confirmedSales.reduce(
        (sum, sale) => sum + Number(sale.saleAmount || 0),
        0
      ),
      totalCommission: confirmedSales.reduce(
        (sum, sale) => sum + Number(sale.commissionEarned || 0),
        0
      ),
    };

    return Response.json({
      ok: true,
      sales: enrichedSales,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch sales:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (
      !body.affiliateProductId ||
      !isValidObjectId(String(body.affiliateProductId))
    ) {
      return Response.json(
        {
          ok: false,
          error: "Select a valid affiliate product.",
        },
        { status: 400 }
      );
    }

    if (body.leadId && !isValidObjectId(String(body.leadId))) {
      return Response.json(
        {
          ok: false,
          error: "Invalid lead ID.",
        },
        { status: 400 }
      );
    }

    const sale = await SaleModel.create({
      affiliateProductId: body.affiliateProductId,
      leadId: body.leadId || undefined,
      platform: body.platform ?? "other",
      customerName: body.customerName ?? "",
      currency: body.currency ?? "GHS",
      saleAmount: Number(body.saleAmount ?? 0),
      commissionEarned: Number(body.commissionEarned ?? 0),
      status: body.status ?? "confirmed",
      notes: body.notes ?? "",
      soldAt: body.soldAt ? new Date(body.soldAt) : new Date(),
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
    });

    if (body.leadId) {
      await LeadModel.findByIdAndUpdate(body.leadId, {
        $set: {
          status: "converted",
          convertedAt: new Date(),
        },
      });
    }

    return Response.json(
      {
        ok: true,
        sale,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create sale:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}