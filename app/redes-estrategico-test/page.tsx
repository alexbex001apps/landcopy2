"use client";
import { useState } from "react";

export default function RedesEstrategicoTest() {
  const [modo, setModo] = useState("producto");
  const [dias, setDias] = useState(7);
  const [objetivo, setObjetivo] = useState("más ventas");
  const [pNombre, setPNombre] = useState("Rodillax");
  const [pBeneficio, setPBeneficio] = useState("Alivia el dolor de rodilla sin pastillas");
  const [pProblema, setPProblema] = useState("Dolor de rodilla al caminar o subir escaleras");
  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Cercano");

  const [cargando, setCargando] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState("");

  async function probar() {
    setCargando(true);
    setPlan(null);
    setError("");
    try {
      const resp = await fetch("/api/redes-estrategico/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo, dias, objetivo, pais, tono,
          pNombre, pBeneficio, pProblema,
          redes: ["instagram", "facebook", "tiktok"],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Error"); }
      else { setPlan(data); }
    } catch (e: any) {
      setError(e.message);
    }
    setCargando(false);
  }

  const input = { width: "100%", padding: "8px", marginBottom: "8px", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "6px", fontSize: "13px" } as const;
  const label = { fontSize: "11px", color: "#888", display: "block", marginBottom: "2px", marginTop: "8px" } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "24px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "18px", marginBottom: "4px", color: "#FFF500" }}>🧠 Prueba del Cerebro — Redes Estratégico</h1>
        <p style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>Página temporal de prueba. Pon datos, da clic, mira el plan que diseña la IA.</p>

        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <span style={label}>Modo</span>
          <select value={modo} onChange={e => setModo(e.target.value)} style={input}>
            <option value="producto">producto</option>
            <option value="negocio">negocio</option>
            <option value="marca">marca</option>
          </select>

          <span style={label}>Nombre del producto</span>
          <input value={pNombre} onChange={e => setPNombre(e.target.value)} style={input} />

          <span style={label}>Beneficio</span>
          <input value={pBeneficio} onChange={e => setPBeneficio(e.target.value)} style={input} />

          <span style={label}>Problema que resuelve</span>
          <input value={pProblema} onChange={e => setPProblema(e.target.value)} style={input} />

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <span style={label}>Días</span>
              <select value={dias} onChange={e => setDias(Number(e.target.value))} style={input}>
                <option value={3}>3</option>
                <option value={7}>7</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <span style={label}>Objetivo</span>
              <select value={objetivo} onChange={e => setObjetivo(e.target.value)} style={input}>
                <option>más ventas</option>
                <option>más seguidores</option>
                <option>más engagement</option>
                <option>más leads</option>
                <option>branding</option>
              </select>
            </div>
          </div>

          <button onClick={probar} disabled={cargando}
            style={{ width: "100%", marginTop: "16px", padding: "14px", background: "#FFF500", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", opacity: cargando ? 0.5 : 1 }}>
            {cargando ? "⚙️ La IA está pensando... (puede tardar 20-40 seg)" : "⚡ Probar cerebro"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#2a0a0a", border: "1px solid #500", borderRadius: "8px", padding: "12px", color: "#f88", fontSize: "12px", whiteSpace: "pre-wrap" }}>
            ❌ {error}
          </div>
        )}

        {plan && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: "10px", padding: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ color: "#FFF500", fontSize: "13px" }}>💎 Promesa: <span style={{ color: "#fff" }}>{plan.promesaPrincipal}</span></div>
              <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>🎬 Arco: {Array.isArray(plan.arcoNarrativo) ? plan.arcoNarrativo.join(" → ") : ""}</div>
              <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>⚖️ Balance: {plan.balanceMarca ? JSON.stringify(plan.balanceMarca) : ""}</div>
            </div>
            {Array.isArray(plan.piezas) && plan.piezas.map((p: any, i: number) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: "8px", padding: "12px", marginBottom: "8px", fontSize: "12px" }}>
                <div style={{ color: "#FFF500", fontWeight: "bold" }}>DÍA {p.dia} · {p.tipo} · {Array.isArray(p.red) ? p.red.join(", ") : p.red}</div>
                <div style={{ color: "#0ff", marginTop: "4px" }}>🎯 {p.objetivoPsicologico}</div>
                <div style={{ color: "#fff", marginTop: "4px", fontWeight: "bold" }}>{p.titulo}</div>
                <div style={{ color: "#ccc", marginTop: "4px" }}>{p.copy}</div>
                <div style={{ color: "#8f8", marginTop: "4px" }}>📣 {p.cta}</div>
                {p.hook && <div style={{ color: "#f8f", marginTop: "4px" }}>🎣 HOOK: {p.hook}</div>}
                {p.guion && <div style={{ color: "#aaa", marginTop: "4px" }}>🎞️ GUION: {p.guion}</div>}
                {p.textoEnPantalla && <div style={{ color: "#aaa", marginTop: "4px" }}>💬 PANTALLA: {p.textoEnPantalla}</div>}
                {Array.isArray(p.laminas) && p.laminas.length > 0 && (
                  <div style={{ color: "#aaa", marginTop: "4px" }}>🖼️ {p.laminas.length} láminas: {p.laminas.map((l: any) => l.texto).join(" | ")}</div>
                )}
                <div style={{ color: "#666", marginTop: "4px", fontSize: "11px" }}>🎨 {p.promptVisual}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}