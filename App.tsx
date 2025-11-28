import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DashboardStats } from './components/DashboardStats';
import { ResultTable } from './components/ResultTable';
import { parseBankCSV, parseBookCSV, reconcileData } from './services/reconcileService';
import { BankRecord, BookRecord, ReconciledItem, ReconciliationStats, ReconcileResult } from './types';

function App() {
  const [bankData, setBankData] = useState<BankRecord[]>([]);
  const [bookData, setBookData] = useState<BookRecord[]>([]);
  
  const [bankFileName, setBankFileName] = useState<string | null>(null);
  const [bookFileName, setBookFileName] = useState<string | null>(null);

  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-reconcile when both files are loaded
  useEffect(() => {
    if (bankData.length > 0 && bookData.length > 0) {
      setLoading(true);
      // Small timeout to allow UI to show loading state
      setTimeout(() => {
        const result = reconcileData(bankData, bookData);
        setReconcileResult(result);
        setLoading(false);
      }, 500);
    }
  }, [bankData, bookData]);

  const handleBankUpload = (content: string, name: string) => {
    try {
      const records = parseBankCSV(content);
      setBankData(records);
      setBankFileName(name);
    } catch (e) {
      alert("Error parsing Bank CSV. Please check file format.");
    }
  };

  const handleBookUpload = (content: string, name: string) => {
    try {
      const records = parseBookCSV(content);
      setBookData(records);
      setBookFileName(name);
    } catch (e) {
      alert("Error parsing Book CSV. Please check file format.");
    }
  };

  const handleReset = () => {
    setBankData([]);
    setBookData([]);
    setBankFileName(null);
    setBookFileName(null);
    setReconcileResult(null);
  };

  return (
    <div className="min-h-screen pb-20 bg-kitty-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-400 to-primary text-white shadow-lg sticky top-0 z-50 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 backdrop-blur-sm p-2 rounded-2xl border-2 border-white/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
               </svg>
             </div>
             <div>
               <h1 className="text-2xl font-bold font-cute tracking-wide">AutoReconcile <span className="text-pink-100">Kitty Edition</span></h1>
               <p className="text-xs text-pink-100 font-medium opacity-90">ระบบกระทบยอดบัญชีอัจฉริยะแบบคิวท์ๆ</p>
             </div>
          </div>
          {reconcileResult && (
            <button 
              onClick={handleReset}
              className="text-sm font-bold bg-white text-primary hover:bg-pink-50 px-5 py-2.5 rounded-2xl shadow-md transition-all transform hover:scale-105"
            >
              ✨ เริ่มใหม่
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Upload Section */}
        <section className={`mb-12 transition-all duration-500 ${reconcileResult ? 'opacity-50 pointer-events-none hidden' : 'opacity-100'}`}>
          <div className="text-center mb-10">
            <div className="inline-block p-3 bg-white rounded-full shadow-md mb-4">
              <span className="text-4xl">🎀</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2 font-cute">เริ่มต้นการกระทบยอด</h2>
            <p className="text-gray-500 max-w-2xl mx-auto bg-white/50 py-2 px-4 rounded-xl inline-block">
              อัปโหลดไฟล์ CSV จากธนาคารและระบบบัญชีของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FileUpload 
              label="1. ข้อมูลจากธนาคาร (Bank Statement CSV)" 
              onFileSelect={handleBankUpload}
              colorClass="border-pink-300 bg-white text-pink-600 hover:bg-pink-50 hover:border-pink-400"
              iconColor="text-pink-400"
              fileName={bankFileName}
            />
            <FileUpload 
              label="2. ข้อมูลจากระบบบัญชี (Book/GL CSV)" 
              onFileSelect={handleBookUpload}
              colorClass="border-purple-300 bg-white text-purple-600 hover:bg-purple-50 hover:border-purple-400"
              iconColor="text-purple-400"
              fileName={bookFileName}
            />
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mb-4 shadow-lg shadow-pink-200"></div>
            <p className="text-pink-600 font-bold font-cute text-lg">กำลังประมวลผล... รอแป๊บนึงนะค้า 💖</p>
          </div>
        )}

        {/* Step 2: Results Section */}
        {!loading && reconcileResult && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-cute flex items-center gap-2">
                <span className="text-2xl">📊</span> สรุปผลการกระทบยอด
              </h2>
              <div className="text-sm text-pink-500 bg-white px-3 py-1 rounded-full shadow-sm border border-pink-100">
                ประมวลผลเมื่อ: {new Date().toLocaleTimeString('th-TH')}
              </div>
            </div>

            <DashboardStats stats={reconcileResult.stats} report={reconcileResult.report} />
            
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-800 mb-4 font-cute flex items-center gap-2">
                <span className="text-2xl">📝</span> รายการตรวจสอบละเอียด
              </h3>
              <ResultTable items={reconcileResult.items} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;