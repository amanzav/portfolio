export const SITE_URL = "https://www.azaveri.com";

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
