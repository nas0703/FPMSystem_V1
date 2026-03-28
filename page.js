'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { createWorker } from 'tesseract.js';

import { 

  ScanLine, LayoutDashboard, ShieldCheck, AlertCircle, 

  TrendingUp, Leaf, FileText, Loader2, Lock, Delete,

  History, Calendar, Trophy, Droplets, Factory

} from 'lucide-react';



// --- DATA MASTER FPMSB TUNGGAL ---

const MASTER_DATA = {

  "1": { luas: 72.15, target_mt: 137.08, target_hek: 1.90, pkt: "001" },

  "2": { luas: 68.37, target_mt: 129.91, target_hek: 1.90, pkt: "001" },

  "3": { luas: 76.59, target_mt: 145.53, target_hek: 1.90, pkt: "001" },

  "4": { luas: 92.39, target_mt: 175.54, target_hek: 1.90, pkt: "001" },

  "5": { luas: 60.19, target_mt: 114.36, target_hek: 1.90, pkt: "001" },

  "6": { luas: 80.42, target_mt: 152.79, target_hek: 1.90, pkt: "001" },

  "7": { luas: 89.46, target_mt: 169.98, target_hek: 1.90, pkt: "001" },

  "8": { luas: 82.03, target_mt: 155.85, target_hek: 1.90, pkt: "001" },

  "9": { luas: 83.61, target_mt: 158.87, target_hek: 1.90, pkt: "001" },

  "10": { luas: 84.36, target_mt: 160.28, target_hek: 1.90, pkt: "001" },

  "11": { luas: 47.85, target_mt: 90.91, target_hek: 1.90, pkt: "001" },

  "12": { luas: 76.50, target_mt: 145.34, target_hek: 1.90, pkt: "001" },

  "13": { luas: 50.75, target_mt: 96.43, target_hek: 1.90, pkt: "001" },

  "14": { luas: 70.45, target_mt: 133.85, target_hek: 1.90, pkt: "001" },

  "15": { luas: 68.36, target_mt: 129.88, target_hek: 1.90, pkt: "001" },

  "16": { luas: 64.44, target_mt: 122.44, target_hek: 1.90, pkt: "001" },

  "17": { luas: 84.08, target_mt: 159.75, target_hek: 1.90, pkt: "001" },

  "18": { luas: 76.20, target_mt: 137.15, target_hek: 1.80, pkt: "002" },

  "19": { luas: 81.75, target_mt: 147.15, target_hek: 1.80, pkt: "002" },

  "20": { luas: 68.62, target_mt: 123.52, target_hek: 1.80, pkt: "002" },

  "21": { luas: 24.26, target_mt: 43.68, target_hek: 1.80, pkt: "002" },

  "22": { luas: 65.29, target_mt: 117.52, target_hek: 1.80, pkt: "002" }

};



export default function FPMSBApp() {

  const [authRole, setAuthRole] = useState(null); 

  const [pin, setPin] = useState('');

  const [loginError, setLoginError] = useState(false);



  const [activeTab, setActiveTab] = useState('scan'); // scan, dashboard, sejarah

  const [timeFilter, setTimeFilter] = useState('bulan_ini'); // hari_ini, bulan_ini, tahun_ini

  const [showRanking, setShowRanking] = useState(false);



  const [formData, setFormData] = useState({ no_resit: '', no_lori: '', blok: '', tan: '', muda: '' });

  const [rawData, setRawData] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);

  const [toast, setToast] = useState(null);



  const STAFF_PIN = "123456";

  const MANAGER_PIN = "888888";



  useEffect(() => {

    if (authRole) fetchData();

  }, [authRole]);



  const fetchData = async () => {

    try {

      const res = await fetch('/api/hantaran');

      const data = await res.json();

      setRawData(data);

    } catch (e) { showToast('error', 'Gagal memuat turun data.'); }

  };



  const showToast = (type, msg) => {

    setToast({ type, msg });

    setTimeout(() => setToast(null), 4000);

  };



  const handlePinPress = (digit) => {

    if (pin.length < 6) {

      const newPin = pin + digit;

      setPin(newPin);

      setLoginError(false);



      if (newPin.length === 6) {

        setTimeout(() => {

          if (newPin === STAFF_PIN) {

            setAuthRole('staff'); setActiveTab('scan');

          } else if (newPin === MANAGER_PIN) {

            setAuthRole('manager'); setActiveTab('dashboard');

          } else {

            setLoginError(true); setPin('');

          }

        }, 300);

      }

    }

  };



  const handleDeletePress = () => setPin(pin.slice(0, -1));

  const handleLogout = () => { setAuthRole(null); setPin(''); setActiveTab('scan'); };



  const submitTransaction = async (e) => {

    e.preventDefault();

    setIsProcessing(true);

    try {

      const res = await fetch('/api/hantaran', { method: 'POST', body: JSON.stringify(formData) });

      const result = await res.json();

      if (result.success) {

        showToast('success', `Berjaya: Resit ${result.ref}`);

        setFormData({ no_resit: '', no_lori: '', blok: '', tan: '', muda: '' });

        fetchData();

      } else throw new Error(result.error);

    } catch (err) { showToast('error', err.message); } 

    finally { setIsProcessing(false); }

  };



  // --- ANALITIK LOGIK ---

  const filteredData = useMemo(() => {

    const today = new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const currentMonth = today.slice(0, 7);

    const currentYear = today.slice(0, 4);



    return rawData.filter(item => {

      if (timeFilter === 'hari_ini') return item.tarikh === today;

      if (timeFilter === 'bulan_ini') return item.tarikh.startsWith(currentMonth);

      if (timeFilter === 'tahun_ini') return item.tarikh.startsWith(currentYear);

      return true;

    });

  }, [rawData, timeFilter]);



  const analytics = useMemo(() => {

    let pkt1_tan = 0, pkt2_tan = 0;

    let pkt1_muda = 0, pkt2_muda = 0;

    let oerCount = 0; // KPA (Resit)



    const blokStats = Object.keys(MASTER_DATA).map(blok => ({

      blok,

      pkt: MASTER_DATA[blok].pkt,

      luas: MASTER_DATA[blok].luas,

      target_mt: timeFilter === 'hari_ini' ? (MASTER_DATA[blok].target_mt / 30) : MASTER_DATA[blok].target_mt,

      target_hek: MASTER_DATA[blok].target_hek,

      tan: 0,

      muda: 0,

      resit_count: 0

    }));



    filteredData.forEach(row => {

      const b = blokStats.find(s => s.blok === row.blok.toString());

      if (b) {

        b.tan += row.tan;

        b.muda += row.muda;

        b.resit_count += 1;

        oerCount += 1;

        

        if (b.pkt === "001") { pkt1_tan += row.tan; pkt1_muda += row.muda; } 

        else { pkt2_tan += row.tan; pkt2_muda += row.muda; }

      }

    });



    blokStats.forEach(b => {

      b.yieldHek = b.luas > 0 ? (b.tan / b.luas) : 0;

      b.progress_pct = b.target_mt > 0 ? (b.tan / b.target_mt) * 100 : 0;

      

      if (b.progress_pct >= 90) b.color = 'text-emerald-500 bg-emerald-50';

      else if (b.progress_pct >= 80) b.color = 'text-amber-500 bg-amber-50';

      else b.color = 'text-rose-500 bg-rose-50';

    });



    // Ranking Blok

    const rankedBlok = [...blokStats].sort((a, b) => b.yieldHek - a.yieldHek);



    return { pkt1_tan, pkt2_tan, pkt1_muda, pkt2_muda, blokStats, rankedBlok, totalResit: oerCount };

  }, [filteredData, timeFilter]);



  // ==========================================

  // VIEW: LOG MASUK (PIN PAD)

  // ==========================================

  if (!authRole) {

    return (

      <div className="max-w-md mx-auto min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">

        <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-xs flex flex-col items-center">

          <div className="bg-emerald-500/20 p-4 rounded-full mb-6 border border-emerald-500/30">

            <Lock className="text-emerald-400" size={32} />

          </div>

          <h1 className="text-2xl font-black text-white tracking-widest mb-1">FPMSB TUNGGAL</h1>

          <p className="text-xs text-emerald-400/80 uppercase font-bold tracking-widest mb-10">Sistem Keselamatan</p>



          <div className="flex gap-4 mb-10 h-4">

            {[...Array(6)].map((_, i) => (

              <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-emerald-400 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`} />

            ))}

          </div>



          {loginError && <p className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-4 animate-pulse">PIN Tidak Sah</p>}



          <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full px-4">

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (

              <button key={num} onClick={() => handlePinPress(num.toString())} className="text-2xl font-medium text-white p-4 rounded-full active:bg-white/10 transition-colors">{num}</button>

            ))}

            <div />

            <button onClick={() => handlePinPress('0')} className="text-2xl font-medium text-white p-4 rounded-full active:bg-white/10 transition-colors">0</button>

            <button onClick={handleDeletePress} className="flex justify-center items-center text-slate-400 p-4 rounded-full active:bg-white/10 transition-colors"><Delete size={28} /></button>

          </div>

        </div>

      </div>

    );

  }



  // ==========================================

  // VIEW: APLIKASI UTAMA

  // ==========================================

  return (

    <div className="max-w-md mx-auto min-h-screen bg-slate-50 font-sans relative pb-28">

      {toast && (

        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold text-white animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>

          {toast.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}

          {toast.msg}

        </div>

      )}



      {/* Header Korporat */}

      <header className="bg-emerald-900 pt-12 pb-6 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">

        <div className="absolute top-0 right-0 p-8 opacity-10"><Leaf size={120} /></div>

        <div className="relative z-10 flex justify-between items-end mb-4">

          <div>

            <h1 className="text-2xl font-black text-white tracking-tight">FPMSB TUNGGAL</h1>

            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">

              {authRole === 'manager' ? 'Selamat datang, Pengurus Nas' : 'Operasi Ladang'}

            </p>

          </div>

          <button onClick={handleLogout} className="text-[10px] bg-white/10 text-white font-bold uppercase px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20">

            Log Keluar

          </button>

        </div>



        {/* Filter Masa (Hanya di Dashboard) */}

        {authRole === 'manager' && activeTab === 'dashboard' && (

          <div className="flex bg-black/20 p-1 rounded-full mt-4 border border-white/10 backdrop-blur-sm">

            {[

              { id: 'hari_ini', label: 'Hari Ini' },

              { id: 'bulan_ini', label: 'Bulan Ini' },

              { id: 'tahun_ini', label: 'Tahun Ini' }

            ].map(f => (

              <button key={f.id} onClick={() => setTimeFilter(f.id)} className={`flex-1 text-[10px] font-bold py-2 rounded-full transition-all uppercase tracking-wider ${timeFilter === f.id ? 'bg-white text-emerald-900 shadow-md' : 'text-emerald-100/70 hover:text-white'}`}>

                {f.label}

              </button>

            ))}

          </div>

        )}

      </header>



      <main className="p-5">

        

        {/* TAB 1: KEMASUKAN DATA */}

        {activeTab === 'scan' && (

          <div className="animate-in fade-in duration-300">

            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><FileText size={14}/> Rekod Hantaran</h2>

            

            <form onSubmit={submitTransaction} className="space-y-4 mt-2">

              <div className="grid grid-cols-2 gap-4">

                <FloatingInput label="No. Resit" value={formData.no_resit} onChange={v => setFormData({...formData, no_resit: v})} />

                <FloatingInput label="No. Lori" value={formData.no_lori} onChange={v => setFormData({...formData, no_lori: v})} />

              </div>

              <FloatingInput label="No. Blok (Contoh: 5)" type="number" value={formData.blok} onChange={v => setFormData({...formData, blok: v})} />

              <div className="grid grid-cols-2 gap-4">

                <FloatingInput label="Berat (Tan)" type="number" step="0.01" value={formData.tan} onChange={v => setFormData({...formData, tan: v})} />

                <FloatingInput label="Biji Muda (BTS)" type="number" value={formData.muda} onChange={v => setFormData({...formData, muda: v})} />

              </div>

              <button disabled={isProcessing} className="w-full bg-slate-900 text-white font-bold py-5 mt-2 rounded-3xl shadow-xl active:scale-95 transition-all flex justify-center gap-2">

                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20}/> Simpan Rekod</>}

              </button>

            </form>

          </div>

        )}



        {/* TAB 2: ANALITIK (Pengurus Sahaja) */}

        {activeTab === 'dashboard' && authRole === 'manager' && (

          <div className="animate-in slide-in-from-right-8 duration-300 space-y-5">

            

            {/* Ringkasan Peringkat */}

            <div className="grid grid-cols-2 gap-3">

              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center">

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peringkat 1</p>

                <p className="text-xl font-black text-emerald-600 mt-1">{analytics.pkt1_tan.toFixed(2)}<span className="text-xs">T</span></p>

                <div className="flex justify-center items-center gap-1 mt-1 bg-rose-50 rounded-full py-0.5 px-2 w-max mx-auto">

                  <Leaf size={10} className="text-rose-500"/><span className="text-[9px] font-bold text-rose-600">{analytics.pkt1_muda} Muda</span>

                </div>

              </div>

              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center">

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peringkat 2</p>

                <p className="text-xl font-black text-emerald-600 mt-1">{analytics.pkt2_tan.toFixed(2)}<span className="text-xs">T</span></p>

                <div className="flex justify-center items-center gap-1 mt-1 bg-rose-50 rounded-full py-0.5 px-2 w-max mx-auto">

                  <Leaf size={10} className="text-rose-500"/><span className="text-[9px] font-bold text-rose-600">{analytics.pkt2_muda} Muda</span>

                </div>

              </div>

            </div>



            {/* OER vs KPG Analytics */}

            <div className="bg-slate-900 p-5 rounded-3xl shadow-lg relative overflow-hidden">

              <div className="absolute top-0 right-0 p-4 opacity-5"><Factory size={80} className="text-white"/></div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">

                <Droplets size={12}/> Semakan Kualiti KPA (OER) vs KPG

              </h3>

              <div className="flex items-end justify-between relative z-10">

                <div>

                  <p className="text-3xl font-black text-white">{analytics.totalResit}</p>

                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Jumlah Resit (KPA)</p>

                </div>

                <div className="text-right">

                  <p className="text-xl font-black text-white">{analytics.totalResit}</p>

                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Padanan KPG (1:1)</p>

                </div>

              </div>

              <div className="mt-3 text-xs font-bold text-emerald-300 bg-emerald-900/50 py-1.5 px-3 rounded-full text-center">

                100% OER Tepat & Sepadan

              </div>

            </div>



            {/* Togol Ranking */}

            <div className="flex justify-between items-center px-1 mt-4">

              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Prestasi Aset (Blok)</h2>

              <button onClick={() => setShowRanking(!showRanking)} className="bg-white text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex gap-1 items-center text-slate-700">

                {showRanking ? <LayoutDashboard size={12}/> : <Trophy size={12}/>}

                {showRanking ? 'Lihat Biasa' : 'Lihat Ranking'}

              </button>

            </div>



            {/* Senarai Blok / Ranking */}

            {(showRanking ? analytics.rankedBlok : analytics.blokStats).map((s, index) => {

              if (s.tan === 0 && !showRanking) return null; // Sorok blok kosong jika view biasa

              

              return (

                <div key={s.blok} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">

                  {showRanking && (

                    <div className="w-8 font-black text-slate-300 text-lg mr-2">#{index + 1}</div>

                  )}

                  <div className="flex-1">

                    <h3 className="text-sm font-black text-slate-800">Blok {s.blok}</h3>

                    <p className="text-[10px] font-bold text-slate-400 uppercase">Yield: {s.yieldHek.toFixed(2)} T/H</p>

                  </div>

                  <div className="text-right">

                    <span className={`text-xs font-black px-3 py-1 rounded-full ${s.color}`}>

                      {s.progress_pct.toFixed(1)}% Capai

                    </span>

                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">

                      {s.tan.toFixed(2)} T / {s.muda} Muda

                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        )}



        {/* TAB 3: SEJARAH DATA */}

        {activeTab === 'sejarah' && (

          <div className="animate-in slide-in-from-right-8 duration-300">

             <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"><History size={14}/> Sejarah Harian</h2>

             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

                {rawData.length === 0 ? (

                  <p className="text-center p-6 text-xs font-bold text-slate-400">Tiada rekod hantaran.</p>

                ) : (

                  <div className="overflow-x-auto">

                    <table className="w-full text-left border-collapse">

                      <thead>

                        <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider">

                          <th className="p-3 border-b border-slate-100">Tarikh</th>

                          <th className="p-3 border-b border-slate-100">Resit</th>

                          <th className="p-3 border-b border-slate-100">Blok</th>

                          <th className="p-3 border-b border-slate-100 text-right">Tan</th>

                        </tr>

                      </thead>

                      <tbody className="text-xs font-medium text-slate-700">

                        {rawData.map((row, i) => (

                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">

                            <td className="p-3">{new Date(row.tarikh).toLocaleDateString('ms-MY', { day:'2-digit', month:'short' })}</td>

                            <td className="p-3 font-bold">{row.no_resit}</td>

                            <td className="p-3">B{row.blok}</td>

                            <td className="p-3 text-right font-black text-emerald-600">{row.tan.toFixed(2)}</td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

             </div>

          </div>

        )}

      </main>



      {/* --- MENU NAVIGASI BAWAH --- */}

      <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-full p-1.5 flex justify-between z-50">

        <button onClick={() => setActiveTab('scan')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'scan' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:text-emerald-700'}`}>

          <ScanLine size={16} /> Input

        </button>

        

        {authRole === 'manager' && (

          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:text-emerald-700'}`}>

            <LayoutDashboard size={16} /> Analitik

          </button>

        )}



        <button onClick={() => setActiveTab('sejarah')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sejarah' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:text-emerald-700'}`}>

          <Calendar size={16} /> Sejarah

        </button>

      </nav>

    </div>

  );

}



function FloatingInput({ label, type = "text", value, onChange, step }) {

  return (

    <div className="relative">

      <input required type={type} step={step} value={value} onChange={e => onChange(e.target.value)} placeholder=" " className="block px-4 pb-2.5 pt-6 w-full text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 peer shadow-sm" />

      <label className="absolute text-[10px] text-slate-400 font-black uppercase tracking-widest duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-600">{label}</label>

    </div>

  );

}
