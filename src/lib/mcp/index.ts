import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBrandsTool from "./tools/list-brands";
import getBrandTool from "./tools/get-brand";
import listProductsTool from "./tools/list-products";
import listEventsTool from "./tools/list-events";
import listOrganizationsTool from "./tools/list-organizations";

// Build issuer from the Supabase project ref (inlined at build time). Never use
// SUPABASE_URL — on Lovable Cloud it points at the .lovable.cloud proxy, and
// mcp-js rejects tokens whose configured issuer disagrees with discovery.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "brandhub-mcp",
  title: "BrandHub",
  version: "0.1.0",
  instructions:
    "Read-only access to BrandHub brands, products, events, and organizations for the signed-in user. Use list_organizations first to see workspace scope, then list_brands / get_brand / list_products / list_events to explore brand guidelines and portfolio data.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listOrganizationsTool,
    listBrandsTool,
    getBrandTool,
    listProductsTool,
    listEventsTool,
  ],
});
