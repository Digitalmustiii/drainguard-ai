import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const latestPerDrain = query({
  args: {},
  handler: async (ctx) => {
    const drains = await ctx.db.query("drains").collect();
    const result = [];
    for (const drain of drains) {
      const latest = await ctx.db
        .query("readings")
        .withIndex("by_drain", (q) => q.eq("drainId", drain._id))
        .order("desc")
        .first();
      result.push({ drain, latestReading: latest });
    }
    return result;
  },
});

export const insertReading = internalMutation({
  args: {
    drainId: v.id("drains"),
    waterLevelCm: v.number(),
    blockagePct: v.number(),
    source: v.union(v.literal("simulated"), v.literal("community_report")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("readings", args);
  },
});

// Zero-cost real data source: anyone can report observed flooding/blockage
// at a drain. Validated the same way a real sensor payload would be.
export const submitCommunityReport = mutation({
  args: {
    drainId: v.id("drains"),
    waterLevelCm: v.number(),
    blockagePct: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.waterLevelCm < 0 || args.waterLevelCm > 500) {
      throw new Error("waterLevelCm must be between 0 and 500");
    }
    if (args.blockagePct < 0 || args.blockagePct > 100) {
      throw new Error("blockagePct must be between 0 and 100");
    }
    const drain = await ctx.db.get(args.drainId);
    if (!drain) {
      throw new Error("Unknown drain");
    }

    await ctx.db.insert("readings", {
      drainId: args.drainId,
      waterLevelCm: args.waterLevelCm,
      blockagePct: args.blockagePct,
      source: "community_report",
    });
  },
});
