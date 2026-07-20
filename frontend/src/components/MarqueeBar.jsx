import Marquee from "react-fast-marquee";

export default function MarqueeBar() {
  const items = [
    "PREVISÃO MARÍTIMA",
    "DADOS EM TEMPO REAL",
    "VENTO • PRESSÃO • ONDAS",
    "TÁBUA DE MARÉS",
    "PERÍODOS SOLUNARES",
    "MAR ABERTO & RIOS",
  ];
  return (
    <div data-testid="marquee-bar" className="border-y border-border bg-foreground py-4 text-background">
      <Marquee speed={40} gradient={false} autoFill>
        {items.map((t, i) => (
          <span key={i} className="mx-8 flex items-center gap-8 font-serif text-2xl italic md:text-3xl">
            {t}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
