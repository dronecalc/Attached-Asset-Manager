import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { useLanguage } from "@/contexts/language-context";
import {
  ALL_DRONES,
  CATEGORY_LABELS,
  COUNTRY_FLAGS,
  type DroneCategory,
  type DroneSpec,
} from "@/lib/droneDatabase";
import { Bot, Search, Filter } from "lucide-react";

const CATEGORIES: DroneCategory[] = [
  "fpv-attack",
  "isr-multirotor",
  "isr-fixed",
  "male",
];

function StatCell({ value, unit }: { value?: number | string; unit?: string }) {
  if (value == null || value === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span>
      {value}
      {unit && <span className="text-muted-foreground text-xs ml-0.5">{unit}</span>}
    </span>
  );
}

function DroneRow({ drone, lang }: { drone: DroneSpec; lang: "en" | "ua" }) {
  const flag = COUNTRY_FLAGS[drone.country] ?? "🏳";
  const catLabel = CATEGORY_LABELS[drone.category][lang];

  const flightDisplay =
    drone.flightTimeMin != null
      ? drone.flightTimeMin >= 60
        ? `${(drone.flightTimeMin / 60).toFixed(1)} год`
        : `${drone.flightTimeMin} хв`
      : undefined;

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors text-sm">
      <td className="px-3 py-3 font-semibold font-mono whitespace-nowrap">
        {flag} {drone.name}
      </td>
      <td className="px-3 py-3 text-muted-foreground text-xs">{drone.manufacturer}</td>
      <td className="px-3 py-3">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            drone.category === "fpv-attack"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : drone.category === "isr-multirotor"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : drone.category === "isr-fixed"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          }`}
        >
          {catLabel}
        </span>
      </td>
      <td className="px-3 py-3 text-right font-mono">
        <StatCell value={drone.massKg} unit="кг" />
      </td>
      <td className="px-3 py-3 text-right font-mono">
        <StatCell value={drone.payloadKg} unit="кг" />
      </td>
      <td className="px-3 py-3 text-right font-mono whitespace-nowrap">
        <StatCell value={flightDisplay} />
      </td>
      <td className="px-3 py-3 text-right font-mono">
        <StatCell value={drone.rangeKm} unit="км" />
      </td>
      <td className="px-3 py-3 text-right font-mono">
        <StatCell value={drone.maxSpeedKmh} unit="км/г" />
      </td>
      <td className="px-3 py-3 text-right font-mono">
        <StatCell value={drone.maxAltM} unit="м" />
      </td>
      <td className="px-3 py-3 text-center text-xs font-mono">
        <StatCell value={drone.controlFreqMhz} />
      </td>
      <td className="px-3 py-3 text-muted-foreground text-xs max-w-[180px] truncate">
        {drone.gnss ?? drone.camera ?? "—"}
      </td>
    </tr>
  );
}

export default function Drones() {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DroneCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_DRONES.filter((d) => {
      const matchCat = selectedCategory === "all" || d.category === selectedCategory;
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const lang = language as "en" | "ua";

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl tracking-widest uppercase text-primary">
            {t.drones.title}
          </h1>
          <p className="text-muted-foreground text-sm">{t.drones.subtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t.drones.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(255,157,0,0.3)]"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all"
                ? t.drones.all
                : CATEGORY_LABELS[cat][lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {[
                t.drones.colName,
                t.drones.colMfr,
                t.drones.colCategory,
                t.drones.colMass,
                t.drones.colPayload,
                t.drones.colFlight,
                t.drones.colRange,
                t.drones.colSpeed,
                t.drones.colAlt,
                t.drones.colFreq,
                t.drones.colGnssCamera,
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-display uppercase tracking-widest text-xs text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-muted-foreground">
                  {t.drones.noResults}
                </td>
              </tr>
            ) : (
              filtered.map((drone) => (
                <DroneRow key={drone.id} drone={drone} lang={lang} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer — source note */}
      <p className="mt-4 text-xs text-muted-foreground">
        {t.drones.sourceNote} ·{" "}
        <span className="font-mono">{filtered.length}</span> {t.drones.records}
      </p>
    </Layout>
  );
}
