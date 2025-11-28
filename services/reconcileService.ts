import { BankRecord, BookRecord, MatchStatus, ReconciledItem, ReconciliationStats, ReconcileResult, AnalysisReport, AnalysisInsight } from '../types';

// Helper to parse CSV line handling quoted commas
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      inQuotes = !inQuotes;
    } else if (text[i] === ',' && !inQuotes) {
      result.push(text.substring(start, i).replace(/^"|"$/g, '').trim());
      start = i + 1;
    }
  }
  result.push(text.substring(start).replace(/^"|"$/g, '').trim());
  return result;
};

// Helper to convert string "1,234.56" to number 1234.56
const parseAmount = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, ''));
};

// Levenshtein distance for fuzzy string matching
const getEditDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Check if two numbers are transpositions of each other (e.g., 5400 vs 4500)
const isTransposition = (num1: number, num2: number): boolean => {
  const s1 = num1.toFixed(2).replace('.', '').split('').sort().join('');
  const s2 = num2.toFixed(2).replace('.', '').split('').sort().join('');
  return s1 === s2;
};

export const parseBankCSV = (csvContent: string): BankRecord[] => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  // Assume header is row 0, data starts row 1
  const records: BankRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue; // Skip invalid lines

    records.push({
      account_no: cols[0],
      settlement_date: cols[1],
      transaction_date: cols[2],
      time: cols[3],
      invoice_number: cols[4],
      product: cols[5],
      liter: parseFloat(cols[6] || '0'),
      price: parseFloat(cols[7] || '0'),
      amount_before_vat: parseAmount(cols[8]),
      vat: parseAmount(cols[9]),
      total_amount: parseAmount(cols[10]),
      fuel_brand: cols[cols.length - 1], 
      original_row: cols
    });
  }
  return records;
};

export const parseBookCSV = (csvContent: string): BookRecord[] => {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const records: BookRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;

    records.push({
      document_no: cols[0],
      posting_date: cols[1],
      description: cols[2],
      amount: parseAmount(cols[3]),
      original_row: cols
    });
  }
  return records;
};

const generateAnalysisReport = (items: ReconciledItem[], stats: ReconciliationStats): AnalysisReport => {
  const insights: AnalysisInsight[] = [];
  const recommendations: string[] = [];
  const errorDistribution = [
    { name: 'Digit Transposition', value: 0 },
    { name: 'Typo / Keying Error', value: 0 },
    { name: 'Missing Documentation', value: 0 },
    { name: 'System / Data Delay', value: 0 },
  ];

  // Analyze Variances
  const variances = items.filter(i => i.status === MatchStatus.VARIANCE);
  const transpositionErrors = variances.filter(i => i.errorType === 'TRANSPOSITION').length;
  const keyingErrors = variances.filter(i => i.errorType === 'KEYING' || i.errorType === 'ROUNDING').length;

  errorDistribution[0].value = transpositionErrors;
  errorDistribution[1].value += keyingErrors;

  // Analyze Potential Matches (Typos)
  const typos = items.filter(i => i.status === MatchStatus.POTENTIAL_MATCH).length;
  errorDistribution[1].value += typos;

  // Analyze Missing
  const missingBook = stats.unmatchedBankCount;
  const missingBank = stats.unmatchedBookCount;
  
  errorDistribution[2].value = missingBook; // Bank exists, Book missing -> Missing Doc
  errorDistribution[3].value = missingBank; // Book exists, Bank missing -> Delay/Error

  // --- Insight Generation ---

  // 1. Overall Health
  const matchRate = (stats.matchedCount / stats.totalBank) * 100;
  if (matchRate > 95) {
    insights.push({
      type: 'SUCCESS',
      title: 'ประสิทธิภาพการบันทึกบัญชีดีเยี่ยม',
      description: `สามารถจับคู่รายการได้ถึง ${matchRate.toFixed(1)}% แสดงถึงกระบวนการที่มีความแม่นยำสูง`
    });
  } else if (matchRate < 80) {
    insights.push({
      type: 'CRITICAL',
      title: 'พบความเสี่ยงในกระบวนการบันทึกบัญชี',
      description: `อัตราการจับคู่ต่ำกว่า 80% (${matchRate.toFixed(1)}%) ควรตรวจสอบขั้นตอนการรับเอกสารและการบันทึกข้อมูลด่วน`
    });
  }

  // 2. Human Error Analysis
  if (transpositionErrors > 0) {
    insights.push({
      type: 'WARNING',
      title: 'ตรวจพบ Human Error ประเภทสลับตัวเลข',
      description: `พบรายการที่มีลักษณะตัวเลขสลับหลัก (Transposition) จำนวน ${transpositionErrors} รายการ แนะนำให้ตรวจสอบด้วยยอดรวม (Batch Total) ก่อนบันทึก`
    });
    recommendations.push('เพิ่มขั้นตอนการตรวจสอบ "Grand Total" ของเอกสารก่อนทำการ Post ลงระบบบัญชี เพื่อลดปัญหาตัวเลขสลับหลัก');
  }

  // 3. Typo Analysis
  if (typos > 0) {
    insights.push({
      type: 'INFO',
      title: 'พบการพิมพ์ Invoice Number ผิด',
      description: `AI ตรวจพบ ${typos} รายการที่ยอดเงินตรงกันแต่เลขที่เอกสารพิมพ์ผิดเล็กน้อย`
    });
    recommendations.push('พิจารณาใช้อุปกรณ์ Barcode Scanner หรือระบบ OCR ในการอ่านเลขที่ Invoice แทนการพิมพ์ด้วยมือ');
  }

  // 4. Missing Docs
  if (missingBook > 5) {
    insights.push({
      type: 'WARNING',
      title: 'เอกสารทางบัญชีตกหล่นจำนวนมาก',
      description: `มีรายการใน Bank Statement ถึง ${missingBook} รายการที่ยังไม่ถูกบันทึกในระบบบัญชี`
    });
    recommendations.push('ตรวจสอบรอบการปิดบัญชีและเร่งติดตามเอกสารจากแผนกที่เกี่ยวข้อง (เช่น แผนกจัดซื้อหรือการเงิน)');
  }

  // Summary Text
  const summary = `จากการวิเคราะห์ธุรกรรมทั้งหมด ${stats.totalBank + stats.totalBook} รายการ พบรายการที่ต้องตรวจสอบ ${stats.varianceCount + stats.potentialMatchCount + stats.unmatchedBankCount + stats.unmatchedBookCount} รายการ โดยปัญหาหลักเกิดจาก ${
    transpositionErrors > keyingErrors ? 'ความผิดพลาดในการป้อนข้อมูล (สลับตัวเลข)' : 'ข้อมูลตกหล่นหรือไม่ครบถ้วน'
  }`;

  return {
    summary,
    insights,
    recommendations,
    errorDistribution: errorDistribution.filter(e => e.value > 0)
  };
};

export const reconcileData = (bankData: BankRecord[], bookData: BookRecord[]): ReconcileResult => {
  const reconciledItems: ReconciledItem[] = [];
  const bankMap = new Map<string, BankRecord>();
  const bankUsed = new Set<string>(); // Keep track of matched invoice numbers
  const unmatchedBooks: BookRecord[] = [];

  // Index Bank Data
  bankData.forEach(record => {
    // Normalizing Key: remove whitespace
    bankMap.set(record.invoice_number.trim(), record);
  });

  // 1. Exact ID Matching
  bookData.forEach(book => {
    const key = book.description.trim();
    const bankMatch = bankMap.get(key);
    
    if (bankMatch) {
      bankUsed.add(bankMatch.invoice_number);
      
      const variance = bankMatch.total_amount - book.amount;
      const isAmountMatch = Math.abs(variance) < 0.01;

      if (isAmountMatch) {
        reconciledItems.push({
          id: `match-${book.document_no}`,
          status: MatchStatus.MATCHED,
          bankRecord: bankMatch,
          bookRecord: book,
          varianceAmount: 0,
          notes: 'ข้อมูลตรงกันสมบูรณ์'
        });
      } else {
        // Human Error Detection for Variance
        let suggestion = "";
        let confidence: 'High' | 'Medium' | 'Low' = 'Low';
        let errorType: ReconciledItem['errorType'] = 'UNKNOWN';

        if (isTransposition(bankMatch.total_amount, book.amount) && Math.abs(variance) % 9 === 0) {
          suggestion = `ตรวจพบตัวเลขสลับหลัก (Transposition Error) ยอดที่ถูกต้องคือ ${bankMatch.total_amount}`;
          confidence = 'High';
          errorType = 'TRANSPOSITION';
        } else if (Math.abs(Math.abs(variance) - 1000) < 0.01 || Math.abs(Math.abs(variance) - 100) < 0.01) {
          suggestion = `ยอดเงินต่างกันผิดปกติ อาจเกิดจากความผิดพลาดในการคีย์ข้อมูล (Keying Error)`;
          confidence = 'Medium';
          errorType = 'KEYING';
        } else if (Math.abs(variance) < 1.0) {
            suggestion = `ผลต่างเล็กน้อย อาจเกิดจากการปัดเศษ (Rounding Diff)`;
            confidence = 'High';
            errorType = 'ROUNDING';
        } else {
           suggestion = `ยอดเงินใน Book ไม่ตรงกับ Bank (ต่างกัน ${variance.toFixed(2)})`;
        }

        reconciledItems.push({
          id: `var-${book.document_no}`,
          status: MatchStatus.VARIANCE,
          bankRecord: bankMatch,
          bookRecord: book,
          varianceAmount: variance,
          notes: 'ID ตรงกันแต่ยอดเงินไม่ถูกต้อง',
          suggestion: suggestion,
          confidence: confidence,
          errorType: errorType
        });
      }
    } else {
      unmatchedBooks.push(book);
    }
  });

  // 2. Identify Unmatched Bank Records
  const unmatchedBanks: BankRecord[] = [];
  bankData.forEach(bank => {
    if (!bankUsed.has(bank.invoice_number)) {
      unmatchedBanks.push(bank);
    }
  });

  // 3. AI / Fuzzy Logic for Unmatched Items
  const processedBooks = new Set<string>();

  unmatchedBooks.forEach(book => {
    let bestMatch: BankRecord | null = null;
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';
    let suggestionText = '';
    let errorType: ReconciledItem['errorType'] = 'UNKNOWN';

    // Strategy A: Exact Amount Match but Fuzzy ID (Possible ID Typo)
    const amountMatchCandidates = unmatchedBanks.filter(b => Math.abs(b.total_amount - book.amount) < 0.01);
    
    for (const bank of amountMatchCandidates) {
      const distance = getEditDistance(book.description, bank.invoice_number);
      // Allow max 2 edits
      if (distance <= 2) {
        bestMatch = bank;
        confidence = 'High';
        suggestionText = `ยอดเงินตรงกัน คาดว่าพิมพ์ Invoice No. ผิด (จาก ${bank.invoice_number} เป็น ${book.description})`;
        errorType = 'TYPO';
        break; // Take first high confidence match
      }
    }

    // Strategy B: No Amount Match, but ID is extremely similar
    if (!bestMatch) {
       for (const bank of unmatchedBanks) {
         if (Math.abs(bank.total_amount - book.amount) > 0.01) { 
            const distance = getEditDistance(book.description, bank.invoice_number);
            if (distance <= 1) {
              bestMatch = bank;
              confidence = 'Medium';
              suggestionText = `Invoice No. คล้ายกันมาก (${bank.invoice_number}) แต่อาจบันทึกยอดผิดและพิมพ์ ID ผิดพร้อมกัน`;
              errorType = 'KEYING';
              break;
            }
         }
       }
    }

    if (bestMatch) {
      bankUsed.add(bestMatch.invoice_number);
      reconciledItems.push({
        id: `potential-${book.document_no}`,
        status: MatchStatus.POTENTIAL_MATCH,
        bankRecord: bestMatch,
        bookRecord: book,
        varianceAmount: bestMatch.total_amount - book.amount,
        notes: 'AI ตรวจพบความคล้ายคลึง',
        suggestion: suggestionText,
        confidence: confidence,
        errorType: errorType
      });
      processedBooks.add(book.document_no);
    }
  });

  // 4. Finalize Unmatched List
  unmatchedBooks.forEach(book => {
    if (!processedBooks.has(book.document_no)) {
      reconciledItems.push({
        id: `missing-bank-${book.document_no}`,
        status: MatchStatus.UNMATCHED_BOOK,
        bookRecord: book,
        notes: 'ไม่พบข้อมูลใน Bank Statement',
        errorType: 'MISSING'
      });
    }
  });

  const potentiallyMatchedBankInvoiceNums = reconciledItems
    .filter(i => i.status === MatchStatus.POTENTIAL_MATCH && i.bankRecord)
    .map(i => i.bankRecord!.invoice_number);
    
  unmatchedBanks.forEach(bank => {
    if (!potentiallyMatchedBankInvoiceNums.includes(bank.invoice_number)) {
      reconciledItems.push({
        id: `missing-book-${bank.invoice_number}`,
        status: MatchStatus.UNMATCHED_BANK,
        bankRecord: bank,
        notes: 'ไม่พบข้อมูลในระบบบัญชี',
        errorType: 'MISSING'
      });
    }
  });

  // Calculate Stats
  const stats: ReconciliationStats = {
    totalBank: bankData.length,
    totalBook: bookData.length,
    totalBankAmount: bankData.reduce((acc, cur) => acc + cur.total_amount, 0),
    totalBookAmount: bookData.reduce((acc, cur) => acc + cur.amount, 0),
    matchedCount: reconciledItems.filter(i => i.status === MatchStatus.MATCHED).length,
    varianceCount: reconciledItems.filter(i => i.status === MatchStatus.VARIANCE).length,
    potentialMatchCount: reconciledItems.filter(i => i.status === MatchStatus.POTENTIAL_MATCH).length,
    unmatchedBankCount: reconciledItems.filter(i => i.status === MatchStatus.UNMATCHED_BANK).length,
    unmatchedBookCount: reconciledItems.filter(i => i.status === MatchStatus.UNMATCHED_BOOK).length,
  };

  const report = generateAnalysisReport(reconciledItems, stats);

  return { items: reconciledItems, stats, report };
};