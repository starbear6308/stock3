import { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ============================================================
// 設定 — 填入你的 GAS Web App URL
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwkasrHZ5hKYEHQtayNFeTMfCzGCTPkCPU7RcJyBNxOrP65ntuki3g3HIDbVNCJIEeXZQ/exec";

// ============================================================
// 工具函式
// ============================================================
const fmt = (n) => (!n && n !== 0 ? "—" : Math.round(n).toLocaleString());
const fmtD = (n) => (!n ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmtPct = (n) => (!n && n !== 0 ? "" : `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`);
const plColor = (n) => (n > 0 ? "text-emerald-600" : n < 0 ? "text-rose-600" : "text-slate-500");
const plBg = (n) => (n > 0 ? "bg-emerald-50 text-emerald-700" : n < 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600");
const isTW = (s) => /^\d+$/.test(s);
const today = () => new Date().toISOString().slice(0, 10);

// Chart colors
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

// ============================================================
// API
// ============================================================
async function apiGet(action = "getData") {
  const r = await fetch(`${API_URL}?action=${action}`);
  return r.json();
}
async function apiPost(action, data = {}) {
  const r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action, data }) });
  return r.json();
}

// ============================================================
// 小元件
// ============================================================
function Badge({ tw }) {
  return tw
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">TW</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200/60">US</span>;
}

function Spinner({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-12 h-12"><div className="absolute inset-0 border-[3px] border-slate-200 rounded-full" /><div className="absolute inset-0 border-[3px] border-transparent border-t-blue-600 rounded-full animate-spin" /></div>
      {text && <p className="mt-4 text-slate-400 text-sm animate-pulse">{text}</p>}
    </div>
  );
}

function Toast({ msg, show }) {
  return <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 z-50 max-w-[90vw] text-center ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>{msg}</div>;
}

function Card({ icon, label, value, sub }) {
  const neg = typeof value === "string" && value.startsWith("-");
  const pos = typeof value === "string" && value.startsWith("+");
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-base">{icon}</span>{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${pos ? "text-emerald-600" : neg ? "text-rose-600" : "text-slate-800"}`}>{value}</div>
      {sub && <div className={`text-xs mt-1 font-medium ${sub.startsWith("+") ? "text-emerald-500" : sub.startsWith("-") ? "text-rose-500" : "text-slate-400"}`}>{sub}</div>}
    </div>
  );
}

function Modal({ open, close, title, wide, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={close}>
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? "max-w-3xl" : "max-w-lg"} w-full max-h-[90vh] overflow-y-auto animate-modal-in`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-600 text-xl p-1 hover:bg-slate-100 rounded-lg transition">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>{children}</div>;
}
const inp = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white";

function Btn({ children, color = "blue", onClick, disabled, className = "" }) {
  const colors = { blue: "bg-blue-600 hover:bg-blue-700 text-white", green: "bg-emerald-600 hover:bg-emerald-700 text-white", red: "bg-rose-600 hover:bg-rose-700 text-white", purple: "bg-violet-600 hover:bg-violet-700 text-white", amber: "bg-amber-500 hover:bg-amber-600 text-white", ghost: "bg-white hover:bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
  return <button onClick={onClick} disabled={disabled} className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${colors[color] || colors.ghost} ${className}`}>{children}</button>;
}

// ============================================================
// 圖表元件
// ============================================================
function HoldingsPieChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((r) => ({ name: r.name || r.symbol, value: Math.abs(r.marketValue || r.totalCost || 0), symbol: r.symbol })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [data]);

  if (!chartData.length) return null;
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">持股比重</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={200} height={200}>
          <PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none" strokeWidth={0}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie></PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 text-xs max-h-48 overflow-y-auto w-full">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-600 truncate flex-1">{d.name}</span>
              <span className="text-slate-800 font-medium tabular-nums">{(d.value / total * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DividendBarChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    const byYear = {};
    data.forEach((d) => { const y = d.year || "不明"; byYear[y] = (byYear[y] || 0) + (d.cashReceived || 0); });
    return Object.entries(byYear).map(([year, total]) => ({ year: String(year), total })).sort((a, b) => a.year.localeCompare(b.year));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">年度現金股利</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
          <Tooltip formatter={(v) => [v.toLocaleString() + " 元", "現金股利"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PnlBarChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data.map((r) => ({ name: r.name || r.symbol, pnl: Math.round(r.plAmount || 0), symbol: r.symbol })).sort((a, b) => b.pnl - a.pnl);
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">各股損益</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [v.toLocaleString() + " 元", "損益"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 表格元件
// ============================================================
const TH = ({ children, right }) => <th className={`px-3 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-100 ${right ? "text-right" : ""}`}>{children}</th>;
const TD = ({ children, className = "" }) => <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
const TDN = ({ children, className = "" }) => <td className={`px-3 py-2.5 text-right tabular-nums ${className}`}>{children}</td>;

function UnrealizedTable({ data }) {
  if (!data?.length) return <div className="py-16 text-center text-slate-400">尚無持股，請點「➕ 新增持股」開始</div>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-slate-50/80"><TH>代碼</TH><TH>名稱</TH><TH></TH><TH>券商</TH><TH right>股數</TH><TH right>平均成本</TH><TH right>目前股價</TH><TH right>漲跌</TH><TH right>投入成本</TH><TH right>目前市值</TH><TH right>損益</TH><TH right>報酬率</TH><TH right>股利</TH><TH>來源</TH></tr></thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-blue-50/40 transition border-b border-slate-50">
            <TD className="font-semibold text-blue-700">{r.symbol}</TD>
            <TD className="text-slate-500 text-xs max-w-[120px] truncate">{r.name}</TD>
            <TD><Badge tw={isTW(r.symbol)} /></TD>
            <TD className="text-xs text-slate-500">{r.broker}</TD>
            <TDN>{fmt(r.shares)}</TDN>
            <TDN>{fmtD(r.avgCost)}</TDN>
            <TDN className="font-semibold">{fmtD(r.curPrice)}</TDN>
            <TDN className={`font-medium ${plColor(r.change)}`}>{r.change > 0 ? "+" : ""}{fmtD(r.change)}</TDN>
            <TDN className="text-slate-600">{fmt(r.totalCost)}</TDN>
            <TDN className="text-slate-600">{fmt(r.marketValue)}</TDN>
            <TDN className={`font-bold ${plColor(r.plAmount)}`}>{r.plAmount >= 0 ? "+" : ""}{fmt(r.plAmount)}</TDN>
            <TDN className={`font-medium ${plColor(r.plPct)}`}>{fmtPct(r.plPct)}</TDN>
            <TDN className="text-violet-600">{r.accDiv > 0 ? fmt(r.accDiv) : "—"}</TDN>
            <TD className="text-[10px] text-slate-300 text-center">{r.source}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RealizedTable({ data }) {
  if (!data?.length) return <div className="py-16 text-center text-slate-400">尚無賣出記錄</div>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-slate-50/80"><TH>代碼</TH><TH>名稱</TH><TH></TH><TH>賣出日期</TH><TH right>賣出價</TH><TH right>股數</TH><TH right>成本</TH><TH right>手續費</TH><TH right>稅</TH><TH right>損益</TH><TH right>報酬率</TH></tr></thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-rose-50/30 transition border-b border-slate-50">
            <TD className="font-semibold text-blue-700">{r.symbol}</TD>
            <TD className="text-slate-500 text-xs">{r.name}</TD>
            <TD><Badge tw={isTW(r.symbol)} /></TD>
            <TD className="text-slate-600 text-xs">{r.sellDate}</TD>
            <TDN>{fmtD(r.sellPrice)}</TDN>
            <TDN>{fmt(r.sellShares)}</TDN>
            <TDN>{fmtD(r.avgCost)}</TDN>
            <TDN className="text-slate-400">{fmt(r.fee)}</TDN>
            <TDN className="text-slate-400">{fmt(r.tax)}</TDN>
            <TDN className={`font-bold ${plColor(r.realizedPL)}`}>{r.realizedPL >= 0 ? "+" : ""}{fmt(r.realizedPL)}</TDN>
            <TDN className={`font-medium ${plColor(r.returnPct)}`}>{fmtPct(r.returnPct)}</TDN>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DividendTable({ data }) {
  if (!data?.length) return <div className="py-16 text-center text-slate-400">尚無股利記錄，請點「🔍 抓取除權息」</div>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-slate-50/80"><TH>代碼</TH><TH>名稱</TH><TH>年度</TH><TH>除息日</TH><TH right>現金股利</TH><TH right>股票股利</TH><TH right>持股數</TH><TH right>實領現金</TH><TH right>配股數</TH><TH right>殖利率</TH><TH>備註</TH></tr></thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-violet-50/30 transition border-b border-slate-50">
            <TD className="font-semibold text-blue-700">{r.symbol}</TD>
            <TD className="text-slate-500 text-xs">{r.name}</TD>
            <TD className="text-center text-slate-600">{r.year}</TD>
            <TD className="text-center text-slate-600 text-xs">{r.exDate}</TD>
            <TDN>{fmtD(r.cashDiv)}</TDN>
            <TDN>{fmtD(r.stockDiv)}</TDN>
            <TDN>{fmt(r.heldShares)}</TDN>
            <TDN className="font-bold text-emerald-600">{fmt(r.cashReceived)}</TDN>
            <TDN>{fmt(r.stockReceived)}</TDN>
            <TDN className="text-slate-500">{fmtPct(r.yieldPct)}</TDN>
            <TD className="text-[10px] text-slate-300 text-center">{r.note}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================
// 主元件
// ============================================================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [invRows, setInvRows] = useState([]);
  const [apiResults, setApiResults] = useState([]);

  const [addF, setAddF] = useState({ market: "TW", broker: "凱基", symbol: "", date: today(), price: "", shares: "", fee: "0" });
  const [sellF, setSellF] = useState({ market: "TW", symbol: "", sellDate: today(), sellPrice: "", sellShares: "", fee: "0", tax: "0" });
  const [divF, setDivF] = useState({ market: "TW", symbol: "", year: String(new Date().getFullYear()), exDate: today(), cashDiv: "0", stockDiv: "0", heldShares: "" });

  const notify = useCallback((msg) => { setToast({ msg, show: true }); setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500); }, []);

  const load = useCallback(async () => {
    if (!API_URL) { setLoading(false); return; }
    try { const r = await apiGet(); if (r.success) setData(r.data); else notify("載入失敗：" + r.error); } catch (e) { notify("連線失敗：" + e.message); }
    setLoading(false);
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  // Auto-calc sell tax
  useEffect(() => {
    if (sellF.market === "TW") setSellF((f) => ({ ...f, tax: String(Math.round((parseFloat(f.sellPrice) || 0) * (parseInt(f.sellShares) || 0) * 0.003)) }));
  }, [sellF.market, sellF.sellPrice, sellF.sellShares]);

  const doAction = async (action, msg) => {
    setBusy(true); notify(msg);
    try {
      const r = await apiPost(action);
      if (r.success) { if (r.data) setData(r.data); notify(r.message || (r.count !== undefined ? (r.count > 0 ? `完成！新增 ${r.count} 筆` : "無新資料") : "完成！")); if (!r.data) await load(); }
      else notify("錯誤：" + r.error);
    } catch (e) { notify("錯誤：" + e.message); }
    setBusy(false);
  };

  const submit = async (action, formData, parseFields) => {
    const d = { ...formData };
    parseFields.forEach(([k, fn]) => { d[k] = fn(d[k]); });
    setModal(null); setBusy(true); notify("處理中...");
    try { const r = await apiPost(action, d); notify(r.success ? r.message : "錯誤：" + r.error); await load(); } catch (e) { notify("錯誤：" + e.message); }
    setBusy(false);
  };

  const openInv = async () => { setModal("inv"); setInvRows([]); try { const r = await apiGet("getInventory"); setInvRows(r.success ? r.data : []); } catch (e) { notify(e.message); } };
  const delRow = async (n) => { if (!confirm(`確定刪除第 ${n} 列？`)) return; notify("刪除中..."); try { const r = await apiPost("deleteRow", { row: n }); notify(r.success ? r.message : r.error); openInv(); } catch (e) { notify(e.message); } };
  const openApi = async () => { setModal("api"); setApiResults([]); try { const r = await apiGet("testApis"); setApiResults(r.success ? r.data : []); } catch (e) { notify(e.message); } };

  const divCashPrev = Math.round((parseFloat(divF.cashDiv) || 0) * (parseInt(divF.heldShares) || 0));
  const divStockPrev = divF.market === "TW" ? Math.floor((parseFloat(divF.stockDiv) || 0) / 10 * (parseInt(divF.heldShares) || 0)) : Math.floor((parseFloat(divF.stockDiv) || 0) * (parseInt(divF.heldShares) || 0));

  // ====== Render ======
  if (loading) return <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center"><Spinner text="同步即時股價中..." /></div>;

  if (!API_URL) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">設定 API 連線</h2>
        <p className="text-sm text-slate-500 mb-6">請在 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">src/App.jsx</code> 第 7 行填入 GAS URL</p>
        <code className="block bg-slate-100 rounded-xl px-4 py-3 text-xs text-slate-600 font-mono text-left">const API_URL = "https://script.google.com/macros/s/.../exec";</code>
      </div>
    </div>
  );

  const s = data?.summary || {};
  const pl = s.totalPL || 0, rpl = s.totalRealizedPL || 0, dv = s.totalCashDividend || s.totalDividend || 0;
  const totalAll = pl + rpl + dv, totalPct = s.totalCost > 0 ? totalAll / s.totalCost : 0;
  const tabs = [{ l: "📊 未實現損益", n: data?.unrealized?.length || 0 }, { l: "📕 已實現損益", n: data?.realized?.length || 0 }, { l: "💰 股利記錄", n: data?.dividends?.length || 0 }, { l: "📈 圖表分析", n: 0 }];
  const brokers = ["凱基", "富邦", "元大", "國泰", "永豐", "中信", "玉山", "台新", "其他"];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">📊 投資組合儀表板</h1>
            <p className="text-blue-200 text-xs mt-0.5">最後更新：{s.lastUpdate || "—"}</p>
          </div>
          <button onClick={() => { setLoading(true); load(); }} disabled={busy} className="text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm transition disabled:opacity-50">🔃 重整</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Btn color="blue" onClick={() => { setAddF((f) => ({ ...f, date: today() })); setModal("add"); }} disabled={busy}>➕ 新增持股</Btn>
          <Btn color="green" onClick={() => doAction("recalc", "重新計算中（約 30 秒）...")} disabled={busy}>📋 重新計算</Btn>
          <Btn color="ghost" onClick={() => doAction("updatePrices", "更新股價中（約 30 秒）...")} disabled={busy}>🔄 更新股價</Btn>
          <Btn color="red" onClick={() => { setSellF((f) => ({ ...f, sellDate: today() })); setModal("sell"); }} disabled={busy}>📤 記錄賣出</Btn>
          <Btn color="purple" onClick={() => { setDivF((f) => ({ ...f, year: String(new Date().getFullYear()), exDate: today() })); setModal("div"); }} disabled={busy}>💰 記錄股利</Btn>
          <Btn color="amber" onClick={() => doAction("fetchDividends", "抓取除權息中（約 60 秒）...")} disabled={busy}>🔍 抓取除權息</Btn>
          <Btn color="ghost" onClick={openInv} disabled={busy}>📝 持股明細</Btn>
          <Btn color="ghost" onClick={openApi} disabled={busy}>🧪 測試API</Btn>
          <Btn color="ghost" onClick={() => doAction("setupTrigger", "設定中...")} disabled={busy}>⏰ 每日自動</Btn>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card icon="💰" label="總投入成本" value={fmt(s.totalCost)} />
          <Card icon="📈" label="目前市值" value={fmt(s.totalMarket)} />
          <Card icon="📊" label="未實現損益" value={`${pl >= 0 ? "+" : ""}${fmt(pl)}`} sub={fmtPct(s.totalPLPct)} />
          <Card icon="📕" label="已實現損益" value={`${rpl >= 0 ? "+" : ""}${fmt(rpl)}`} />
          <Card icon="🎁" label="累計股利" value={fmt(dv)} />
          <Card icon="🏆" label="總報酬" value={`${totalAll >= 0 ? "+" : ""}${fmt(totalAll)}`} sub={fmtPct(totalPct)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${tab === i ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {t.l} {t.n > 0 && <span className="text-xs opacity-50">({t.n})</span>}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 overflow-x-auto mb-6">
          {tab === 0 && <UnrealizedTable data={data?.unrealized} />}
          {tab === 1 && <RealizedTable data={data?.realized} />}
          {tab === 2 && <DividendTable data={data?.dividends} />}
          {tab === 3 && (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HoldingsPieChart data={data?.unrealized} />
              <PnlBarChart data={data?.unrealized} />
              <DividendBarChart data={data?.dividends} />
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-slate-400">Stock Portfolio v5 · Vercel + Google Apps Script</footer>

      {/* ===== Modals ===== */}
      <Modal open={modal === "add"} close={() => setModal(null)} title="➕ 新增持股">
        <div className="grid grid-cols-2 gap-3">
          <Field label="市場"><select className={inp} value={addF.market} onChange={(e) => setAddF({ ...addF, market: e.target.value })}><option value="TW">TW 台股</option><option value="US">US 美股</option></select></Field>
          <Field label="證券公司"><select className={inp} value={addF.broker} onChange={(e) => setAddF({ ...addF, broker: e.target.value })}>{brokers.map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="股票代碼"><input className={inp} placeholder="2330" value={addF.symbol} onChange={(e) => setAddF({ ...addF, symbol: e.target.value })} /></Field>
          <Field label="交易日期"><input type="date" className={inp} value={addF.date} onChange={(e) => setAddF({ ...addF, date: e.target.value })} /></Field>
          <Field label="買入價格"><input type="number" step="0.01" className={inp} value={addF.price} onChange={(e) => setAddF({ ...addF, price: e.target.value })} /></Field>
          <Field label="買入股數"><input type="number" className={inp} value={addF.shares} onChange={(e) => setAddF({ ...addF, shares: e.target.value })} /></Field>
        </div>
        <Field label="手續費"><input type="number" className={inp} value={addF.fee} onChange={(e) => setAddF({ ...addF, fee: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 mt-5">
          <Btn color="ghost" onClick={() => setModal(null)}>取消</Btn>
          <Btn color="blue" disabled={busy} onClick={() => submit("addHolding", addF, [["price", parseFloat], ["shares", parseInt], ["fee", (v) => parseInt(v) || 0]])}>確認新增</Btn>
        </div>
      </Modal>

      <Modal open={modal === "sell"} close={() => setModal(null)} title="📤 記錄賣出">
        <div className="grid grid-cols-2 gap-3">
          <Field label="市場"><select className={inp} value={sellF.market} onChange={(e) => setSellF({ ...sellF, market: e.target.value })}><option value="TW">TW 台股</option><option value="US">US 美股</option></select></Field>
          <Field label="股票代碼"><input className={inp} placeholder="2330" value={sellF.symbol} onChange={(e) => setSellF({ ...sellF, symbol: e.target.value })} /></Field>
          <Field label="賣出日期"><input type="date" className={inp} value={sellF.sellDate} onChange={(e) => setSellF({ ...sellF, sellDate: e.target.value })} /></Field>
          <Field label="賣出價格"><input type="number" step="0.01" className={inp} value={sellF.sellPrice} onChange={(e) => setSellF({ ...sellF, sellPrice: e.target.value })} /></Field>
          <Field label="賣出股數"><input type="number" className={inp} value={sellF.sellShares} onChange={(e) => setSellF({ ...sellF, sellShares: e.target.value })} /></Field>
          <Field label="手續費"><input type="number" className={inp} value={sellF.fee} onChange={(e) => setSellF({ ...sellF, fee: e.target.value })} /></Field>
        </div>
        <Field label="交易稅（台股 0.3% 自動計算）"><input type="number" className={inp} value={sellF.tax} onChange={(e) => setSellF({ ...sellF, tax: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 mt-5">
          <Btn color="ghost" onClick={() => setModal(null)}>取消</Btn>
          <Btn color="red" disabled={busy} onClick={() => submit("sellHolding", sellF, [["sellPrice", parseFloat], ["sellShares", parseInt], ["fee", (v) => parseInt(v) || 0], ["tax", (v) => parseInt(v) || 0]])}>確認賣出</Btn>
        </div>
      </Modal>

      <Modal open={modal === "div"} close={() => setModal(null)} title="💰 記錄股利發放">
        <div className="grid grid-cols-2 gap-3">
          <Field label="市場"><select className={inp} value={divF.market} onChange={(e) => setDivF({ ...divF, market: e.target.value })}><option value="TW">TW 台股</option><option value="US">US 美股</option></select></Field>
          <Field label="股票代碼"><input className={inp} placeholder="2330" value={divF.symbol} onChange={(e) => setDivF({ ...divF, symbol: e.target.value })} /></Field>
          <Field label="發放年度"><input type="number" className={inp} value={divF.year} onChange={(e) => setDivF({ ...divF, year: e.target.value })} /></Field>
          <Field label="除權息日"><input type="date" className={inp} value={divF.exDate} onChange={(e) => setDivF({ ...divF, exDate: e.target.value })} /></Field>
          <Field label="每股現金股利"><input type="number" step="0.01" className={inp} value={divF.cashDiv} onChange={(e) => setDivF({ ...divF, cashDiv: e.target.value })} /></Field>
          <Field label="每股股票股利"><input type="number" step="0.01" className={inp} value={divF.stockDiv} onChange={(e) => setDivF({ ...divF, stockDiv: e.target.value })} /></Field>
        </div>
        <Field label="配息時持股數"><input type="number" className={inp} placeholder="除權息日當天持有" value={divF.heldShares} onChange={(e) => setDivF({ ...divF, heldShares: e.target.value })} /></Field>
        <div className="bg-slate-50 rounded-xl p-3 mt-3 text-sm text-slate-600 flex gap-6 border border-slate-100">
          <span>實領現金：<strong className="text-emerald-600">{divF.heldShares ? divCashPrev.toLocaleString() : "—"}</strong></span>
          <span>配股股數：<strong>{divStockPrev > 0 ? divStockPrev.toLocaleString() + " 股" : "無配股"}</strong></span>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn color="ghost" onClick={() => setModal(null)}>取消</Btn>
          <Btn color="purple" disabled={busy} onClick={() => submit("addDividend", divF, [["year", parseInt], ["cashDiv", (v) => parseFloat(v) || 0], ["stockDiv", (v) => parseFloat(v) || 0], ["heldShares", (v) => parseInt(v) || 0]])}>確認記錄</Btn>
        </div>
      </Modal>

      <Modal open={modal === "inv"} close={() => setModal(null)} title="📝 持股庫存明細" wide>
        {!invRows.length ? <Spinner text="載入中..." /> :
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50">{["市場", "券商", "代碼", "名稱", "日期", "價格", "股數", "備註", ""].map((h, i) => <th key={i} className="px-2 py-2 text-slate-400 font-medium">{h}</th>)}</tr></thead>
              <tbody>{invRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b border-slate-50">
                  <td className="px-2 py-1.5">{r.market}</td><td className="px-2 py-1.5">{r.broker}</td>
                  <td className="px-2 py-1.5 font-semibold text-blue-700">{r.symbol}</td><td className="px-2 py-1.5 text-slate-500">{r.name}</td>
                  <td className="px-2 py-1.5 text-slate-500">{r.date}</td><td className="px-2 py-1.5 text-right tabular-nums">{fmtD(r.price)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(r.shares)}</td><td className="px-2 py-1.5 text-slate-300 text-[10px]">{r.note}</td>
                  <td className="px-2 py-1.5"><button onClick={() => delRow(r.row)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 transition">🗑️</button></td>
                </tr>
              ))}</tbody>
            </table>
            <div className="text-center py-2 text-xs text-slate-400">共 {invRows.length} 筆</div>
          </div>
        }
      </Modal>

      <Modal open={modal === "api"} close={() => setModal(null)} title="🧪 API 連線測試">
        {!apiResults.length ? <Spinner text="測試中（約 15 秒）..." /> :
          <div className="space-y-2">{apiResults.map((r, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-lg mt-0.5">{r.status}</span>
              <div>
                <div className={`text-sm font-medium ${r.status === "✅" ? "text-emerald-700" : r.status === "⚠️" ? "text-amber-700" : "text-rose-700"}`}>{r.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{r.detail}</div>
              </div>
            </div>
          ))}</div>
        }
      </Modal>

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
}
