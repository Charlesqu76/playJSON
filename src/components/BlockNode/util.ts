export const getAttrHandleId = (sourceAttrKey: string): string =>
  `attr-${encodeURIComponent(sourceAttrKey)}`;
