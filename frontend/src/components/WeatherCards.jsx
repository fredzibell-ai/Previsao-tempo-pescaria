import { motion } from "framer-motion";
import {
  Wind, Gauge, ArrowUp, ArrowDown, Minus, Waves, Thermometer, Droplets,
  Sun, Cloud, CloudSun, CloudRain, CloudRainWind, CloudDrizzle, CloudSnow,
  CloudFog, CloudLightning, Moon, Fish, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { degToCompass, weatherCodeMap, fmtDay, fmtHour, pressureTrend, currentHourIndex } from "@/lib/weather";

const ICONS = {
  sun: Sun, cloud: Cloud, "cloud-sun": CloudSun, "cloud-rain": CloudRain,
  "cloud-rain-wind": CloudRainWind, "cloud-drizzle": CloudDrizzle,
  "cloud-snow": CloudSnow, "cloud-fog": CloudFog, "cloud-lightning": CloudLightning,
};

export const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function Card({ children, className = "", testId, span = "" }) {
  return (
    <motion.div
      variants={cardVariants}
      data-testid={testId}
      className={`border border-border bg-card p-5 md:p-6 ${span} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Label({ children }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{children}</p>;
}

export function WindCard({ cur }) {
  const deg = cur?.wind_direction_10m ?? 0;
  return (
    <Card testId="wind-card" span="md:col-span-2">
      <div className="flex items-center justify-between">
        <Label>Vento</Label>
        <Wind className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0 rounded-full border border-border">
          {["N", "L", "S", "O"].map((d, i) => (
            <span key={d} className="absolute font-mono text-[9px] text-muted-foreground"
              style={{
                top: i === 0 ? 2 : i === 2 ? "auto" : "50%",
                bottom: i === 2 ? 2 : "auto",
                left: i === 3 ? 4 : i === 1 ? "auto" : "50%",
                right: i === 1 ? 4 : "auto",
                transform: (i === 0 || i === 2) ? "translateX(-50%)" : "translateY(-50%)",
              }}>{d}</span>
          ))}
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
          <div className="absolute left-1/2 top-1/2 origin-bottom" style={{ transform: `translate(-50%,-100%) rotate(${deg}deg)`, height: "38px" }}>
            <div className="mx-auto h-0 w-0 border-x-[5px] border-b-[12px] border-x-transparent border-b-accent" />
            <div className="mx-auto h-7 w-[2px] bg-accent" />
          </div>
        </div>
        <div>
          <p className="font-mono text-4xl tracking-tight text-foreground">
            {cur ? Math.round(cur.wind_speed_10m) : "--"}
            <span className="ml-1 text-base text-muted-foreground">km/h</span>
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">
            {degToCompass(deg)} · {deg ?? "--"}°
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Rajadas {cur ? Math.round(cur.wind_gusts_10m) : "--"} km/h
          </p>
        </div>
      </div>
    </Card>
  );
}

export function PressureCard({ cur, hourly }) {
  const trend = pressureTrend(hourly);
  const TrendIcon = trend.dir === "subindo" ? ArrowUp : trend.dir === "caindo" ? ArrowDown : Minus;
  const color = trend.dir === "caindo" ? "text-accent" : "text-primary";
  return (
    <Card testId="pressure-card" span="md:col-span-2">
      <div className="flex items-center justify-between">
        <Label>Pressão Atmosférica</Label>
        <Gauge className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-6 font-mono text-5xl tracking-tight text-foreground">
        {cur ? Math.round(cur.surface_pressure) : "--"}
        <span className="ml-1 text-base text-muted-foreground">hPa</span>
      </p>
      <div className={`mt-4 flex items-center gap-2 font-mono text-sm ${color}`}>
        <TrendIcon className="h-4 w-4" />
        <span className="capitalize">{trend.dir}</span>
        <span className="text-muted-foreground">({trend.diff > 0 ? "+" : ""}{trend.diff} hPa / 3h)</span>
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {trend.dir === "caindo" ? "Tempo instável — peixes ativos" : trend.dir === "subindo" ? "Tempo firmando" : "Tempo estável"}
      </p>
    </Card>
  );
}

export function ConditionCard({ cur, daily }) {
  const [label, icon] = weatherCodeMap(cur?.weather_code);
  const Icon = ICONS[icon] || Cloud;
  return (
    <Card testId="condition-card" span="md:col-span-2">
      <div className="flex items-center justify-between">
        <Label>Condição</Label>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-6 font-mono text-5xl tracking-tight text-foreground">
        {cur ? Math.round(cur.temperature_2m) : "--"}°
      </p>
      <p className="mt-2 font-serif text-xl italic text-foreground">{label}</p>
      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {cur?.relative_humidity_2m ?? "--"}%</span>
        <span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" /> Sensação {cur ? Math.round(cur.apparent_temperature) : "--"}°</span>
        <span className="flex items-center gap-1"><CloudRain className="h-3.5 w-3.5" /> {cur?.precipitation ?? 0} mm</span>
      </div>
      {daily?.uv_index_max && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">UV máx hoje: {Math.round(daily.uv_index_max[0])}</p>
      )}
    </Card>
  );
}

export function WaveCard({ marine, available }) {
  if (!available) {
    return (
      <Card testId="wave-card" span="md:col-span-2">
        <div className="flex items-center justify-between"><Label>Ondas & Mar</Label><Waves className="h-4 w-4 text-primary" /></div>
        <p className="mt-6 font-mono text-sm text-muted-foreground">Sem dados marítimos para este ponto (rio / interior).</p>
      </Card>
    );
  }
  const row = (k, v, u) => (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="font-mono text-xs text-muted-foreground">{k}</span>
      <span className="font-mono text-sm text-foreground">{v ?? "--"} {u}</span>
    </div>
  );
  return (
    <Card testId="wave-card" span="md:col-span-2">
      <div className="flex items-center justify-between"><Label>Ondas & Mar</Label><Waves className="h-4 w-4 text-primary" /></div>
      <p className="mt-4 font-mono text-4xl tracking-tight text-foreground">
        {marine?.wave_height != null ? marine.wave_height.toFixed(1) : "--"}<span className="ml-1 text-base text-muted-foreground">m</span>
      </p>
      <div className="mt-4">
        {row("Período", marine?.wave_period != null ? marine.wave_period.toFixed(0) : "--", "s")}
        {row("Direção", degToCompass(marine?.wave_direction), "")}
        {row("Marulho (swell)", marine?.swell_wave_height != null ? marine.swell_wave_height.toFixed(1) : "--", "m")}
        {row("Temp. da água", marine?.sea_surface_temperature != null ? marine.sea_surface_temperature.toFixed(1) : "--", "°C")}
      </div>
    </Card>
  );
}

export function TideCard({ tides }) {
  return (
    <Card testId="tide-card" span="md:col-span-2">
      <div className="flex items-center justify-between"><Label>Marés (estimativa)</Label><Waves className="h-4 w-4 text-primary" /></div>
      <div className="mt-4">
        {(tides?.events || []).map((e, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border py-2 last:border-0" data-testid={`tide-event-${i}`}>
            <span className="flex items-center gap-2 font-mono text-sm">
              {e.type === "alta" ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <ArrowDownRight className="h-4 w-4 text-accent" />}
              {e.type === "alta" ? "Preamar" : "Baixa-mar"}
            </span>
            <span className="font-mono text-sm text-foreground">{e.time}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{tides?.type_note}</p>
    </Card>
  );
}

export function SolunarCard({ solunar }) {
  return (
    <Card testId="solunar-card" span="md:col-span-2">
      <div className="flex items-center justify-between"><Label>Solunar — melhores horários</Label><Fish className="h-4 w-4 text-primary" /></div>
      <p className="mt-4 font-serif text-3xl italic text-foreground">Atividade {solunar?.rating}</p>
      <div className="mt-4 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Períodos maiores</p>
          {(solunar?.major || []).map((p, i) => (
            <p key={i} className="font-mono text-sm text-foreground" data-testid={`solunar-major-${i}`}>{p.start} – {p.end} <span className="text-muted-foreground">· {p.label}</span></p>
          ))}
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Períodos menores</p>
          {(solunar?.minor || []).map((p, i) => (
            <p key={i} className="font-mono text-sm text-foreground" data-testid={`solunar-minor-${i}`}>{p.start} – {p.end} <span className="text-muted-foreground">· {p.label}</span></p>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function MoonCard({ moon, daily }) {
  const illum = moon?.illumination ?? 0;
  return (
    <Card testId="moon-card" span="md:col-span-2">
      <div className="flex items-center justify-between"><Label>Lua & Sol</Label><Moon className="h-4 w-4 text-primary" /></div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
          <div className="absolute inset-0 bg-foreground" style={{ clipPath: `inset(0 ${100 - illum}% 0 0)` }} />
        </div>
        <div>
          <p className="font-serif text-2xl italic text-foreground">{moon?.phase_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{illum}% iluminada · {moon?.age_days}d</p>
        </div>
      </div>
      {daily?.sunrise && (
        <div className="mt-4 flex gap-6 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-accent" /> {new Date(daily.sunrise[0]).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5" /> {new Date(daily.sunset[0]).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      )}
    </Card>
  );
}

export function HourlyStrip({ hourly }) {
  if (!hourly?.time) return null;
  const start = currentHourIndex(hourly.time);
  const idxs = Array.from({ length: 12 }, (_, k) => start + k).filter((i) => i < hourly.time.length);
  return (
    <Card testId="hourly-card" span="md:col-span-4 lg:col-span-8">
      <div className="flex items-center justify-between"><Label>Próximas horas</Label><Wind className="h-4 w-4 text-primary" /></div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {idxs.map((i) => {
          const [, icon] = weatherCodeMap(hourly.weather_code?.[i]);
          const Icon = ICONS[icon] || Cloud;
          return (
            <div key={i} className="flex min-w-[68px] flex-col items-center gap-1 border border-border p-2" data-testid={`hour-${i}`}>
              <span className="font-mono text-xs text-muted-foreground">{fmtHour(hourly.time[i])}</span>
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm text-foreground">{Math.round(hourly.temperature_2m[i])}°</span>
              <span className="font-mono text-[10px] text-muted-foreground">{Math.round(hourly.wind_speed_10m[i])}km/h</span>
              <span className="font-mono text-[10px] text-primary">{hourly.precipitation_probability?.[i] ?? 0}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function DailyCard({ daily }) {
  if (!daily?.time) return null;
  return (
    <Card testId="daily-card" span="md:col-span-4 lg:col-span-8">
      <div className="flex items-center justify-between"><Label>Próximos 7 dias</Label><Sun className="h-4 w-4 text-primary" /></div>
      <div className="mt-4 divide-y divide-border">
        {daily.time.map((d, i) => {
          const [label, icon] = weatherCodeMap(daily.weather_code[i]);
          const Icon = ICONS[icon] || Cloud;
          return (
            <div key={d} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 md:grid-cols-[1.2fr_2fr_1fr_1fr_1fr]" data-testid={`day-${i}`}>
              <span className="font-mono text-sm text-foreground">{fmtDay(d)}</span>
              <span className="hidden items-center gap-2 font-mono text-xs text-muted-foreground md:flex"><Icon className="h-4 w-4 text-primary" />{label}</span>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><Wind className="h-3 w-3" />{Math.round(daily.wind_speed_10m_max[i])}</span>
              <span className="flex items-center gap-1 font-mono text-xs text-primary"><CloudRain className="h-3 w-3" />{daily.precipitation_probability_max?.[i] ?? 0}%</span>
              <span className="text-right font-mono text-sm text-foreground">{Math.round(daily.temperature_2m_max[i])}° <span className="text-muted-foreground">{Math.round(daily.temperature_2m_min[i])}°</span></span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
