import { useState } from "react";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/layout";
import { useProfiles, useCreateProfileMutation, useDeleteProfileMutation, useUpdateProfileMutation } from "@/hooks/use-ballistics";
import { Database, Plus, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CreateProfileInput, Profile } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/language-context";

export default function Profiles() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: profiles, isLoading } = useProfiles();
  const createMutation = useCreateProfileMutation();
  const deleteMutation = useDeleteProfileMutation();
  const updateMutation = useUpdateProfileMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<CreateProfileInput>({
    defaultValues: {
      name: "",
      caliber: "",
      bulletWeight: 140,
      bulletDiameter: 0.264,
      muzzleVelocity: 2700,
      ballisticCoefficient: 0.3,
      bcModel: "G7",
      zeroRange: 100,
      scopeHeight: 1.5,
      rifleWeight: 10,
      notes: ""
    }
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditingId(profile.id);
    form.reset({
      name: profile.name,
      caliber: profile.caliber,
      bulletWeight: profile.bulletWeight,
      bulletDiameter: profile.bulletDiameter,
      muzzleVelocity: profile.muzzleVelocity,
      ballisticCoefficient: profile.ballisticCoefficient,
      bcModel: profile.bcModel,
      zeroRange: profile.zeroRange,
      scopeHeight: profile.scopeHeight,
      rifleWeight: profile.rifleWeight,
      notes: profile.notes
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`${t.profiles.deleteConfirm} "${name}"?`)) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => toast({ title: t.profiles.deleted }),
        onError: () => toast({ title: t.profiles.deleteFailed, variant: "destructive" })
      });
    }
  };

  const onSubmit = (data: CreateProfileInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data }, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast({ title: t.profiles.updated });
        },
        onError: () => toast({ title: t.profiles.updateFailed, variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast({ title: t.profiles.created });
        },
        onError: () => toast({ title: t.profiles.createFailed, variant: "destructive" })
      });
    }
  };

  const InputField = ({ label, name, step = "any", type = "number" }: { label: string, name: Extract<keyof CreateProfileInput, string>, step?: string, type?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        step={step}
        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
        {...form.register(name, type === "number" ? { valueAsNumber: true } : {})}
      />
    </div>
  );

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-foreground">{t.profiles.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.profiles.subtitle}</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold uppercase tracking-wider text-sm rounded-md shadow-[0_0_15px_rgba(255,157,0,0.2)] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.profiles.addProfile}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !profiles || profiles.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/30">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-lg uppercase tracking-widest text-muted-foreground mb-2">{t.profiles.noProfiles}</h3>
          <p className="text-sm text-zinc-500">{t.profiles.noProfilesDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wide text-foreground">{p.name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-mono mt-1">{p.caliber}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-zinc-400 hover:text-red-500 bg-zinc-800 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-6 pt-4 border-t border-border/50">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t.profiles.bullet}</div>
                  <div className="font-mono text-zinc-300">{p.bulletWeight}gr / {p.bulletDiameter}"</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t.profiles.muzzleVel}</div>
                  <div className="font-mono text-zinc-300">{p.muzzleVelocity} fps</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t.profiles.bcModel} ({p.bcModel})</div>
                  <div className="font-mono text-primary">{p.ballisticCoefficient.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{t.profiles.zero}</div>
                  <div className="font-mono text-zinc-300">{p.zeroRange} yd</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h2 className="font-display font-bold uppercase tracking-widest text-lg">
                {editingId ? t.profiles.editProfile : t.profiles.newProfile}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <InputField type="text" label={t.profiles.profileName} name="name" />
                <InputField type="text" label={t.profiles.caliber} name="caliber" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <InputField label={t.profiles.weight} name="bulletWeight" />
                <InputField label={t.profiles.diameter} name="bulletDiameter" />
                <InputField label={t.profiles.muzzleVelocity} name="muzzleVelocity" />
                
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
                <InputField label={t.profiles.ballisticCoeff} name="ballisticCoefficient" step="0.001" />
                <InputField label={t.profiles.zeroRange} name="zeroRange" />
                
                <InputField label={t.profiles.scopeHeight} name="scopeHeight" step="0.1" />
                <InputField label={t.profiles.rifleWeight} name="rifleWeight" step="0.1" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{t.profiles.notes}</label>
                <textarea
                  className="w-full h-20 bg-zinc-950/50 border border-zinc-800 rounded-md px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                  {...form.register("notes")}
                />
              </div>

            </form>
            
            <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-display font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
              >
                {t.profiles.cancel}
              </button>
              <button 
                type="submit"
                form="profile-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2 rounded-md text-sm font-display font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-[0_0_10px_rgba(255,157,0,0.2)] hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.profiles.saveProfile}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
