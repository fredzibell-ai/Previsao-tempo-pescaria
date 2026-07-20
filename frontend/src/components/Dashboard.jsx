import { motion } from "framer-motion";
import { MapPin, Loader2, RefreshCw, Layers } from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import DailyDetails from "@/components/DailyDetails";
import {
  WindCard, PressureCard, ConditionCard, WaveCard, TideCard,
  SolunarCard, MoonCard, HourlyStrip, DailyCard, BestDayCard, Card,
} from "@/components/WeatherCards";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

function WindyMap({ lat, lon }) {
  const src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=7&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
  return (
    <Card testId="windy-map-card" span="md:col-span-4 lg:col-span-8" className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mapa animado — Windy (vento em km/h)</p>
        </div>
      </div>
      <div className="windy-frame h-[420px] w-full md:h-[520px]">
        <iframe title="Windy Map" data-testid="windy-iframe" src={src} loading="lazy" />
      </div>
    </Card>
  );
}

export default function Dashboard({ location, weather, loading, error, range, onRangeChange, onRetry }) {
  return (
    <section data-testid="dashboard-section" className="border-t border-border bg-background py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Painel de previsão</p>
            <h2 className="mt-2 flex items-center gap-3 font-serif text-4xl tracking-tight text-foreground md:text-6xl">
              <MapPin className="h-7 w-7 text-accent" /> {location?.name}
            </h2>
            {location?.region && <p className="mt-1 font-mono text-sm text-muted-foreground">{location.region}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker range={range} onApply={onRangeChange} />
            <button
              data-testid="refresh-btn"
              onClick={onRetry}
              className="flex items-center gap-2 border border-border bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
          </div>
        </div>

        {loading && !weather && (
          <div className="flex items-center justify-center gap-3 border border-border bg-card py-24 font-mono text-sm text-muted-foreground" data-testid="loading-state">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando previsão...
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 border border-accent bg-card py-16 font-mono text-sm" data-testid="error-state">
            <p className="text-accent">{error}</p>
            <button onClick={onRetry} className="border border-border px-4 py-2 uppercase tracking-widest hover:bg-secondary">Tentar novamente</button>
          </div>
        )}

        {weather && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 items-start gap-4 md:grid-cols-4 lg:grid-cols-8 md:gap-5"
          >
            <WindCard cur={weather.current} />
            <PressureCard cur={weather.current} hourly={weather.hourly} />
            <ConditionCard cur={weather.current} daily={weather.daily} />
            <MoonCard moon={weather.solunar?.moon} daily={weather.daily} />
            <BestDayCard fishing={weather.fishing} />
            <WindyMap lat={weather.lat} lon={weather.lon} />
            <WaveCard marine={weather.marine_current} available={weather.marine_available} />
            <SolunarCard solunar={weather.solunar} />
            <TideCard tides={weather.tides} />
            <HourlyStrip hourly={weather.hourly} />
            <DailyCard daily={weather.daily} period={weather.period} />
          </motion.div>
        )}

        {weather && (
          <DailyDetails details={weather.daily_details} period={weather.period} />
        )}
      </div>
    </section>
  );
}
