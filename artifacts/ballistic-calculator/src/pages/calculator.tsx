import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/layout";
import { TrajectoryChart } from "@/components/trajectory-chart";
import { useCalculatorMutation, useProfiles } from "@/hooks/use-ballistics";
import { Activity, Wind, Mountain, Layers, Target, ChevronRight, Loader2, Save } from "lucide-react";
import type { CalculationInput, CalculationResult } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

const DEFAULT_INPUTS: CalculationInput = {
  muzzleVelocity: 2710,
  ballisticCoefficient: 0.301,
  bcModel: "G7",
  bulletWeight: 140,
  bulletDiameter: 0.264,
  zeroRange: 100,
  scopeHeight: 1.5,
  maxRange: 1000,
  rangeStep: 50,
  windSpeed: 10,
  windAngle: 90,
  temperature: 59,
  altitude: 0,
  humidity: 50,
  pressure: 29.92,
  targetAngle: 0,
  unitSystem: "imperial"
};

export default function Calculator() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"profile" | "environment">("profile");
  const [resultTab, setResultTab] = useState<"table" | "chart">("table");
  const [result, setResult] = useState<CalculationResult | null>(null);
  
  const { data: profiles } = useProfiles();
  const calcMutation = useCalculatorMutation();

  const form = useForm<CalculationInput>({
    defaultValues: DEFAULT_INPUTS
  });

  const selectedProfileId = form.watch("profileId");
  
  useEffect(() => {
    if (selectedProfileId && profiles) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile) {
        form.reset({
          ...form.getValues(),
          muzzleVelocity: profile.muzzleVelocity,
          ballisticCoefficient: profile.ballisticCoefficient,
          bcModel: profile.bcModel,
          bulletWeight: profile.bulletWeight,
          bulletDiameter: profile.bulletDiameter,
          zeroRange: profile.zeroRange,
          scopeHeight: profile.scopeHeight
        });
        toast({
          title: t.calculator.profileLoaded,
          description: `${t.calculator.profileLoadedDesc} ${profile.name}`,
        });
      }
    }
  }, [selectedProfileId, profiles, form, toast, t]);

  const onSubmit = (data: CalculationInput) => {
    calcMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          setResult(res);
        },
        onError: () => {
          toast({
            title: t.calculator.calcFailed,
            description: t.calculator.calcFailedDesc,
            variant: "destructive"
          });
        }
      }
    );
  };

  const InputField = ({ label, name, step = "any" }: { label: string, name: Extract<keyof CalculationInput, string>, step?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type="number"
        step={step}
        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
        {...form.register(name, { valueAsNumber: true })}
      />
    </div>
  );

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="font-display font-bold tracking-widest uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {t.calculator.parameters}
              </h2>
            </div>
            
            <div className="flex border-b border-border">
              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors ${activeTab === "profile" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                {t.calculator.rifleAmmo}
              </button>
              <button 
                onClick={() => setActiveTab("environment")}
                className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors ${activeTab === "environment" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50"}`}
              >
                {t.calculator.environment}
              </button>
            </div>

            <form id="calc-form" onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-6">
              
              {/* PROFILE TAB */}
              <div className={activeTab === "profile" ? "block space-y-5" : "hidden"}>
                <div className="space-y-1.5">
                  <label className="text-xs font-display font-semibold text-primary uppercase tracking-wider">{t.calculator.loadProfile}</label>
                  <select 
                    className="w-full bg-zinc-950/80 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-all appearance-none"
                    {...form.register("profileId", { valueAsNumber: true })}
                  >
                    <option value="">{t.calculator.manualEntry}</option>
                    {profiles?.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.caliber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <InputField label={t.calculator.bulletWeight} name="bulletWeight" />
                  <InputField label={t.calculator.diameter} name="bulletDiameter" />
                  <InputField label={t.calculator.muzzleVel} name="muzzleVelocity" />
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{t.calculator.bcModel}</label>
                    <select 
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      {...form.register("bcModel")}
                    >
                      <option value="G1">G1</option>
                      <option value="G7">G7</option>
                    </select>
                  </div>
                  <InputField label={t.calculator.ballisticCoeff} name="ballisticCoefficient" step="0.001" />
                  <InputField label={t.calculator.zeroRange} name="zeroRange" />
                  <InputField label={t.calculator.scopeHeight} name="scopeHeight" step="0.1" />
                </div>
              </div>

              {/* ENVIRONMENT TAB */}
              <div className={activeTab === "environment" ? "block space-y-5" : "hidden"}>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t.calculator.windSpeed} name="windSpeed" />
                  <InputField label={t.calculator.windAngle} name="windAngle" />
                  <InputField label={t.calculator.temperature} name="temperature" />
                  <InputField label={t.calculator.altitude} name="altitude" />
                  <InputField label={t.calculator.pressure} name="pressure" step="0.01" />
                  <InputField label={t.calculator.humidity} name="humidity" />
                  <InputField label={t.calculator.targetAngle} name="targetAngle" />
                </div>
              </div>

              {/* RANGE SETTINGS */}
              <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                 <InputField label={t.calculator.maxRange} name="maxRange" />
                 <InputField label={t.calculator.stepSize} name="rangeStep" />
              </div>

            </form>
          </div>

          <button 
            type="submit" 
            form="calc-form"
            disabled={calcMutation.isPending}
            className="w-full py-4 rounded-xl font-display font-bold text-lg tracking-widest uppercase bg-gradient-to-b from-primary to-[#d98500] text-[#111] shadow-[0_0_20px_rgba(255,157,0,0.2)] hover:shadow-[0_0_30px_rgba(255,157,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {calcMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
            {calcMutation.isPending ? t.calculator.computing : t.calculator.calculate}
          </button>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-8 space-y-6">
          
          {!result ? (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card/30 text-muted-foreground p-8 text-center">
              <Target className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="font-display text-xl uppercase tracking-widest mb-2">{t.calculator.awaitingParameters}</h3>
              <p className="max-w-md text-sm">{t.calculator.awaitingDesc}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.calculator.maxRangeLabel}</span>
                  <span className="text-2xl font-mono text-foreground">{result.maxRange} <span className="text-sm text-muted-foreground">yd</span></span>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.calculator.zero}</span>
                  <span className="text-2xl font-mono text-foreground">{result.zeroRange} <span className="text-sm text-muted-foreground">yd</span></span>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.calculator.pbr}</span>
                  <span className="text-2xl font-mono text-primary">{result.pointBlankRange} <span className="text-sm text-primary/70">yd</span></span>
                </div>
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-1">{t.calculator.supersonicLimit}</span>
                  <span className="text-2xl font-mono text-foreground">{result.supersonicLimit} <span className="text-sm text-muted-foreground">yd</span></span>
                </div>
              </div>

              {/* Data View */}
              <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
                <div className="flex border-b border-border bg-muted/20">
                  <button 
                    onClick={() => setResultTab("table")}
                    className={`px-6 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors ${resultTab === "table" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {t.calculator.dataTable}
                  </button>
                  <button 
                    onClick={() => setResultTab("chart")}
                    className={`px-6 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors ${resultTab === "chart" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {t.calculator.dropCurve}
                  </button>
                </div>
                
                <div className="p-0">
                  {resultTab === "table" ? (
                    <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-950/80 text-muted-foreground sticky top-0 z-10 font-display text-xs uppercase tracking-widest shadow-sm">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-left">{t.calculator.range}<br/><span className="text-[10px] opacity-70">YD</span></th>
                            <th className="px-4 py-3 font-semibold">{t.calculator.drop}<br/><span className="text-[10px] opacity-70">IN</span></th>
                            <th className="px-4 py-3 font-semibold text-primary">{t.calculator.drop}<br/><span className="text-[10px] opacity-70">MOA</span></th>
                            <th className="px-4 py-3 font-semibold">{t.calculator.wind}<br/><span className="text-[10px] opacity-70">IN</span></th>
                            <th className="px-4 py-3 font-semibold text-primary">{t.calculator.wind}<br/><span className="text-[10px] opacity-70">MOA</span></th>
                            <th className="px-4 py-3 font-semibold">{t.calculator.velocity}<br/><span className="text-[10px] opacity-70">FPS</span></th>
                            <th className="px-4 py-3 font-semibold">{t.calculator.energy}<br/><span className="text-[10px] opacity-70">FT-LB</span></th>
                            <th className="px-4 py-3 font-semibold">{t.calculator.time}<br/><span className="text-[10px] opacity-70">SEC</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 bg-card">
                          {result.trajectory.map((pt, i) => (
                            <tr key={i} className="hover:bg-zinc-800/50 transition-colors font-mono">
                              <td className="px-4 py-2.5 text-left text-foreground font-semibold">{pt.range}</td>
                              <td className="px-4 py-2.5 text-red-400/90">{pt.drop.toFixed(1)}</td>
                              <td className="px-4 py-2.5 text-primary font-bold">{pt.dropMOA.toFixed(1)}</td>
                              <td className="px-4 py-2.5 text-blue-400/90">{pt.windDrift.toFixed(1)}</td>
                              <td className="px-4 py-2.5 text-primary font-bold">{pt.windMOA.toFixed(1)}</td>
                              <td className={`px-4 py-2.5 ${pt.velocity < 1125 ? 'text-red-400/70' : 'text-zinc-300'}`}>{pt.velocity.toFixed(0)}</td>
                              <td className="px-4 py-2.5 text-zinc-400">{pt.energy.toFixed(0)}</td>
                              <td className="px-4 py-2.5 text-zinc-500">{pt.timeOfFlight.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4">
                      <TrajectoryChart data={result.trajectory} />
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
