import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function VerLanding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await supabase
    .from("landings_publicadas")
    .select("html")
    .eq("id", id)
    .single();

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
        <h1>Landing no encontrada</h1>
        <p>Este enlace no existe o fue eliminado.</p>
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
}