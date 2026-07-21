import type { MetadataRoute } from "next";

// Nur die öffentliche Startseite. /login, /app, /portal sind privat;
// /impressum und /datenschutz sind noindex und gehören nicht in die Sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://valeo-finance.de",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
