import { motion } from "framer-motion";
import { Waves, Fish, Moon, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { degToCompass, fmtDay } from "@/lib/weather";

function OceanBlock({ marine, status }) {
  if (!marine) {
    const msg = status === "beyond_horizon"
      ? "Fora do horizonte marítimo (~7 dias à frente)."
      : "Sem dados marítimos (rio / interior).";
    return (
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ondas &amp; Mar</p>
          <Waves className="h-4 w-4 text-primary" />
        </div>
        <p className="mt-6 font-mono text-sm text-muted-foreground">{msg}</p>
      </div>
    );
  }
  const row = (k, v, u) => (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="font-mono text-xs text-muted-foreground">{k}</span>
      <span className="font-mono text-sm text-foreground">{v ?? "--"} {u}</span>
    </div>
  );
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ondas &amp; Mar</p>
        <Waves className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-mono text-3xl tracking-tight text-foreground">
        {marine.wave_height != null ? marine.wave_height.toFixed(1) : "--"}<span className="ml-1 text-sm text-muted-foreground">m</span>
      </p>
      <div className="mt-3">
        {row("Período", marine.wave_period, "s")}
        {row("Direção", degToCompass(marine.wave_direction), "")}
        {row("Marulho (swell)", marine.swell_wave_height != null ? marine.swell_wave_height.toFixed(1) : "--", "m")}
        {row("Temp. da água", marine.sea_surface_temperature != null ? marine.sea_surface_temperature.toFixed(1) : "--", "°C")}
      </div>
    </div>
  );
}

function SolunarBlock({ solunar }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Solunar — melhores horários</p>
        <Fish className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-serif text-2xl italic text-foreground">Atividade {solunar?.rating}</p>
      <div className="mt-3 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Períodos maiores</p>
          {(solunar?.major || []).map((p, i) => (
            <p key={i} className="font-mono text-sm text-foreground">{p.start} – {p.end} <span className="text-muted-foreground">· {p.label}</span></p>
          ))}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Períodos menores</p>
          {(solunar?.minor || []).map((p, i) => (
            <p key={i} className="font-mono text-sm text-foreground">{p.start} – {p.end} <span className="text-muted-foreground">· {p.label}</span></p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TideBlock({ tides }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Marés (estimativa)</p>
        <Waves className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3">
        {(tides?.events || []).map((e, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border py-2 last:border-0">
            <span className="flex items-center gap-2 font-mono text-sm">
              {e.type === "alta" ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <ArrowDownRight className="h-4 w-4 text-accent" />}
              {e.type === "alta" ? "Preamar" : "Baixa-mar"}
            </span>
            <span className="font-mono text-sm text-foreground">{e.time}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{tides?.type_note}</p>
    </div>
  );
}

export default function DailyDetails({ details, period }) {
  if (!details?.length) return null;
  const title = period ? `Detalhes por dia · ${period.days} dia${period.days > 1 ? "s" : ""}` : "Detalhes por dia do período";
  return (
    <section data-testid="daily-details-section" className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <Clock className="h-5 w-5 text-accent" />
        <h3 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">{title}</h3>
      </div>
      <div className="space-y-4">
        {details.map((d, i) => (
          <motion.div
            key={d.date}
            data-testid={`detail-day-${i}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border border-border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary px-5 py-3">
              <span className="font-serif text-2xl italic text-foreground" data-testid={`detail-day-date-${i}`}>{fmtDay(d.date)}</span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Moon className="h-3.5 w-3.5" /> {d.solunar?.moon?.phase_name} · {d.solunar?.moon?.illumination}%
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
              <OceanBlock marine={d.marine} status={d.marine_status} />
              <SolunarBlock solunar={d.solunar} />
              <TideBlock tides={d.tides} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
