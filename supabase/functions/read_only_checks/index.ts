// supabase/functions/read_only_checks/index.ts

// Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS + JSON headers
const headers = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

// helper to parse query strings like "ext:pgcrypto"
function parseSymbol(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  const kind = parts.shift()?.toLowerCase();
  if (!kind) return null;
  if (kind === "ext"    && parts.length === 1) return { kind: "ext", ext: parts[0] };
  if (kind === "table"  && parts.length === 2) return { kind: "table", sch: parts[0], tbl: parts[1] };
  if (kind === "rls"    && parts.length === 2) return { kind: "rls", sch: parts[0], tbl: parts[1] };
  if (kind === "policy" && parts.length === 3) return { kind: "policy", sch: parts[0], tbl: parts[1], pol: parts[2] };
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    let query: string | null = null;

    if (req.method === "GET") {
      const params = new URL(req.url).searchParams;
      query = params.get("query")
        ?? params.get("read_only_checks")
        ?? params.get("symbol");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const possible = body?.query ?? body?.read_only_checks ?? body?.symbol;
      if (typeof possible === "string") {
        query = possible;
      }
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "Method Not Allowed" }),
        { status: 405, headers }
      );
    }

    if (typeof query !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "query required" }),
        { status: 400, headers }
      );
    }

    const sym = parseSymbol(query);
    if (!sym) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid symbol" }),
        { status: 400, headers }
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

