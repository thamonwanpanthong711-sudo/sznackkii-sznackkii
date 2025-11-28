import React from 'react';
import { ReconciliationStats, AnalysisReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardStatsProps {
  stats: ReconciliationStats;
  report: AnalysisReport;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, report }) => {
  // Pastel/Kitty Color Palette
  const pieData = [
    { name: 'Matched', value: stats.matchedCount, color: '#F472B6' }, // Pink-400 (Soft Match)
    { name: 'AI Suggested', value: stats.potentialMatchCount, color: '#C084FC' }, // Purple-400
    { name: 'Variance', value: stats.varianceCount, color: '#FCD34D' }, // Amber-300 (Pastel Yellow)
    { name: 'Bank Only', value: stats.unmatchedBankCount, color: '#60A5FA' }, // Blue-400 (Pastel Blue)
    { name: 'Book Only', value: stats.unmatchedBookCount, color: '#FB7185' }, // Rose-400 (Pastel Red)
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* 1. Summary Cards (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 flex flex-col justify-between hover:shadow-md transition-shadow">
           <span className="text-pink-400 text-xs font-bold uppercase font-cute tracking-wide">Total Bank</span>
           <div className="mt-2">
             <span className="text-2xl font-bold text-gray-700 font-cute">{stats.totalBank}</span>
             <div className="text-xs text-pink-300 mt-1 font-mono">{formatCurrency(stats.totalBankAmount)}</div>
           </div>
         </div>
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 flex flex-col justify-between hover:shadow-md transition-shadow">
           <span className="text-purple-400 text-xs font-bold uppercase font-cute tracking-wide">Total Book</span>
           <div className="mt-2">
             <span className="text-2xl font-bold text-gray-700 font-cute">{stats.totalBook}</span>
             <div className="text-xs text-purple-300 mt-1 font-mono">{formatCurrency(stats.totalBookAmount)}</div>
           </div>
         </div>
         <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-3xl border border-pink-200 flex flex-col justify-between shadow-sm">
           <span className="text-pink-600 text-xs font-bold uppercase font-cute">Matched 💖</span>
           <div className="mt-2">
             <span className="text-2xl font-bold text-pink-600 font-cute">{stats.matchedCount}</span>
             <span className="text-xs text-pink-400 ml-1">items</span>
           </div>
         </div>
         <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-3xl border border-purple-200 flex flex-col justify-between relative overflow-hidden shadow-sm">
           <span className="text-purple-600 text-xs font-bold uppercase relative z-10 font-cute">AI Found ✨</span>
           <div className="mt-2 relative z-10">
             <span className="text-2xl font-bold text-purple-600 font-cute">{stats.potentialMatchCount}</span>
             <span className="text-xs text-purple-400 ml-1">items</span>
           </div>
           <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-100 rounded-full opacity-50"></div>
         </div>
         <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-3xl border border-red-200 flex flex-col justify-between shadow-sm">
           <span className="text-red-500 text-xs font-bold uppercase font-cute">Check Please 🎀</span>
           <div className="mt-2">
             <span className="text-2xl font-bold text-red-500 font-cute">
               {stats.varianceCount + stats.unmatchedBankCount + stats.unmatchedBookCount}
             </span>
             <span className="text-xs text-red-400 ml-1">items</span>
           </div>
         </div>
      </div>

      {/* 2. AI Executive Summary & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: AI Report Text */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
          <div className="flex items-center gap-2 mb-4">
             <div className="bg-pink-100 p-2 rounded-2xl">
                <span className="text-xl">🐱</span>
             </div>
             <h3 className="text-lg font-bold text-gray-800 font-cute">AI Executive Summary</h3>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-2xl mb-6 border border-pink-100 relative">
             <span className="absolute -top-3 -left-2 text-2xl">❝</span>
             <p className="text-gray-700 text-sm leading-relaxed font-medium italic relative z-10 px-2">
               {report.summary}
             </p>
             <span className="absolute -bottom-4 -right-1 text-2xl text-pink-200">❞</span>
          </div>

          <div className="space-y-3">
             {report.insights.map((insight, idx) => (
               <div key={idx} className={`p-4 rounded-2xl border text-sm flex gap-3 shadow-sm transition-transform hover:scale-[1.01] ${
                 insight.type === 'SUCCESS' ? 'bg-green-50 border-green-100 text-green-800' :
                 insight.type === 'WARNING' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                 insight.type === 'CRITICAL' ? 'bg-red-50 border-red-100 text-red-800' :
                 'bg-blue-50 border-blue-100 text-blue-800'
               }`}>
                 <div className="shrink-0 mt-0.5">
                   {insight.type === 'SUCCESS' && <span className="text-lg">✅</span>}
                   {insight.type === 'WARNING' && <span className="text-lg">⚠️</span>}
                   {insight.type === 'INFO' && <span className="text-lg">💡</span>}
                   {insight.type === 'CRITICAL' && <span className="text-lg">🚨</span>}
                 </div>
                 <div>
                   <span className="font-bold block mb-1 font-cute text-base">{insight.title}</span>
                   <span className="opacity-90">{insight.description}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-6">
          {/* Error Distribution Chart */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 h-64">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-cute">Error Breakdown</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.errorDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#fce7f3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10, fill: '#db2777'}} interval={0} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="value" fill="#ec4899" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

           {/* Overall Pie Chart */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-100 h-64 flex flex-col items-center justify-center relative">
            <h4 className="absolute top-4 left-5 text-xs font-bold text-gray-400 uppercase tracking-wider font-cute">Overall Status</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #fbcfe8'}} />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize: '11px', color: '#831843'}} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
               <div className="text-center">
                 <span className="text-3xl font-bold text-pink-500 font-cute">
                    {Math.round((stats.matchedCount / (stats.totalBank || 1)) * 100)}%
                 </span>
                 <p className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">Match Rate</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Strategic Recommendations */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-3xl shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-10 -translate-y-4">🐾</div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10 font-cute">
          <span className="bg-white/20 p-1.5 rounded-lg">👑</span>
          Strategic Recommendations (AI Advisor)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {report.recommendations.map((rec, idx) => (
             <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex gap-3 items-start shadow-inner">
               <div className="bg-white text-pink-500 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-sm">
                 {idx + 1}
               </div>
               <p className="text-sm text-pink-50 leading-relaxed font-medium">{rec}</p>
             </div>
          ))}
          {report.recommendations.length === 0 && (
            <p className="text-pink-100 italic opacity-80">ไม่พบคำแนะนำเพิ่มเติม ระบบบัญชีของคุณมีประสิทธิภาพสูงเยี่ยมยอด! 🌟</p>
          )}
        </div>
      </div>
    </div>
  );
};