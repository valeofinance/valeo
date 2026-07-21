import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Geschützte und rechtliche Seiten nicht indexieren
      disallow: ["/app", "/portal", "/login", "/impressum", "/datenschutz"],
    },
    sitemap: "https://valeo-finance.de/sitemap.xml",
    host: "https://valeo-finance.de",
  };
}
