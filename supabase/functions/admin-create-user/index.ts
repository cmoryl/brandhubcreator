import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only super_admin can create users
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: isSuperAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Super admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, role, organizationId, orgRole } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user via admin API (auto-confirms email)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set app-level role if specified (default is 'user' via trigger)
    if (role && role !== "user" && newUser.user) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: newUser.user.id, role },
        { onConflict: "user_id" }
      );
    }

    // Auto-approve admin-created users so they don't appear as "pending"
    if (newUser.user) {
      await supabaseAdmin.from("profiles").update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      }).eq("user_id", newUser.user.id);
    }

    // Add to organization if specified
    if (organizationId && newUser.user) {
      await supabaseAdmin.from("organization_members").insert({
        organization_id: organizationId,
        user_id: newUser.user.id,
        role: orgRole || "member",
        invite_accepted_at: new Date().toISOString(),
      });
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      brand_id: "00000000-0000-0000-0000-000000000000",
      entity_type: "user",
      action_type: "user_created",
      entity_name: "Admin User Creation",
      target_user_id: newUser.user?.id,
      target_user_email: email,
      outcome: "success",
      details: { created_by: user.id, email, role: role || "user" },
    });

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
