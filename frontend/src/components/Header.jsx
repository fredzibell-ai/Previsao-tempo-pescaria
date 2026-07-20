import { useState, useEffect, useRef } from "react";
import { Search, Star, MapPin, Anchor, ChevronDown, X, Loader2 } from "lucide-react";
import { geocode, fetchPresets } from "@/lib/weather";

const PRESET_GROUPS = [
  { key: "mar", label: "Mar Aberto / Litoral SP", regions: ["Litoral SP"] },
  { key: "amazonia", label: "Bacia Amazônica", regions: ["Bacia Amazônica"] },
  { key: "mt", label: "Mato Grosso", regions: ["Mato Grosso"] },
  { key: "barragem", label: "Barragens SP", regions: ["Barragens SP"] },
];

export default function Header({ onSelect, favorites, current, isFav, onToggleFav }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    fetchPresets().then(setPresets).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await geocode(query.trim());
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (loc) => {
    onSelect(loc);
    setQuery("");
    setResults([]);
    setOpen(false);
    setShowPresets(false);
    setShowFavs(false);
  };

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 w-full border-b border-border bg-white/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-2 pr-2" data-testid="brand-logo">
          <Anchor className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">Maré Alta</span>
        </div>

        {/* Search */}
        <div className="relative order-3 w-full flex-1 md:order-2 md:w-auto" ref={boxRef}>
          <div className="flex items-center gap-2 border border-border bg-white px-3 py-2">
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <input
              data-testid="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
              placeholder="Buscar cidade, praia ou rio..."
              className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button data-testid="clear-search" onClick={() => setQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {open && results.length > 0 && (
            <div
              data-testid="search-results"
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto border border-border bg-white shadow-lg"
            >
              {results.map((r) => (
                <button
                  key={r.id}
                  data-testid={`search-result-${r.id}`}
                  onClick={() => pick(r)}
                  className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left font-mono text-sm transition-colors last:border-0 hover:bg-secondary"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{r.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{r.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <div className="relative">
            <button
              data-testid="presets-toggle"
              onClick={() => { setShowPresets((s) => !s); setShowFavs(false); }}
              className="flex items-center gap-1.5 border border-border bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Locais <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPresets && (
              <div data-testid="presets-menu" className="absolute right-0 top-full z-50 mt-1 w-72 border border-border bg-white shadow-lg">
                {PRESET_GROUPS.map((g) => (
                  <div key={g.key} className="border-b border-border p-2 last:border-0">
                    <p className="px-1 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{g.label}</p>
                    {presets.filter((p) => g.regions.includes(p.region)).map((p) => (
                      <button
                        key={p.id}
                        data-testid={`preset-${p.id}`}
                        onClick={() => pick(p)}
                        className="block w-full px-1 py-1.5 text-left font-mono text-sm transition-colors hover:text-primary"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              data-testid="favorites-toggle"
              onClick={() => { setShowFavs((s) => !s); setShowPresets(false); }}
              className="flex items-center gap-1.5 border border-border bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Star className="h-3.5 w-3.5" /> {favorites.length}
            </button>
            {showFavs && (
              <div data-testid="favorites-menu" className="absolute right-0 top-full z-50 mt-1 w-64 border border-border bg-white shadow-lg">
                {favorites.length === 0 ? (
                  <p className="p-3 font-mono text-xs text-muted-foreground">Nenhum local salvo ainda.</p>
                ) : (
                  favorites.map((f) => (
                    <button
                      key={f.id}
                      data-testid={`fav-${f.id}`}
                      onClick={() => pick(f)}
                      className="block w-full border-b border-border px-3 py-2 text-left font-mono text-sm transition-colors last:border-0 hover:bg-secondary"
                    >
                      {f.name} <span className="text-xs text-muted-foreground">{f.region}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            data-testid="toggle-favorite"
            onClick={onToggleFav}
            title={isFav ? "Remover favorito" : "Salvar favorito"}
            className={`flex items-center gap-1.5 border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              isFav ? "border-accent bg-accent text-accent-foreground" : "border-border bg-white hover:bg-secondary"
            }`}
          >
            <Star className="h-3.5 w-3.5" fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </header>
  );
}
