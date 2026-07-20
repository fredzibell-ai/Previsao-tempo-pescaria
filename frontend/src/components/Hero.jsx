import { motion } from "framer-motion";
import { ArrowDown, Wind, Gauge } from "lucide-react";
import { degToCompass } from "@/lib/weather";

const lineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.12 },
  }),
};

const HERO_IMG =
  "https://images.pexels.com/photos/1043491/pexels-photo-1043491.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

function Line({ children, i }) {
  return (
    <span className="block overflow-hidden">
      <motion.span variants={lineReveal} custom={i} initial="hidden" animate="show" className="block">
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({ location, weather, onExplore }) {
  const cur = weather?.current;
  return (
    <section data-testid="hero-section" className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary"
          >
            Previsão marítima & fluvial — Open-Meteo × Windy
          </motion.p>
          <h1 className="font-serif text-5xl font-medium tracking-hero text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            <Line i={0}>Leia o céu.</Line>
            <Line i={1}>
              Sinta a <span className="italic text-primary">maré.</span>
            </Line>
            <Line i={2}>Pesque certo.</Line>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            Vento em km/h, pressão atmosférica, ondas, marés e os melhores horários solunares
            para o mar aberto, a beira da praia, os rios da Amazônia e as barragens de São Paulo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-explore-btn"
              onClick={onExplore}
              className="group flex items-center gap-2 bg-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-[hsl(204_100%_23%)]"
            >
              Ver previsão de {location?.name}
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        </div>

        {/* Hero card / image */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:col-span-5"
        >
          <div className="relative aspect-[4/5] overflow-hidden border border-border">
            <img src={HERO_IMG} alt="Pescador ao amanhecer" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-white/10" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/30 bg-white/70 p-4 backdrop-blur-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Agora em {location?.name}</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-primary" />
                  <span className="font-mono text-3xl tracking-tight">
                    {cur ? Math.round(cur.wind_speed_10m) : "--"}
                    <span className="text-sm text-muted-foreground"> km/h {degToCompass(cur?.wind_direction_10m)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  <span className="font-mono text-2xl tracking-tight">
                    {cur ? Math.round(cur.surface_pressure) : "--"}
                    <span className="text-sm text-muted-foreground"> hPa</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
