/**
 * image-utils -- utility for detecting image files by extension.
 *
 * Separated from ImagePreview.tsx for react-refresh compatibility
 * (files exporting components must only export components).
 */

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']);

/**
 * Checks if a file name has an image extension.
 */
export function isImageFile(name: string): boolean {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return false;
  const ext = name.slice(dotIndex).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}
