import { useEffect, useRef, useState, useCallback } from "react";
import "@/App.css";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { toast } from "sonner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import Manifesto from "@/components/Manifesto";
import MarqueeBar from "@/components/MarqueeBar";
import Footer from "@/components/Footer";
import { fetchWeather } from "@/lib/weather";
import { format } from "date-fns";

const FAV_KEY = "mare_alta_favorites";
const iso = (d) => format(d, "yyyy-MM-dd");
const initialRange = () => {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date(from); to.setDate(to.getDate() + 6);
  return { from, to };
};

function App() {
  const [location, setLocation] = useState({
    id: "rs-balneario-mostardense",
    name: "Balneário Mostardense",
    region: "Rio Grande do Sul",
    category: "praia",
    lat: -31.2394,
    lon: -50.9053,
  });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [range, setRange] = useState(initialRange);
  const dashRef = useRef(null);
  const reqIdRef = useRef(0);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      setFavorites(saved);
    } catch {
      setFavorites([]);
    }
  }, []);

  const loadWeather = useCallback(async (loc, rng) => {
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    const isMarine = loc.category !== "rio" && loc.category !== "barragem";
    const startD = rng?.from ? iso(rng.from) : null;
    const endD = rng?.to ? iso(rng.to) : null;
    try {
      const data = await fetchWeather(loc.lat, loc.lon, isMarine, startD, endD);
      if (myReq === reqIdRef.current) setWeather(data);
    } catch (e) {
      if (myReq === reqIdRef.current) {
        setError("Não foi possível carregar a previsão. Tente novamente.");
        toast.error("Erro ao carregar previsão");
      }
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(location, range);
  }, [location, range, loadWeather]);

  const handleSelect = (loc) => {
    setLocation(loc);
    if (dashRef.current) {
      window.__lenis?.scrollTo(dashRef.current, { offset: -80 });
    }
  };

  const isFav = favorites.some((f) => f.id === location.id);
  const toggleFav = () => {
    let next;
    if (isFav) {
      next = favorites.filter((f) => f.id !== location.id);
      toast("Local removido dos favoritos");
    } else {
      next = [...favorites, location];
      toast.success("Local salvo nos favoritos");
    }
    setFavorites(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  };

  return (
    <div className="App min-h-screen bg-background text-foreground noise-overlay">
      <Toaster position="top-center" richColors />
      <Header
        onSelect={handleSelect}
        favorites={favorites}
        current={location}
        isFav={isFav}
        onToggleFav={toggleFav}
      />
      <main>
        <Hero location={location} weather={weather} onExplore={() => window.__lenis?.scrollTo(dashRef.current, { offset: -80 })} />
        <MarqueeBar />
        <div ref={dashRef}>
          <Dashboard
            location={location}
            weather={weather}
            loading={loading}
            error={error}
            range={range}
            onRangeChange={setRange}
            onRetry={() => loadWeather(location, range)}
          />
        </div>
        <Manifesto />
      </main>
      <Footer />
    </div>
  );
}

export default App;
