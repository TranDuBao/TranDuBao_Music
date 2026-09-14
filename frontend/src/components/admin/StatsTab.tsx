import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, RefreshCw, TrendingUp, Activity, Clock, Globe, Eye, Users, FolderOpen, Music } from 'lucide-react';
import axios from 'axios';
import { formatCount, formatDateLabel } from '../../utils/format';
import { API_BASE, getAbsoluteUrl } from '../../config';

const API = API_BASE;

const formatIP = (rawIp?: string) => {
  if (!rawIp) return '127.0.0.1 (Localhost)';
  let cleanIp = String(rawIp).replace(/^::ffff:/, '');
  if (cleanIp === '::1' || cleanIp === '127.0.0.1') return '127.0.0.1 (Localhost)';
  return cleanIp;
};

const parseDevice = (ua?: string) => {
  if (!ua) return 'Web Browser';
  let os = 'Desktop';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return `${os} • ${browser}`;
};

export function StatsTab({ authH }: { authH: Record<string, string> }) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryTracks, setCategoryTracks] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  // Plays history state
  const [historyView, setHistoryView] = useState<'day' | 'month' | 'year'>('day');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [historyDetails, setHistoryDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Custom date filter state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Website visits state
  const [visitsData, setVisitsData] = useState<any>({});
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visibleLoginsCount, setVisibleLoginsCount] = useState(15);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats`, { headers: authH });
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryStats = async (view: 'day' | 'month' | 'year', start?: string, end?: string) => {
    setHistoryLoading(true);
    try {
      let url = `${API}/stats/history?view=${view}`;
      if (start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const { data } = await axios.get(url, { headers: authH });
      if (data.success) {
        setHistoryData(data.data.aggregated || []);
        // Reset details when view changes
        setSelectedPeriod(null);
        setHistoryDetails(null);
      }
    } catch (err) {
      console.error('History stats error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchVisitsStats = async () => {
    setVisitsLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats/visits`, { headers: authH });
      if (data.success) {
        setVisitsData(data.data || {});
      }
    } catch (err) {
      console.error('Visits stats error:', err);
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchPeriodDetails = async (periodLabel: string) => {
    setSelectedPeriod(periodLabel);
    setDetailsLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats/history?date=${periodLabel}`, { headers: authH });
      if (data.success) {
        setHistoryDetails(data.data);
      }
    } catch (err) {
      console.error('Period details error:', err);
      setHistoryDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    fetchHistoryStats(historyView);
  };

  const refreshAll = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    fetchStats();
    fetchHistoryStats(historyView);
    fetchVisitsStats();
    setSelectedPeriod(null);
    setHistoryDetails(null);
  };

  useEffect(() => {
    fetchStats();
    fetchHistoryStats(historyView);
    fetchVisitsStats();

    // Auto-refresh live access statistics every 10 seconds
    const interval = setInterval(() => {
      fetchVisitsStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleHistoryViewChange = (view: 'day' | 'month' | 'year') => {
    setHistoryView(view);
    setCustomStartDate('');
    setCustomEndDate('');
    fetchHistoryStats(view);
  };



  const fetchCategoryTracks = async (cat: any) => {
    setSelectedCategory(cat);
    setCatLoading(true);
    try {
      const catId = cat.categoryId ?? 'null';
      const { data } = await axios.get(`${API}/stats/category-tracks?categoryId=${catId}`, { headers: authH });
      if (data.success) setCategoryTracks(data.data);
    } catch { setCategoryTracks([]); }
    finally { setCatLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-zinc-500 text-sm">{isVi ? 'Không thể tải thống kê.' : 'Could not load statistics.'}</p>
      <button onClick={refreshAll} className="text-amber-400 hover:text-amber-300 text-xs underline">
        {isVi ? 'Thử lại' : 'Retry'}
      </button>
    </div>
  );

  // Plays history chart math
  const maxHistory = Math.max(1, ...historyData.map((d: any) => Number(d.count)));



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-amber-400 animate-pulse" />
          {isVi ? 'Thống kê hệ thống' : 'System Statistics'}
        </h3>
        <button onClick={refreshAll} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          {isVi ? 'Làm mới' : 'Refresh'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: isVi ? 'Người dùng' : 'Users', value: stats.totalUsers ?? 0, icon: '👤', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.05)]' },
          { label: isVi ? 'Bài hát' : 'Tracks', value: stats.totalTracks ?? 0, icon: '🎵', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_4px_20px_rgba(168,85,247,0.05)]' },
          { label: isVi ? 'Lượt nghe' : 'Total Plays', value: formatCount(Number(stats.totalPlays ?? 0)), icon: '▶️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' },
          { label: isVi ? 'Yêu thích' : 'Favorites', value: stats.totalFavorites ?? 0, icon: '❤️', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.05)]' },
        ] as const).map(card => (
          <div key={card.label} className={`rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] ${card.bg}`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Plays History Section */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-4 mb-5 border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                {isVi ? 'Biểu đồ hoạt động nghe nhạc' : 'Music Streaming Activities'}
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {isVi ? 'Bấm vào cột mốc để xem báo cáo chi tiết hoặc chọn lọc ngày tùy ý' : 'Click on any bar to drill down or filter by custom dates'}
              </p>
            </div>
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-white/5 self-start sm:self-auto">
              {(['day', 'month', 'year'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => handleHistoryViewChange(v)}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all ${
                    historyView === v
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {v === 'day' ? (isVi ? 'Ngày' : 'Day') : v === 'month' ? (isVi ? 'Tháng' : 'Month') : (isVi ? 'Năm' : 'Year')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker Inputs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs">
            <span className="text-zinc-400 text-[10px] font-semibold">{isVi ? 'Lọc theo ngày tự chọn:' : 'Custom date filter:'}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs sm:text-[10px] focus:outline-none focus:border-indigo-500/50"
              />
              <span className="text-zinc-600 text-[10px]">—</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded px-2.5 py-1.5 text-white text-xs sm:text-[10px] focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={() => fetchHistoryStats(historyView, customStartDate, customEndDate)}
                disabled={!customStartDate || !customEndDate}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold px-3 py-1.5 sm:py-1 rounded transition-all cursor-pointer"
              >
                {isVi ? 'Lọc' : 'Filter'}
              </button>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={handleClearFilter}
                  className="text-zinc-400 hover:text-white text-xs sm:text-[10px] underline px-1 py-1 cursor-pointer"
                >
                  {isVi ? 'Xóa lọc' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="h-36 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyData.length > 0 ? (
          <div className="relative h-44 flex flex-col justify-end">
            {/* Gridlines */}
            <div className="absolute inset-x-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
              <div className="w-full border-t border-dashed border-white/40" />
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="min-w-[600px] sm:min-w-0 flex items-end gap-2.5 h-36 z-10">
                {historyData.map((d: any, i: number) => {
                  const cnt = Number(d.count);
                  const pct = Math.max(5, Math.round((cnt / maxHistory) * 100));
                  const label = formatDateLabel(String(d.label || ''), historyView);
                  const isSelected = selectedPeriod === d.label;

                  return (
                    <div
                      key={i}
                      onClick={() => fetchPeriodDetails(d.label)}
                      className="flex-1 h-full flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <span className={`text-[9px] font-bold transition-all duration-300 ${
                        isSelected ? 'text-indigo-400 scale-110' : 'text-zinc-400 opacity-0 group-hover:opacity-100'
                      }`}>
                        {cnt}
                      </span>
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          className={`w-3 md:w-4 rounded-t-md transition-all duration-300 bg-gradient-to-t ${
                            isSelected
                              ? 'from-indigo-400 to-fuchsia-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-indigo-300/20'
                              : 'from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400 hover:shadow-[0_0_12px_rgba(99,102,241,0.5)] border border-transparent'
                          }`}
                          style={{ height: `${pct}%` }}
                          title={`${label}: ${cnt} ${isVi ? 'lượt nghe' : 'plays'}`}
                        />
                      </div>
                      <span className={`text-[9px] truncate w-full text-center transition-colors ${
                        isSelected ? 'text-indigo-400 font-bold' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}>
                        {label.length > 7 ? label.slice(0, 5) : label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-36 flex items-center justify-center text-zinc-600 text-sm">
            {isVi ? 'Chưa có dữ liệu lượt nghe.' : 'No play data yet.'}
          </div>
        )}
      </div>

      {/* Plays Drill-down Details Card */}
      {selectedPeriod && (
        <div className="bg-zinc-900/60 border border-violet-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-pink-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white">
                {isVi ? 'Chi tiết hoạt động: ' : 'Activity Details: '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">
                  {formatDateLabel(selectedPeriod, historyView)}
                </span>
              </h4>
            </div>
            <button
              onClick={() => { setSelectedPeriod(null); setHistoryDetails(null); }}
              className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
            >
              ✕ {isVi ? 'Đóng' : 'Close'}
            </button>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historyDetails ? (
            <div className="space-y-6">
              {/* Top details cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total plays */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold">
                    ▶
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Tổng lượt nghe' : 'Total Plays'}</p>
                    <p className="text-lg font-bold text-white">{historyDetails.totalPlays ?? 0}</p>
                  </div>
                </div>

                {/* Date range descriptor */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                    📅
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Thời gian' : 'Period'}</p>
                    <p className="text-sm font-bold text-white capitalize">
                      {historyView === 'day' ? (isVi ? 'Ngày đơn lẻ' : 'Single Day') : historyView === 'month' ? (isVi ? 'Toàn bộ tháng' : 'Entire Month') : (isVi ? 'Toàn bộ năm' : 'Entire Year')}
                    </p>
                  </div>
                </div>

                {/* Unique played tracks count */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">
                    🎵
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{isVi ? 'Số bài hát phát sinh' : 'Unique Tracks Played'}</p>
                    <p className="text-lg font-bold text-white">{(historyDetails.topTracks || []).length}</p>
                  </div>
                </div>
              </div>

              {/* Detail graphs & tables grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Distribution chart */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                    {historyDetails.distributionLabel === 'hour'
                      ? (isVi ? 'Biểu đồ phân bổ theo giờ' : 'Hourly Distribution')
                      : historyDetails.distributionLabel === 'day'
                        ? (isVi ? 'Biểu đồ phân bổ theo ngày' : 'Daily Distribution')
                        : (isVi ? 'Biểu đồ phân bổ theo tháng' : 'Monthly Distribution')}
                  </h5>
                  {historyDetails.distributionStats && historyDetails.distributionStats.length > 0 ? (
                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <div className="min-w-[480px] sm:min-w-0 flex items-end gap-1.5 h-32 pt-4">
                        {(() => {
                          const maxDist = Math.max(1, ...historyDetails.distributionStats.map((x: any) => Number(x.count)));
                          return historyDetails.distributionStats.map((item: any, idx: number) => {
                            const distPct = Math.max(6, Math.round((Number(item.count) / maxDist) * 100));
                            let label = item.period;
                            if (historyDetails.distributionLabel === 'hour') label = `${item.period}h`;
                            else if (historyDetails.distributionLabel === 'day') label = label.slice(8, 10) + '/' + label.slice(5, 7);
                            else if (historyDetails.distributionLabel === 'month') label = label.slice(5, 7);
                            
                            return (
                              <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group cursor-default">
                                <span className="text-[8px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </span>
                                <div className="w-full flex-1 flex items-end justify-center">
                                  <div
                                    className="w-1.5 md:w-2 rounded-t-sm bg-gradient-to-t from-pink-600 to-rose-400 group-hover:from-pink-500 group-hover:to-orange-400 transition-all"
                                    style={{ height: `${distPct}%` }}
                                    title={`${label}: ${item.count}`}
                                  />
                                </div>
                                <span className="text-[8px] text-zinc-500 truncate w-full text-center">
                                  {label}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-xs py-8 text-center">{isVi ? 'Không có dữ liệu phân bổ.' : 'No distribution data.'}</p>
                  )}
                </div>

                {/* Top tracks during this period */}
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                    🔥 {isVi ? 'Top bài nghe nhiều nhất thời kỳ này' : 'Most Played Tracks in this Period'}
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(historyDetails.topTracks || []).map((t: any, i: number) => (
                      <div key={t.id} className="flex items-center gap-2.5">
                        <span className="text-[9px] text-zinc-600 w-4 text-right flex-shrink-0 font-bold">{i + 1}</span>
                        {t.cover_url ? (
                          <img src={getAbsoluteUrl(t.cover_url)} className="w-7 h-7 rounded object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                            <Music className="w-3 h-3 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-200 truncate">{t.title}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{t.artist}</p>
                        </div>
                        <span className="text-[10px] text-pink-400 font-bold flex-shrink-0">{t.plays} {isVi ? 'lượt' : 'plays'}</span>
                      </div>
                    ))}
                    {!(historyDetails.topTracks || []).length && (
                      <p className="text-xs text-zinc-600 text-center py-8">{isVi ? 'Chưa có bài hát nào được phát.' : 'No tracks played.'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity log list */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                <h5 className="text-xs font-bold text-zinc-300 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {isVi ? 'Nhật ký lượt nghe thời kỳ này' : 'Play Activity Log in this Period'}
                </h5>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(historyDetails.playsList || []).map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.02] last:border-0 text-[11px]">
                      <span className="text-zinc-500 flex-shrink-0 w-24 truncate">
                        {new Date(a.played_at).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(a.played_at).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className="text-zinc-300 flex-1 truncate font-medium">{a.title}</span>
                      <span className="text-zinc-500 truncate max-w-[90px] hidden sm:block">{a.artist}</span>
                      <span className="text-purple-400 flex-shrink-0 truncate max-w-[80px]">{a.user_name || 'Guest'}</span>
                    </div>
                  ))}
                  {!(historyDetails.playsList || []).length && (
                    <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có nhật ký.' : 'No activity logs.'}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-zinc-500 text-xs">{isVi ? 'Không thể tải chi tiết.' : 'Could not fetch details.'}</p>
          )}
        </div>
      )}

      {/* Website Access & User Login Statistics Section */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {isVi ? 'Thống kê lượng truy cập & Đăng nhập' : 'Access & Login Statistics'}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {isVi 
                ? 'Tổng số lượng truy cập trong ngày, danh sách user và giờ đăng nhập chi tiết' 
                : 'Total daily visits, logged-in user details, and access logs'}
            </p>
          </div>
          <button
            onClick={() => fetchVisitsStats()}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${visitsLoading ? 'animate-spin' : ''}`} />
            {isVi ? 'Làm mới' : 'Refresh'}
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'Lượt truy cập hôm nay' : 'Visits Today'}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white">{visitsData?.todayVisits ?? 0}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                  {isVi ? 'Hôm nay' : 'Today'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'User đăng nhập hôm nay' : 'Logged-in Today'}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white">{visitsData?.todayUsersCount ?? 0}</span>
                <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full font-medium border border-teal-500/20">
                  {isVi ? 'Tài khoản' : 'Accounts'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'Tổng truy cập tích lũy' : 'Total All-time Visits'}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-white">{visitsData?.totalVisits ?? 0}</span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium border border-indigo-500/20">
                  {isVi ? 'Tất cả' : 'All time'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table 1: Today's Logged-in Users */}
        <div className="space-y-3">
          <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            {isVi ? 'Danh sách User đăng nhập hôm nay' : 'Today Logged-in Users'}
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              {(visitsData?.todayUsers || []).length}
            </span>
          </h5>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-zinc-400">
                  <th className="py-2.5 px-3 font-medium">{isVi ? 'Tên User' : 'User Name'}</th>
                  <th className="py-2.5 px-3 font-medium">{isVi ? 'Tên đăng nhập / Email' : 'Username / Email'}</th>
                  <th className="py-2.5 px-3 font-medium text-center">{isVi ? 'Số lần truy cập' : 'Visits'}</th>
                  <th className="py-2.5 px-3 font-medium text-right">{isVi ? 'Lần truy cập cuối (Giờ)' : 'Last Access Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {(visitsData?.todayUsers || []).map((u: any, idx: number) => {
                  const avatarUrl = u.avatar_url ? getAbsoluteUrl(u.avatar_url) : null;
                  const formattedTime = u.last_visit ? new Date(u.last_visit).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                              {(u.user_name || u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">{u.user_name || (isVi ? 'Chưa đặt tên' : 'No name')}</p>
                            {u.role === 'admin' && (
                              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                        {u.email || u.provider || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {u.visit_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-300 font-mono text-[11px]">
                        <span className="flex items-center justify-end gap-1 text-teal-400 font-semibold">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formattedTime}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {(!visitsData?.todayUsers || visitsData.todayUsers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs">
                      {isVi ? 'Chưa có user đăng nhập nào truy cập hôm nay.' : 'No logged-in users accessed today yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Logins & Access Audit */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {isVi ? 'Nhật ký truy cập & Đăng nhập mới nhất' : 'Recent Access & Login Logs'}
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
                {Math.min(visibleLoginsCount, (visitsData?.recentLogins || []).length)} / {(visitsData?.recentLogins || []).length}
              </span>
            </h5>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-zinc-400">
                  <th className="py-2.5 px-3 font-medium">{isVi ? 'Giờ truy cập' : 'Time'}</th>
                  <th className="py-2.5 px-3 font-medium">{isVi ? 'Tên User' : 'User Name'}</th>
                  <th className="py-2.5 px-3 font-medium">{isVi ? 'Tên đăng nhập / Email' : 'Email / Account'}</th>
                  <th className="py-2.5 px-3 font-medium text-right">{isVi ? 'Địa chỉ IP / Thiết bị' : 'IP / Device'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {(visitsData?.recentLogins || []).slice(0, visibleLoginsCount).map((log: any, idx: number) => {
                  const visitDate = log.visited_at ? new Date(log.visited_at) : null;
                  const formattedDateTime = visitDate 
                    ? `${visitDate.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${visitDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })})`
                    : '-';
                  
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-indigo-300 font-mono text-[11px]">
                        {formattedDateTime}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${log.user_id ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span className="font-semibold text-white">
                            {log.user_name || (isVi ? 'Khách (Guest)' : 'Guest')}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                        {log.email || (log.user_id ? log.provider || 'Local' : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                        <p className="text-zinc-200 font-semibold">{formatIP(log.ip)}</p>
                        <p className="text-[10px] text-indigo-400 font-sans mt-0.5">{parseDevice(log.user_agent)}</p>
                      </td>
                    </tr>
                  );
                })}

                {(!visitsData?.recentLogins || visitsData.recentLogins.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500 text-xs">
                      {isVi ? 'Chưa có nhật ký truy cập.' : 'No access logs recorded.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(visitsData?.recentLogins || []).length > visibleLoginsCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleLoginsCount(prev => prev + 10)}
                className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg"
              >
                <span>{isVi ? 'Xem thêm (+10)' : 'Load more (+10)'}</span>
                <span className="text-[10px] text-zinc-500">
                  ({isVi ? `Còn ${visitsData.recentLogins.length - visibleLoginsCount} nhật ký` : `${visitsData.recentLogins.length - visibleLoginsCount} left`})
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top tracks */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3">
            {isVi ? '🔥 Top bài nghe nhiều nhất' : '🔥 Most Played Tracks'}
          </h4>
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {(stats.topTracks || []).slice(0, 8).map((t: any, i: number) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-600 w-5 text-right flex-shrink-0 font-bold">{i + 1}</span>
                {t.cover_url ? (
                  <img src={getAbsoluteUrl(t.cover_url)} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(Number(t.play_count || 0))}</span>
              </div>
            ))}
            {!(stats.topTracks || []).length && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có lượt nghe.' : 'No plays yet.'}</p>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            {isVi ? 'Theo danh mục' : 'By Category'}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(stats.genreStats || []).map((g: any, i: number) => {
              const maxPlays = Math.max(1, ...(stats.genreStats || []).map((x: any) => Number(x.plays)));
              const pct = Math.round((Number(g.plays) / maxPlays) * 100);
              return (
                <button key={i} onClick={() => fetchCategoryTracks(g)}
                  className={`w-full text-left rounded-lg p-2 transition-all hover:bg-white/5 ${selectedCategory?.genre === g.genre ? 'ring-1 ring-amber-500/40 bg-amber-500/5' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-300 truncate">{g.genre}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-500">{g.count} {isVi ? 'bài' : 'tracks'}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{formatCount(Number(g.plays))}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color || '#7c3aed' }} />
                  </div>
                </button>
              );
            })}
            {!(stats.genreStats || []).length && (
              <p className="text-xs text-zinc-600 text-center py-6">{isVi ? 'Chưa có danh mục.' : 'No categories.'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Category tracks drill-down */}
      {selectedCategory && (
        <div className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">
              {isVi ? 'Bài hát trong: ' : 'Tracks in: '}
              <span style={{ color: selectedCategory.color || '#a78bfa' }}>{selectedCategory.genre}</span>
            </h4>
            <button onClick={() => { setSelectedCategory(null); setCategoryTracks([]); }}
              className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-all">✕</button>
          </div>
          {catLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {categoryTracks.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
                  <span className="text-[10px] text-zinc-600 w-4">{i + 1}</span>
                  {t.cover_url ? (
                    <img src={getAbsoluteUrl(t.cover_url)} className="w-7 h-7 rounded-md object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                      <Music className="w-3 h-3 text-zinc-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">{formatCount(Number(t.plays || 0))}</span>
                </div>
              ))}
              {!categoryTracks.length && (
                <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có bài hát.' : 'No tracks.'}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          {isVi ? 'Hoạt động gần đây' : 'Recent Activity'}
        </h4>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {(stats.recentActivity || []).map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0 text-xs">
              <span className="text-[10px] text-zinc-600 flex-shrink-0 w-28 truncate">
                {new Date(a.played_at).toLocaleString(isVi ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </span>
              <span className="text-zinc-200 flex-1 truncate font-medium">{a.title}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[80px] hidden md:block">{a.artist}</span>
              <span className="text-[10px] text-purple-400 flex-shrink-0 truncate max-w-[80px]">{a.user_name || 'Guest'}</span>
            </div>
          ))}
          {!(stats.recentActivity || []).length && (
            <p className="text-xs text-zinc-600 text-center py-4">{isVi ? 'Chưa có hoạt động.' : 'No recent activity.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
