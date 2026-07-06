import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "get_brand",
  title: "Get brand",
  description:
    "Fetch a single brand by id or slug, including its full guide_data payload.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Brand UUID"),
    slug: z.string().optional().describe("Brand slug"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!id && !slug) {
      return { content: [{ type: "text", text: "Provide id or slug" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let q = sb.from("brands").select("*").limit(1);
    if (id) q = q.eq("id", id);
    else if (slug) q = q.eq("slug", slug);
    const { data, error } = await q.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Brand not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { brand: data },
    };
  },
});
