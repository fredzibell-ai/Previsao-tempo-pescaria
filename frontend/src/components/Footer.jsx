import { Anchor } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-4 py-14 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Anchor className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <span className="font-serif text-3xl">Maré Alta</span>
            </div>
            <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-background/70">
              Previsão para pescadores de mar aberto, beira de praia, rios da bacia amazônica
              e mato-grossense e barragens de São Paulo.
            </p>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-background/60">
            <p>Fontes de dados:</p>
            <p className="mt-2 text-background">Open-Meteo (previsão & marinha)</p>
            <p className="text-background">Windy.com (mapa animado)</p>
          </div>
        </div>
        <div className="mt-10 border-t border-background/20 pt-6 font-mono text-[11px] text-background/50">
          Marés e solunar são estimativas astronômicas. Verifique tábuas oficiais e a Marinha antes de navegar.
        </div>
      </div>
    </footer>
  );
}
