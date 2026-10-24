import type { MetadataRoute } from "next";
import { buildRobots } from "@/lib/seo/sitemap";
import { readSiteUrl } from "@/lib/seo/site";

// /robots.txt: /admin 차단 + sitemap 주소 (src/lib/seo/sitemap.ts buildRobots)
export default function robots(): MetadataRoute.Robots {
  return buildRobots(readSiteUrl());
}
