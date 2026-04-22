import { createAvailabilityRule } from "./product-availability.js";

export const PRODUCT_AVAILABILITY_POLICY = Object.freeze({
  board: createAvailabilityRule({
    includeIds: [],
    excludedCategories: [],
    excludedIds: [],
  }),
  plywood: createAvailabilityRule({
    includeIds: [],
    excludedCategories: ["LX Texture PET","Hansol PET","Original PET","LPM"],
    excludedIds: [],
  }),
  door: createAvailabilityRule({
    includeIds: [],
    excludedCategories: ["LX Texture PET","Hansol PET","Original PET","LPM"],
    excludedIds: [],
  }),
  top: createAvailabilityRule({
    includeIds: [],
    excludedCategories: [],
    excludedIds: [],
  }),
  system: Object.freeze({
    shelf: createAvailabilityRule({
      includeIds: [],
      excludedCategories: [],
      excludedIds: [],
    }),
    column: createAvailabilityRule({
      includeIds: [],
      excludedCategories: [],
      excludedIds: [],
    }),
  }),
});
