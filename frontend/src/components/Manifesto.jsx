import { motion } from "framer-motion";

const CHAPTERS = [
  {
    n: "01",
    title: "O Vento",
    body: "Direção e velocidade em km/h definem se o barco fica firme e onde o peixe se abriga. Ventos de proa levantam ondulação; ventos de terra costumam limpar a água. Acompanhe também as rajadas.",
  },
  {
    n: "02",
    title: "A Pressão",
    body: "A pressão atmosférica é o pulso do tempo. Pressão em queda anuncia frentes e agita a alimentação dos peixes; pressão alta e estável traz céu limpo e mordidas mais tímidas.",
  },
  {
    n: "03",
    title: "A Maré & a Lua",
    body: "A força da maré segue a lua. Nas marés de sizígia (lua nova e cheia) a correnteza é forte e a atividade sobe. Os períodos solunares apontam as melhores janelas do dia.",
  },
  {
    n: "04",
    title: "O Rio & a Barragem",
    body: "Na Amazônia, no Pantanal e nas represas de São Paulo, o que manda é chuva, nível e temperatura da água. Aqui a previsão terrestre e a lua guiam a pescaria.",
  },
];

const RIVER_IMG = "https://images.pexels.com/photos/17025853/pexels-photo-17025853.jpeg?auto=compress&cs=tinysrgb&w=1200";

export default function Manifesto() {
  return (
    <section data-testid="manifesto-section" className="border-t border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-primary">Como ler o tempo</p>
            <h2 className="font-serif text-4xl leading-none tracking-tight text-foreground md:text-6xl">
              Quatro sinais que todo pescador precisa ler antes de sair.
            </h2>
            <div className="mt-8 overflow-hidden border border-border">
              <img src={RIVER_IMG} alt="Rio da Amazônia" className="aspect-[16/10] w-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="divide-y divide-border border-y border-border">
              {CHAPTERS.map((c, i) => (
                <motion.div
                  key={c.n}
                  data-testid={`chapter-${c.n}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                  className="flex gap-6 py-6"
                >
                  <span className="font-serif text-3xl italic text-accent">{c.n}</span>
                  <div>
                    <h3 className="font-serif text-2xl tracking-tight text-foreground">{c.title}</h3>
                    <p className="mt-2 font-mono text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
