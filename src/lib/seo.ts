export const seo = (title: string, description: string, extra: { robots?: string } = {}) => ({
  meta: [
    { title: `${title} | THE VIJAY STORE` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | THE VIJAY STORE` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(extra.robots ? [{ name: "robots", content: extra.robots }] : []),
  ],
});
