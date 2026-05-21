"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import ActivityGraph from "@/components/ActivityGraph";
import {
  Border, getShopItems, purchaseBorder, equipBorder,
  getPowerUpInventory, buyPowerUp, consumeTimeTravelTicket, consumeFutureVoyager,
  PowerUpInventory,
} from "@/services/shopService";
import { BorderPreview } from "@/components/borders";
import { BackButton } from "@/components/BackButton";
import { Check, X } from "lucide-react";
import { CurrencyIcon } from "@/components/CurrencyIcon";

export default function ShopPage() {
  const { user, isLoggedIn, isLoading: authLoading, refreshPoints } = useAuth();
  const router = useRouter();
  const [borders, setBorders] = useState<Border[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [purchasedBorderId, setPurchasedBorderId] = useState<string | null>(null);
  const [purchasedPowerUpId, setPurchasedPowerUpId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Power-ups
  const [inventory, setInventory] = useState<PowerUpInventory | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [usingTicket, setUsingTicket] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [futureDate, setFutureDate] = useState("");
  const [usingVoyager, setUsingVoyager] = useState(false);
  const [selectedTicketDate, setSelectedTicketDate] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
    else if (isLoggedIn) { fetchShopItems(); fetchInventory(); }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchShopItems = async () => {
    setLoading(true);
    try { const d = await getShopItems(); if (d?.success) { setBorders(d.data.borders); setUserPoints(d.data.userPoints); } }
    finally { setLoading(false); }
  };
  const fetchInventory = async () => {
    const d = await getPowerUpInventory();
    if (d?.success) { 
      setInventory(d.data); 
      setUserPoints(d.data.userPoints);
      if (d.data.streakStatus?.missedDates && d.data.streakStatus.missedDates.length > 0) {
        setSelectedTicketDate(d.data.streakStatus.missedDates[0]);
      }
    }
  };

  const handlePurchase = async (borderId: string) => {
    setPurchasing(borderId); setMessage(null);
    try {
      const r = await purchaseBorder(borderId);
      if (r?.success) { setMessage({ type: "success", text: r.message }); setUserPoints(r.data?.newPoints || userPoints); setBorders(p => p.map(b => b.id === borderId ? { ...b, owned: true } : b)); setPurchasedBorderId(borderId); setTimeout(() => setPurchasedBorderId(null), 2000); await refreshPoints(); }
      else setMessage({ type: "error", text: r?.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Error" }); } finally { setPurchasing(null); }
  };
  const handleEquip = async (borderId: string) => {
    setEquipping(borderId); setMessage(null);
    try {
      const r = await equipBorder(borderId);
      if (r?.success) { setBorders(p => p.map(b => ({ ...b, equipped: b.id === borderId }))); await refreshPoints(); router.push("/profile"); }
      else setMessage({ type: "error", text: r?.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Error" }); } finally { setEquipping(null); }
  };

  const handleBuy = async (type: "timeTravelTicket" | "futureVoyager") => {
    setBuying(type); setMessage(null);
    try {
      const r = await buyPowerUp(type);
      if (r?.success) { 
        setMessage({ type: "success", text: r.message }); 
        setUserPoints(r.data?.newPoints || userPoints); 
        setPurchasedPowerUpId(type);
        setTimeout(() => setPurchasedPowerUpId(null), 1500);
        await refreshPoints(); 
        await fetchInventory(); 
      }
      else setMessage({ type: "error", text: r?.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Error" }); } finally { setBuying(null); }
  };

  const handleUseTicket = async (date: string) => {
    if (!date) return;
    setUsingTicket(true); setMessage(null);
    try {
      const r = await consumeTimeTravelTicket(date);
      if (r?.success) {
        setMessage({ type: "success", text: r.message });
        await refreshPoints();
        await fetchInventory();
        setShowCalendar(false);
        // Notify StreakIcon in navbar to refresh immediately
        window.dispatchEvent(new Event("streak-updated"));
      }
      else setMessage({ type: "error", text: r?.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Error" }); } finally { setUsingTicket(false); }
  };

  const handleUseVoyager = async () => {
    if (!futureDate) return;
    setUsingVoyager(true); setMessage(null);
    try {
      const r = await consumeFutureVoyager(futureDate);
      if (r?.success) { setMessage({ type: "success", text: r.message }); await refreshPoints(); await fetchInventory(); setShowDatePicker(false); setFutureDate(""); window.dispatchEvent(new Event("streak-updated")); }
      else setMessage({ type: "error", text: r?.message || "Failed" });
    } catch { setMessage({ type: "error", text: "Error" }); } finally { setUsingVoyager(false); }
  };

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowValue = tomorrowObj.toISOString().split("T")[0];
  const tomorrowLabel = `Tomorrow (${tomorrowObj.getDate().toString().padStart(2, '0')}/${(tomorrowObj.getMonth() + 1).toString().padStart(2, '0')}/${tomorrowObj.getFullYear().toString().slice(-2)})`;

  const dayAfterObj = new Date();
  dayAfterObj.setDate(dayAfterObj.getDate() + 2);
  const dayAfterValue = dayAfterObj.toISOString().split("T")[0];
  const dayAfterLabel = `Day After (${dayAfterObj.getDate().toString().padStart(2, '0')}/${(dayAfterObj.getMonth() + 1).toString().padStart(2, '0')}/${dayAfterObj.getFullYear().toString().slice(-2)})`;

  if (authLoading || !isLoggedIn || !user) return <ZeroGravityLoading title="Loading" subtitle="Preparing shop..." showNavigation={false} />;

  const tt = inventory?.timeTravelTickets;
  const fv = inventory?.futureVoyagers;
  const streak = inventory?.streakStatus;

  return (
    <DashboardLayout>
      <div className="mt-2 mb-8 md:mb-12 space-y-5 md:space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton />
              <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">Shop</h1>
            </div>
            <div className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm md:text-lg font-semibold text-black dark:text-white">{userPoints.toLocaleString()}</span>
              <CurrencyIcon size={12} className="text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-2.5 text-xs md:text-sm ${message.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700"}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── POWER-UPS ─── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {/* <Zap className="w-4 h-4 text-amber-500" /> */}
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Power-Ups</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">

                {/* ── Time Travel Ticket ── */}
                <div className={`bg-white dark:bg-[#141821] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow ${purchasedPowerUpId === "timeTravelTicket" ? "animate-powerup-premium" : ""}`}>
                  {/* Card inner — dark area with icon and description */}
                  <div className="mx-3 mt-3 rounded-lg bg-gradient-to-br from-[#2a2a2e] to-[#1a1a1e] dark:from-[#1a1d26] dark:to-[#0e1018] p-5 md:p-6 text-center relative overflow-hidden">
                    {/* Subtle glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                    {/* Icon */}
                    <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-[8deg]">
                        <div className="w-[85%] h-[85%] rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center -rotate-[8deg]">
                          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Description */}
                    <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
                      Travel Back in Time to<br />
                      Bridge <span className="font-bold text-white text-lg">1</span> Missing Streak Day
                    </p>

                    {/* Monthly Limit badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/40 dark:bg-black/60 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                      {Math.max(0, (tt?.monthlyLimit || 5) - (tt?.monthlyPurchased || 0))} left/mo
                    </div>
                    {/* Inventory badge */}
                    <div className="absolute top-2.5 right-2.5 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {tt?.owned || 0}/{tt?.max || 10}
                    </div>
                  </div>
                  {/* Card footer — name, price, actions */}
                  <div className="px-3 py-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-black dark:text-white">Time Travel Ticket</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">For Daily Task Streak</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-black dark:text-white">{tt?.price || 500}</span>
                        <CurrencyIcon size={8} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBuy("timeTravelTicket")}
                        disabled={buying === "timeTravelTicket" || (tt?.owned || 0) >= (tt?.max || 7) || userPoints < (tt?.price || 500) || (tt?.monthlyPurchased || 0) >= (tt?.monthlyLimit || 5)}
                        className="flex-1 py-2 text-xs md:text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {buying === "timeTravelTicket" ? "..." : (tt?.owned || 0) >= (tt?.max || 7) ? `Max (${tt?.max})` : (tt?.monthlyPurchased || 0) >= (tt?.monthlyLimit || 5) ? "Limit Reached" : "Buy"}
                      </button>
                      {(tt?.owned || 0) > 0 && (
                        <button onClick={() => setShowCalendar(true)} className="flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm">
                          View & Use
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* ── Future Voyager ── */}
                <div className={`bg-white dark:bg-[#141821] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow ${purchasedPowerUpId === "futureVoyager" ? "animate-powerup-premium" : ""}`}>
                  <div className="mx-3 mt-3 rounded-lg bg-gradient-to-br from-[#2a2a2e] to-[#1a1a1e] dark:from-[#1a1d26] dark:to-[#0e1018] p-5 md:p-6 text-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
                    <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 rotate-[-6deg]">
                        <div className="w-[85%] h-[85%] rounded-lg bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center rotate-[6deg]">
                          <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed">
                      Voyage to the Future and<br />
                      Pre-Complete <span className="font-bold text-white text-lg">1</span> Day&apos;s Tasks
                    </p>

                    {/* Monthly Limit badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/40 dark:bg-black/60 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                      {Math.max(0, (fv?.monthlyLimit || 5) - (fv?.monthlyPurchased || 0))} left/mo
                    </div>
                    {/* Inventory badge */}
                    <div className="absolute top-2.5 right-2.5 bg-violet-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {fv?.owned || 0}/{fv?.max || 5}
                    </div>
                  </div>
                  <div className="px-3 py-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-black dark:text-white">Future Voyager</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">For Daily Tasks · Max 2 days ahead</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-black dark:text-white">{fv?.price || 400}</span>
                        <CurrencyIcon size={8} />
                      </div>
                    </div>
                    {/* Actions */}
                    {showDatePicker ? (
                      <div className="space-y-2 text-left">
                        <div className="relative">
                          <select 
                            value={futureDate} 
                            onChange={e => setFutureDate(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500 appearance-none pr-8 cursor-pointer transition-colors"
                          >
                            <option value="" disabled>Select Date...</option>
                            <option value={tomorrowValue}>{tomorrowLabel}</option>
                            <option value={dayAfterValue}>{dayAfterLabel}</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => { setShowDatePicker(false); setFutureDate(""); }} className="flex-1 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                          <button onClick={handleUseVoyager} disabled={!futureDate || usingVoyager} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50 shadow-sm transition-all">
                            {usingVoyager ? "..." : "Confirm"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBuy("futureVoyager")}
                          disabled={buying === "futureVoyager" || (fv?.owned || 0) >= (fv?.max || 7) || userPoints < (fv?.price || 400) || (fv?.monthlyPurchased || 0) >= (fv?.monthlyLimit || 5)}
                          className="flex-1 py-2 text-xs md:text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {buying === "futureVoyager" ? "..." : (fv?.owned || 0) >= (fv?.max || 7) ? `Max (${fv?.max})` : (fv?.monthlyPurchased || 0) >= (fv?.monthlyLimit || 5) ? "Limit Reached" : "Buy"}
                        </button>
                        {(fv?.owned || 0) > 0 && (
                          <button onClick={() => setShowDatePicker(true)} className="flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg bg-violet-500 hover:bg-violet-600 text-white transition-colors shadow-sm">
                            Use
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* ─── PROFILE BORDERS ─── */}
            <div className="space-y-3">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Profile Borders</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {borders.map(border => (
                  <div key={border.id} className={`relative border p-4 md:p-8 bg-white dark:bg-gray-800 flex flex-col min-h-[260px] md:min-h-[420px] transition-all hover:shadow-lg hover:scale-[1.02] ${purchasedBorderId === border.id ? "animate-purchase-premium" : ""} ${border.equipped ? "border-green-500 dark:border-green-400 shadow-md shadow-green-500/20" : "border-gray-200 dark:border-gray-700"}`}>
                    <div className="absolute top-2.5 right-2.5 md:hidden flex items-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{border.price.toLocaleString()}</span>
                      <CurrencyIcon size={8} className="text-gray-500" />
                    </div>
                    {border.owned && (
                      <div className={`absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-xs font-medium text-green-600 dark:text-green-400 ${border.equipped ? "hidden md:flex" : ""}`}>
                        {border.equipped && <Check className="w-3 h-3" />}
                        <span>{border.equipped ? "Equipped" : "Owned"}</span>
                      </div>
                    )}
                    <div className="flex justify-center mb-3 md:mb-6 mt-6 md:mt-8">
                      <BorderPreview border={border} profilePicture={user.profilePicture} firstName={user.firstName} lastName={user.lastName} size="sm" className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36" />
                    </div>
                    <div className="text-center flex-grow">
                      <h3 className="text-base md:text-lg font-semibold text-black dark:text-white mb-1 md:mb-3">{border.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 px-2">{border.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="hidden md:flex items-center">
                        <span className="text-sm font-medium text-black dark:text-white">{border.price.toLocaleString()}</span>
                        <CurrencyIcon size={10} className="text-gray-400" />
                      </div>
                      <div className="w-full md:w-auto flex justify-center md:justify-end">
                        {border.owned ? (border.equipped ? <span className="text-xs md:text-sm text-green-600 dark:text-green-400">Equipped</span> : <button onClick={() => handleEquip(border.id)} disabled={equipping === border.id} className="px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 w-full md:w-auto">{equipping === border.id ? "..." : "Equip"}</button>) : (
                          <button onClick={() => handlePurchase(border.id)} disabled={purchasing === border.id || userPoints < border.price} className={`px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm transition-colors disabled:opacity-50 w-full md:w-auto ${userPoints >= border.price ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"}`}>
                            {purchasing === border.id ? "..." : userPoints < border.price ? "Insufficient" : "Purchase"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Activity Calendar Modal ─── */}
      {showCalendar && (
        <div className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="text-sm md:text-base font-semibold text-black dark:text-white">Activity Calendar</h3>
              <button onClick={() => setShowCalendar(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6">
              <ActivityGraph 
                className="border-0" 
                selectedDate={selectedTicketDate}
                onDateClick={(date) => {
                  const today = new Date().toISOString().split("T")[0];
                  if (date < today) {
                    setSelectedTicketDate(date);
                  }
                }}
              />
              {(tt?.owned || 0) > 0 && (
                <div className="mt-6 flex gap-2">
                  <select
                    id="missedDateSelect"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={selectedTicketDate || streak?.missedDates?.[0] || ""}
                    onChange={(e) => setSelectedTicketDate(e.target.value)}
                  >
                    {streak?.missedDates?.map(d => <option key={d} value={d}>{d}</option>)}
                    {selectedTicketDate && !streak?.missedDates?.includes(selectedTicketDate) && (
                      <option value={selectedTicketDate}>{selectedTicketDate}</option>
                    )}
                  </select>
                  <button
                    onClick={() => handleUseTicket(selectedTicketDate || streak?.missedDates?.[0] || "")}
                    disabled={usingTicket || !selectedTicketDate}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    {usingTicket ? "Using..." : "Use 1 Ticket"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
