/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as drains from "../drains.js";
import type * as rainfall from "../rainfall.js";
import type * as rainfallSnapshots from "../rainfallSnapshots.js";
import type * as readings from "../readings.js";
import type * as riskScore from "../riskScore.js";
import type * as seed from "../seed.js";
import type * as simulate from "../simulate.js";
import type * as weatherCodes from "../weatherCodes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  dashboard: typeof dashboard;
  drains: typeof drains;
  rainfall: typeof rainfall;
  rainfallSnapshots: typeof rainfallSnapshots;
  readings: typeof readings;
  riskScore: typeof riskScore;
  seed: typeof seed;
  simulate: typeof simulate;
  weatherCodes: typeof weatherCodes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
