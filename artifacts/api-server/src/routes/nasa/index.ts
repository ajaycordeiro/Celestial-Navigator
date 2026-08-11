import { Router, type IRouter } from "express";
import { SearchNasaImagesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/nasa/images", async (req, res): Promise<void> => {
  const parsed = SearchNasaImagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, count } = parsed.data;

  if (!q || typeof q !== "string" || q.trim().length === 0) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }

  try {
    const limit = Math.min(count ?? 8, 20);
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=${limit}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      throw new Error(`NASA API returned ${response.status}`);
    }

    const data = (await response.json()) as {
      collection: {
        items: Array<{
          data: Array<{
            title: string;
            description: string;
            date_created: string;
            nasa_id: string;
          }>;
          links?: Array<{ href: string; rel: string }>;
        }>;
      };
    };

    const items = data.collection.items.slice(0, limit);
    const results = items
      .map((item) => {
        const meta = item.data[0];
        const imageLink = item.links?.find((l) => l.rel === "preview");
        if (!meta || !imageLink) return null;

        // Build full-res URL from thumbnail URL
        const thumbUrl = imageLink.href;
        const fullUrl = thumbUrl.replace("~thumb", "~orig").replace("~small", "~orig");

        return {
          title: meta.title ?? "",
          description: (meta.description ?? "").slice(0, 300),
          url: fullUrl,
          thumbnailUrl: thumbUrl,
          date: meta.date_created ?? "",
          nasaId: meta.nasa_id ?? "",
        };
      })
      .filter(Boolean);

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "NASA image search failed");
    res.json([]); // Return empty array rather than error
  }
});

export default router;
