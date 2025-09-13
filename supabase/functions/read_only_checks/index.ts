// supabase/functions/read_only_checks/index.ts

// Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS + JSON headers
const headers = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "POST, OPTIONS",
};

// helper to parse query strings like "ext:pgcrypto"
function parseSymbol(q: string) {
  const p = q.split(":");
  if (p[0] === "ext"    && p.length === 2) return { kind: "ext", ext: p[1] };
  if (p[0] === "table"  && p.length === 3) return { kind: "table", sch: p[1], tbl: p[2] };
  if (p[0] === "rls"    && p.length === 3) return { kind: "rls", sch: p[1], tbl: p[2] };
  if (p[0] === "policy" && p.length === 4) return { kind: "policy", sch: p[1], tbl: p[2], pol: p[3] };
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method Not Allowed" }),
        { status: 405, headers }
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = body?.query;
    if (typeof query !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "query required" }),
        { headers }
      );
    }

    const sym = parseSymbol(query);
    if (!sym) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid symbol" }),
        { headers }
      );
    }

    // Built-in function secrets — no need to define your own
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing SUPABASE_URL/ANON_KEY" }),
        { headers }
      );
    }

    const supabase = createClient(url, anon);

    let ok = false;

    if (sym.kind === "ext") {
      const { data, error } = await supabase.rpc("ro_check_extension", { ext_name: sym.ext });
      if (error) throw error; ok = !!data;
    } else if (sym.kind === "table") {
      const { data, error } = await supabase.rpc("ro_check_table", { sch: sym.sch, tbl: sym.tbl });
      if (error) throw error; ok = !!data;
    } else if (sym.kind === "rls") {
      const { data, error } = await supabase.rpc("ro_check_rls", { sch: sym.sch, tbl: sym.tbl });
      if (error) throw error; ok = !!data;
    } else if (sym.kind === "policy") {
      const { data, error } = await supabase.rpc("ro_check_policy", { sch: sym.sch, tbl: sym.tbl, pol: sym.pol });
      if (error) throw error; ok = !!data;
    }

    return new Response(JSON.stringify({ ok }), { headers });
  } catch (e) {
    const msg = (e && typeof e === "object" && "message" in e)
      ? (e as any).message
      : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), { headers });
  }
});

