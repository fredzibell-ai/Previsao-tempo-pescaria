import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const fmt = (d) => (d ? format(d, "dd/MM/yy", { locale: ptBR }) : "--/--/--");
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export default function DateRangePicker({ range, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const boxRef = useRef(null);

  const today = startOfDay(new Date());
  const minDate = new Date(today); minDate.setDate(minDate.getDate() - 90);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 15);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    setOpen((o) => {
      if (!o) setDraft(range);
      return !o;
    });
  };

  const applyPreset = (days) => {
    const from = today;
    const to = new Date(today); to.setDate(to.getDate() + (days - 1));
    const r = { from, to };
    setDraft(r);
    onApply(r);
    setOpen(false);
  };

  const confirm = () => {
    if (draft?.from && draft?.to) {
      onApply(draft);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        data-testid="daterange-trigger"
        onClick={toggle}
        className="flex items-center gap-3 border border-border bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-secondary"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
        <span className="text-foreground">{fmt(range?.from)}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">{fmt(range?.to)}</span>
      </button>

      {open && (
        <div
          data-testid="daterange-popover"
          className="absolute right-0 top-full z-[60] mt-2 w-auto border border-border bg-white shadow-xl"
        >
          <div className="border-b border-border p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Início</p>
                <p className="mt-1 font-mono text-lg text-foreground" data-testid="daterange-start-label">{fmt(draft?.from)}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Fim</p>
                <p className="mt-1 font-mono text-lg text-foreground" data-testid="daterange-end-label">{fmt(draft?.to)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button data-testid="preset-today" onClick={() => applyPreset(1)} className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-primary hover:text-primary-foreground">Hoje</button>
              <button data-testid="preset-7d" onClick={() => applyPreset(7)} className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-primary hover:text-primary-foreground">Próx. 7 dias</button>
              <button data-testid="preset-14d" onClick={() => applyPreset(14)} className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-primary hover:text-primary-foreground">Próx. 14 dias</button>
            </div>
          </div>
          <Calendar
            mode="range"
            locale={ptBR}
            numberOfMonths={2}
            selected={draft}
            onSelect={setDraft}
            defaultMonth={range?.from}
            disabled={{ before: minDate, after: maxDate }}
          />
          <div className="flex items-center justify-between border-t border-border p-3">
            <p className="font-mono text-[10px] text-muted-foreground">Até 16 dias à frente</p>
            <button
              data-testid="daterange-apply"
              onClick={confirm}
              disabled={!draft?.from || !draft?.to}
              className="bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:bg-[hsl(204_100%_23%)] disabled:opacity-40"
            >
              Aplicar período
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
