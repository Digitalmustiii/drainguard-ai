import { internalMutation } from "./_generated/server";

/**
 * Real, named Lagos flood-prone locations (not fictional placeholder IDs),
 * compiled from Lagos Ministry of Environment drainage maintenance notices
 * and 2025-2026 flood-risk reporting. Coordinates are neighborhood-level
 * approximations — refine with satellite imagery before any real deployment.
 */
const LAGOS_DRAIN_LOCATIONS = [
  {
    name: "Ebute Metta Collector Drain",
    zone: "Ebute Metta, Lagos Mainland",
    lat: 6.488,
    lng: 3.38,
    description: "Chronic post-rain flooding near the rail corridor.",
  },
  {
    name: "Iddo Drainage Channel",
    zone: "Iddo, Lagos Mainland",
    lat: 6.47,
    lng: 3.384,
    description: "Low-lying area adjacent to the lagoon.",
  },
  {
    name: "Oworonshoki Collector Drain",
    zone: "Oworonshoki, Kosofe",
    lat: 6.539,
    lng: 3.391,
    description: "Alabi Owoyemi/Adeyiga/Awolowo Way downstream collector.",
  },
  {
    name: "Oshodi Drainage Channel",
    zone: "Oshodi-Isolo",
    lat: 6.55,
    lng: 3.339,
    description: "Frequent blockage from solid waste; heavy traffic corridor.",
  },
  {
    name: "Agege Motor Road Collector",
    zone: "Agege",
    lat: 6.615,
    lng: 3.321,
    description: "Primary collector drain under Lagos State maintenance.",
  },
  {
    name: "Jemtok/Kinoshi Collector Drain",
    zone: "Ago Palace Way, Isolo",
    lat: 6.538,
    lng: 3.325,
    description: "Under active Lagos State drainage rehabilitation.",
  },
  {
    name: "Mile 2 Drainage Channel",
    zone: "Mile 2, Amuwo-Odofin",
    lat: 6.465,
    lng: 3.295,
    description: "Major expressway drainage, prone to overflow.",
  },
  {
    name: "Ijede Waterside Drain",
    zone: "Ijede, Ikorodu",
    lat: 6.617,
    lng: 3.517,
    description: "Low-lying, near-lagoon community; high flood risk.",
  },
  {
    name: "Igbogbo Community Drain",
    zone: "Igbogbo, Ikorodu",
    lat: 6.624,
    lng: 3.507,
    description: "Vulnerable to Oyan Dam water release events.",
  },
  {
    name: "Badagry Expressway Drain",
    zone: "Badagry",
    lat: 6.415,
    lng: 2.881,
    description: "High rainfall exposure, coastal flood risk.",
  },
] as const;

export const seedDrains = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("drains").first();
    if (existing) {
      return { skipped: true, reason: "drains table already seeded" };
    }

    for (const location of LAGOS_DRAIN_LOCATIONS) {
      await ctx.db.insert("drains", location);
    }

    return { skipped: false, inserted: LAGOS_DRAIN_LOCATIONS.length };
  },
});
