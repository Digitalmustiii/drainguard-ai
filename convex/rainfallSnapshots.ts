import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertSnapshot = internalMutation({
  args: {
    rainfall24hMm: v.number(),
    temperatureC: v.optional(v.number()),
    weatherCode: v.optional(v.number()),
    condition: v.optional(v.string()),
    soilMoisture: v.optional(v.number()),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rainfallSnapshots", args);
  },
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rainfallSnapshots").order("desc").first();
  },
});

// Recent history for the "Predicted Flood Risk Trend" chart.
export const recentHistory = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("rainfallSnapshots")
      .order("desc")
      .take(24);
    return rows.reverse();
  },
});
