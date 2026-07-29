const localCatalogImagePrefix = "/images/catalog/";
const catalogThumbnailPrefix = "/images/catalog/thumbnails/";
const catalogImageVersion = "20260729";

export function catalogImageSrc(
  value: string,
  { thumbnail = false }: { thumbnail?: boolean } = {},
) {
  if (!value.startsWith(localCatalogImagePrefix)) {
    return value;
  }

  const path =
    thumbnail && !value.startsWith(catalogThumbnailPrefix)
      ? value.replace(localCatalogImagePrefix, catalogThumbnailPrefix)
      : value;

  return `${path}?v=${catalogImageVersion}`;
}
