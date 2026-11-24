import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://careeredge.aeternatechlabs.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/privacy-policy",
          "/terms-and-conditions",
          "/refund-policy",
          "/contact",
          "/login",
          "/signup",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/passport/",
          "/resume/",
          "/applications/",
          "/jobs/",
          "/sprints/",
          "/truth-check/",
          "/value/",
          "/evidence-vault/",
          "/counselling/",
          "/sop/",
          "/settings/",
          "/interview-prep/",
          "/role-fit-explorer/",
          "/linkedin/",
          "/pricing",
          "/onboarding",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
