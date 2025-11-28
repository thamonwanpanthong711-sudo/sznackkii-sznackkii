import React, { useState } from 'react';
import { MatchStatus, ReconciledItem } from '../types';

interface ResultTableProps {
  items: ReconciledItem[];
}

export const ResultTable: React.FC<ResultTableProps> = ({ items }) => {
  const [activeTab, setActiveTab] = useState<MatchStatus | 'ALL'>('ALL');

  const filteredItems = activeTab === 'ALL' 
    ? items 
    : items.filter(item => item.status === activeTab);

  const tabs = [
    { id: 'ALL', label: 'ทั้งหมด', count: items.length },
    { id: MatchStatus.MATCHED, label: 'จับคู่สำเร็จ', count: items.filter(i => i.status === MatchStatus.MATCHED).length },
    { id: MatchStatus.POTENTIAL_MATCH, label: 'AI แนะนำ', count: items.filter(i => i.status === MatchStatus.POTENTIAL_MATCH).length },
    { id: MatchStatus.VARIANCE, label: 'ยอดเงินไม่ตรง', count: items.filter(i => i.status === MatchStatus.VARIANCE).length },
    { id: MatchStatus.UNMATCHED_BANK, label: 'มีแค่ Bank', count: items.filter(i => i.status === MatchStatus.UNMATCHED_BANK).length },
    { id: MatchStatus.UNMATCHED_BOOK, label: 'มีแค่ Book', count: items.filter(i => i.status === MatchStatus.UNMATCHED_BOOK).length },
  ];

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.MATCHED:
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold shadow-sm">Matched 💚</span>;
      case MatchStatus.POTENTIAL_MATCH:
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-bold shadow-sm flex items-center w-fit gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>AI Suggest ✨</span>;
      case MatchStatus.VARIANCE:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold shadow-sm">Variance ⚠️</span>;
      case MatchStatus.UNMATCHED_BANK:
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold shadow-sm">Bank Only 🏦</span>;
      case MatchStatus.UNMATCHED_BOOK:
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold shadow-sm">Book Only 📒</span>;
    }
  };

  const getConfidenceBadge = (confidence?: 'High' | 'Medium' | 'Low') => {
    if (!confidence) return null;
    const colors = {
      High: 'text-green-600 bg-green-50 border-green-200',
      Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Low: 'text-gray-500 bg-gray-50 border-gray-200'
    };
    return (
      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-lg border font-bold ${colors[confidence]}`}>
        {confidence} Conf.
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-pink-100 bg-pink-50/50 hide-scrollbar p-1 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap focus:outline-none transition-all rounded-2xl font-cute ${
              activeTab === tab.id 
                ? 'bg-white text-pink-600 shadow-sm ring-1 ring-pink-100' 
                : 'text-gray-400 hover:text-pink-500 hover:bg-white/50'
            }`}
          >
            {tab.label} <span className={`ml-1 py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-pink-50">
          <thead className="bg-pink-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-pink-500 uppercase tracking-wider font-cute">สถานะ</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-pink-500 uppercase tracking-wider font-cute">Invoice / Doc No.</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-pink-500 uppercase tracking-wider font-cute">จำนวนเงิน Bank</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-pink-500 uppercase tracking-wider font-cute">จำนวนเงิน Book</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-pink-500 uppercase tracking-wider font-cute">ผลต่าง (Diff)</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-pink-500 uppercase tracking-wider font-cute w-1/3">
                AI Analysis & Suggestion
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-pink-50">
            {filteredItems.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-cute">
                   <span className="text-4xl block mb-2">🐾</span>
                   ไม่พบรายการในหมวดหมู่นี้จ้า
                 </td>
               </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-pink-50/50 transition-colors ${item.status === MatchStatus.POTENTIAL_MATCH ? 'bg-purple-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.bankRecord?.invoice_number || item.bookRecord?.description || '-'}</span>
                      {item.status === MatchStatus.POTENTIAL_MATCH && (
                        <span className="text-xs text-purple-500 flex items-center gap-1 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                           คู่กับ {item.bankRecord?.invoice_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-mono">
                    {item.bankRecord ? item.bankRecord.total_amount.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-mono">
                    {item.bookRecord ? item.bookRecord.amount.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${
                    item.varianceAmount && Math.abs(item.varianceAmount) > 0.01 ? 'text-red-500' : 'text-gray-300'
                  }`}>
                    {item.varianceAmount ? item.varianceAmount.toLocaleString('th-TH', {minimumFractionDigits: 2}) : '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                       {item.suggestion ? (
                         <div className="flex-1 bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                           <div className="flex items-center mb-1">
                              <span className="text-lg mr-1">🔮</span>
                              <span className="font-bold text-purple-700 text-xs uppercase tracking-wide">AI Suggestion</span>
                              {getConfidenceBadge(item.confidence)}
                           </div>
                           <p className="text-gray-600 text-xs leading-relaxed font-medium">{item.suggestion}</p>
                         </div>
                       ) : (
                         <span className="text-gray-400 italic text-xs pl-2 border-l-2 border-gray-100">{item.notes}</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};