import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Read-only check: confirms anonymous access to the public curriculum table. */
export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { configured: false, reachable: false, curriculumReadable: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { error } = await supabase.from("learning_levels").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { configured: true, reachable: true, curriculumReadable: false },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { configured: true, reachable: true, curriculumReadable: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { configured: true, reachable: false, curriculumReadable: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
