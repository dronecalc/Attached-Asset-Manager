import { useState, useRef, useCallback, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, UploadCloud, Crosshair, Plus, Minus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HolePoint {
  x: number;
  y: number;
}

interface StoredHole {
  id: number;
  sessionId: number;
  x: number;
  y: number;
}

interface StoredSession {
  id: number;
  name: string;
  distanceYards: number;
  targetWidthInches: number;
  imageData: string;
  notes: string | null;
  holeCount: number;
  esInches: number | null;
  esMOA: number | null;
  mpiX: number | null;
  mpiY: number | null;
  createdAt: string;
  holes: StoredHole[];
}

// --- Bullet hole detection (connected components on thresholded grayscale) ---
function detectBulletHoles(imageData: ImageData, threshold: number): HolePoint[] {
  const { width, height, data } = imageData;
  const binary = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            sum += data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
            count++;
          }
        }
      }
      binary[y * width + x] = sum / count < threshold ? 1 : 0;
    }
  }

  const labels = new Int32Array(width * height);
  const parent: number[] = [0];
  let nextLabel = 1;

  function find(n: number): number {
    while (parent[n] !== n) {
      parent[n] = parent[parent[n]];
      n = parent[n];
    }
    return n;
  }
  function union(a: number, b: number) {
    a = find(a);
    b = find(b);
    if (a !== b) parent[b] = a;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!binary[idx]) continue;
      const L = x > 0 ? labels[idx - 1] : 0;
      const U = y > 0 ? labels[idx - width] : 0;
      if (!L && !U) {
        labels[idx] = nextLabel;
        parent.push(nextLabel);
        nextLabel++;
      } else if (L && !U) {
        labels[idx] = find(L);
      } else if (!L && U) {
        labels[idx] = find(U);
      } else {
        union(L, U);
        labels[idx] = find(L);
      }
    }
  }

  const comps = new Map<number, { sx: number; sy: number; n: number }>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lb = labels[y * width + x];
      if (!lb) continue;
      const r = find(lb);
      const c = comps.get(r) ?? { sx: 0, sy: 0, n: 0 };
      c.sx += x;
      c.sy += y;
      c.n++;
      comps.set(r, c);
    }
  }

  const totalPx = width * height;
  const minArea = Math.max(15, totalPx / 80000);
  const maxArea = totalPx / 40;
  const holes: HolePoint[] = [];
  for (const { sx, sy, n } of comps.values()) {
    if (n >= minArea && n <= maxArea) {
      holes.push({ x: sx / n / width, y: sy / n / height });
    }
  }
  return holes;
}

// --- Stats ---
function calcStats(holes: HolePoint[], widthIn: number, distYd: number) {
  if (holes.length < 2) return null;
  const mpiX = holes.reduce((s, h) => s + h.x, 0) / holes.length;
  const mpiY = holes.reduce((s, h) => s + h.y, 0) / holes.length;
  let es = 0;
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      const d = Math.hypot(holes[i].x - holes[j].x, holes[i].y - holes[j].y);
      if (d > es) es = d;
    }
  }
  const esIn = es * widthIn;
  const esMOA = distYd > 0 ? (esIn * 95.5) / distYd : 0;
  return { mpiX, mpiY, esIn, esMOA };
}

// --- Image helpers ---
async function loadImageForStorage(file: File, maxW = 800): Promise<{ dataUrl: string; objUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.75), objUrl });
    };
    img.src = objUrl;
  });
}

// --- API helpers ---
const API = "/api";

async function apiFetchSessions(): Promise<StoredSession[]> {
  const res = await fetch(`${API}/target-sessions`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

async function apiSaveSession(body: object): Promise<StoredSession> {
  const res = await fetch(`${API}/target-sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("save failed");
  return res.json();
}

async function apiDeleteSession(id: number): Promise<void> {
  await fetch(`${API}/target-sessions/${id}`, { method: "DELETE" });
}

// --- Main component ---
export default function Targets() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const [holes, setHoles] = useState<HolePoint[]>([]);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [threshold, setThreshold] = useState(80);
  const [detecting, setDetecting] = useState(false);

  const [sessionName, setSessionName] = useState("");
  const [distanceYards, setDistanceYards] = useState(100);
  const [targetWidthInches, setTargetWidthInches] = useState(8.27);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    apiFetchSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  const reloadSessions = useCallback(() => {
    apiFetchSessions().then(setSessions).catch(() => {});
  }, []);

  const processFile = useCallback(async (file: File) => {
    fileRef.current = file;
    if (objUrl) URL.revokeObjectURL(objUrl);
    const { dataUrl, objUrl: newObj } = await loadImageForStorage(file);
    setObjUrl(newObj);
    setImageData(dataUrl);
    setHoles([]);
    if (!sessionName) setSessionName(file.name.replace(/\.[^.]+$/, ""));
  }, [objUrl, sessionName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) processFile(file);
  };

  const handleDetect = async () => {
    if (!fileRef.current) return;
    setDetecting(true);
    await new Promise((r) => setTimeout(r, 10));
    try {
      await new Promise<void>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(fileRef.current!);
        img.onload = () => {
          const maxW = 600;
          const scale = Math.min(1, maxW / img.naturalWidth);
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          const imgData = ctx.getImageData(0, 0, w, h);
          setHoles(detectBulletHoles(imgData, threshold));
          resolve();
        };
        img.src = url;
      });
    } finally {
      setDetecting(false);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (mode === "add") {
      setHoles((h) => [...h, { x, y }]);
    } else {
      const RADIUS = 0.04;
      setHoles((h) => {
        const idx = h.findIndex((hole) => Math.hypot(hole.x - x, hole.y - y) < RADIUS);
        return idx === -1 ? h : h.filter((_, i) => i !== idx);
      });
    }
  };

  const stats = calcStats(holes, targetWidthInches, distanceYards);

  const handleSave = async () => {
    if (!imageData) {
      toast({ title: t.targets.noImage, variant: "destructive" });
      return;
    }
    if (holes.length === 0) {
      toast({ title: t.targets.noHoles, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiSaveSession({
        name: sessionName || "Session",
        distanceYards,
        targetWidthInches,
        imageData,
        notes: notes || null,
        holes,
        holeCount: holes.length,
        esInches: stats?.esIn ?? null,
        esMOA: stats?.esMOA ?? null,
        mpiX: stats?.mpiX ?? null,
        mpiY: stats?.mpiY ?? null,
      });
      toast({ title: t.targets.saved });
      reloadSessions();
      setHoles([]);
      setObjUrl(null);
      setImageData(null);
      setSessionName("");
      setNotes("");
      fileRef.current = null;
    } catch {
      toast({ title: t.targets.saveFailed, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteSession(id);
      toast({ title: t.targets.deleted });
      reloadSessions();
    } catch {
      toast({ title: t.targets.deleteFailed, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-widest text-primary uppercase">
            {t.targets.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.targets.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Image panel */}
          <div className="lg:col-span-3 space-y-4">
            {!objUrl ? (
              <div
                className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 py-20 cursor-pointer hover:border-primary/50 transition-colors bg-card/30"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <UploadCloud className="w-12 h-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-display text-sm uppercase tracking-widest text-foreground">
                    {t.targets.uploadPrompt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t.targets.uploadSub}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t.targets.uploadBtn}
                </Button>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border bg-black select-none">
                <img
                  src={objUrl}
                  alt="target"
                  className="w-full h-auto block"
                  draggable={false}
                />
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  onClick={handleSvgClick}
                  style={{ cursor: mode === "add" ? "crosshair" : "pointer" }}
                >
                  {stats && (
                    <>
                      <line
                        x1={stats.mpiX}
                        y1={stats.mpiY - 0.03}
                        x2={stats.mpiX}
                        y2={stats.mpiY + 0.03}
                        stroke="#f97316"
                        strokeWidth="0.003"
                      />
                      <line
                        x1={stats.mpiX - 0.03}
                        y1={stats.mpiY}
                        x2={stats.mpiX + 0.03}
                        y2={stats.mpiY}
                        stroke="#f97316"
                        strokeWidth="0.003"
                      />
                      <circle
                        cx={stats.mpiX}
                        cy={stats.mpiY}
                        r="0.008"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="0.003"
                      />
                    </>
                  )}
                  {holes.map((h, i) => (
                    <g key={i}>
                      <circle
                        cx={h.x}
                        cy={h.y}
                        r="0.02"
                        fill="rgba(239,68,68,0.25)"
                        stroke="#ef4444"
                        strokeWidth="0.004"
                      />
                      <circle cx={h.x} cy={h.y} r="0.005" fill="#ef4444" />
                      <text
                        x={h.x + 0.024}
                        y={h.y + 0.009}
                        fontSize="0.025"
                        fill="#ef4444"
                        fontFamily="monospace"
                      >
                        {i + 1}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Controls bar */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="w-4 h-4 mr-1.5" />
                {t.targets.uploadBtn}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetect}
                disabled={!objUrl || detecting}
              >
                <Zap className="w-4 h-4 mr-1.5" />
                {detecting ? t.targets.detecting : t.targets.detectBtn}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHoles([])}
                disabled={holes.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {t.targets.clearHoles}
              </Button>
              <Button
                variant={mode === "add" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode((m) => (m === "add" ? "remove" : "add"))}
              >
                {mode === "add" ? (
                  <Plus className="w-4 h-4 mr-1.5" />
                ) : (
                  <Minus className="w-4 h-4 mr-1.5" />
                )}
                {mode === "add" ? t.targets.addMode : t.targets.removeMode}
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider whitespace-nowrap">
                  {t.targets.thresholdLabel}: {threshold}
                </span>
                <input
                  type="range"
                  min={20}
                  max={220}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Right panel: settings + stats + save */}
          <div className="lg:col-span-2 space-y-4">
            {/* Session settings */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h2 className="font-display text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5" />
                {t.targets.sessionSettings}
              </h2>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t.targets.sessionName}
                </Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mt-1 bg-background font-mono text-sm"
                  placeholder="Session 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t.targets.distance}
                  </Label>
                  <Input
                    type="number"
                    value={distanceYards}
                    onChange={(e) => setDistanceYards(Number(e.target.value))}
                    className="mt-1 bg-background font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t.targets.targetWidth}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={targetWidthInches}
                    onChange={(e) => setTargetWidthInches(Number(e.target.value))}
                    className="mt-1 bg-background font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t.targets.notesLabel}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 bg-background font-mono text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Stats panel */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="font-display text-xs uppercase tracking-widest text-primary mb-3">
                {t.targets.statsTitle}
              </h2>
              {holes.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t.targets.noStats}</p>
              ) : (
                <div className="space-y-2">
                  <StatRow label={t.targets.holes} value={String(holes.length)} />
                  {stats ? (
                    <>
                      <StatRow
                        label={t.targets.extremeSpread}
                        value={`${stats.esIn.toFixed(3)}"`}
                      />
                      <StatRow
                        label={t.targets.esMOA}
                        value={stats.esMOA.toFixed(2)}
                        highlight
                      />
                      <StatRow
                        label={t.targets.mpi}
                        value={`${(stats.mpiX * 100).toFixed(1)}% / ${(stats.mpiY * 100).toFixed(1)}%`}
                      />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t.targets.noStats}</p>
                  )}
                </div>
              )}
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || !imageData || holes.length === 0}
              className="w-full font-display uppercase tracking-widest"
            >
              {saving ? t.targets.saving : t.targets.saveSession}
            </Button>
          </div>
        </div>

        {/* Session history */}
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-primary mb-4">
            {t.targets.history}
          </h2>
          {loadingSessions ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground font-display text-sm uppercase tracking-widest">
                {t.targets.noSessions}
              </p>
              <p className="text-muted-foreground text-xs mt-2">{t.targets.noSessionsDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-display">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-sm font-semibold",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SessionCard({
  session,
  onDelete,
}: {
  session: StoredSession;
  onDelete: () => void;
}) {
  const date = new Date(session.createdAt).toLocaleDateString();
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/40 transition-colors">
      <div className="relative aspect-video bg-black">
        <img
          src={session.imageData}
          alt={session.name}
          className="w-full h-full object-cover opacity-90"
        />
        {session.holes.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
          >
            {session.holes.map((h, i) => (
              <circle
                key={i}
                cx={h.x}
                cy={h.y}
                r="0.024"
                fill="rgba(239,68,68,0.3)"
                stroke="#ef4444"
                strokeWidth="0.006"
              />
            ))}
            {session.mpiX !== null && session.mpiY !== null && (
              <>
                <line
                  x1={session.mpiX}
                  y1={session.mpiY - 0.04}
                  x2={session.mpiX}
                  y2={session.mpiY + 0.04}
                  stroke="#f97316"
                  strokeWidth="0.006"
                />
                <line
                  x1={session.mpiX - 0.04}
                  y1={session.mpiY}
                  x2={session.mpiX + 0.04}
                  y2={session.mpiY}
                  stroke="#f97316"
                  strokeWidth="0.006"
                />
              </>
            )}
          </svg>
        )}
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 rounded bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="p-2 space-y-1">
        <p className="font-display text-xs font-semibold uppercase tracking-wider truncate text-foreground">
          {session.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {date} · {session.distanceYards}yd
        </p>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">{session.holeCount} holes</span>
          {session.esMOA !== null && (
            <span className="text-primary font-semibold">{session.esMOA.toFixed(2)} MOA</span>
          )}
        </div>
      </div>
    </div>
  );
}
