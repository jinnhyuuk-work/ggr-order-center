const freezeDimensionLimits = ({ minWidth, maxWidth, minLength, maxLength }) =>
  Object.freeze({
    minWidth: Number(minWidth),
    maxWidth: Number(maxWidth),
    minLength: Number(minLength),
    maxLength: Number(maxLength),
  });

export const ORDER_DIMENSION_LIMITS = Object.freeze({
  top: freezeDimensionLimits({
    minWidth: 300,
    maxWidth: 1200,
    minLength: 300,
    maxLength: 3000,
  }),
  door: freezeDimensionLimits({
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
  }),
  board: freezeDimensionLimits({
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
  }),
});

export const withDimensionLimits = (item, limits) => ({
  ...(limits || {}),
  ...(item || {}),
});
