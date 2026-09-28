import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  Search,
  RotateCcw,
  Calendar,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { sortData } from '../../utils/sortUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { SortIcon } from '../common/SortIcon';
import { matchesUniversalSearch } from '../../utils/searchUtils';

export const DayWiseDeliveryReportView: React.FC = () => {
  const {
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStorage('');
    setSelectedVariety('');
    setSelectedClass('');
    setSelectedGrade('');
    setSelectedType('');
    setSelectedCustomer('');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset(null);
    setCurrentPage(1);
    addToast?.('All Day-wise Delivery Report filters reset successfully', 'info');
  };

  // Date Presets Handler
  const handleDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'season') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setActiveDatePreset('today');
    } else if (preset === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setStartDate(formatDate(d7));
      setEndDate(formatDate(today));
      setActiveDatePreset('7days');
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      setActiveDatePreset('thisMonth');
    } else if (preset === 'season') {
      setStartDate('2024-01-01');
      setEndDate('2024-12-31');
      setActiveDatePreset('season');
    }
    setCurrentPage(1);
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedStorage),
    Boolean(selectedVariety),
    Boolean(selectedClass),
    Boolean(selectedGrade),
    Boolean(selectedType),
    Boolean(selectedCustomer),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Format Helper: Potato Type Code
  const getPotatoTypeCode = (typeName: string, typeCode?: string): string => {
    const upper = (typeName || '').toUpperCase();
    if (upper.includes('CERTIFIED') || upper.includes('CERT')) return 'CS';
    if (upper.includes('FOUNDATION') || upper.includes('FOUND')) return 'FS';
    if (upper.includes('BREEDER')) return 'BS';
    if (upper.includes('PRE-FOUNDATION')) return 'PFS';
    if (upper.includes('TLS') || upper.includes('TRUTH')) return 'TLS';
    if (upper.includes('TABLE')) return 'TP';
    if (upper.includes('IND') || upper.includes('COMMERCIAL')) return 'IND';
    if (typeCode && typeCode.length <= 4) return typeCode.toUpperCase();
    return 'CS';
  };

  // Unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    deliveryTransactions.forEach((d) => {
      const c = d.customerReceiver || d.clientReceiver;
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [deliveryTransactions]);

  // Filtered raw transactions
  const filteredList = useMemo(() => {
    return deliveryTransactions.filter((d) => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && d.varietyId !== selectedVariety) return false;
      if (selectedClass && d.classId !== selectedClass) return false;
      if (selectedGrade && d.gradeId !== selectedGrade) return false;
      if (selectedType && d.potatoTypeId !== selectedType) return false;
      if (selectedCustomer && (d.customerReceiver || d.clientReceiver) !== selectedCustomer) return false;

      const cs = coldStorages.find((c) => c.id === d.coldStorageId);
      const csName = cs?.name || '';
      const csCode = cs?.code || '';
      const vName = varieties.find((v) => v.id === d.varietyId)?.name || '';
      const cName = seedClasses.find((c) => c.id === d.classId)?.name || '';
      const gName = grades.find((g) => g.id === d.gradeId)?.name || '';
      const tName = potatoTypes.find((t) => t.id === d.potatoTypeId)?.name || '';

      if (
        !matchesUniversalSearch(d, searchQuery, [
          csName,
          csCode,
          vName,
          cName,
          gName,
          tName,
          d.srNo || '',
          d.deliveryNo || '',
          d.doNumber || '',
          d.deliveryReference || '',
          d.customerReceiver || '',
          d.date,
        ])
      ) {
        return false;
      }

      return true;
    });
  }, [
    deliveryTransactions,
    startDate,
    endDate,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedType,
    selectedCustomer,
    searchQuery,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
  ]);

  // Aggregate by Date (Day-wise total OUT)
  const dayWiseList = useMemo(() => {
    const map = new Map<string, {
      date: string;
      bagOut: number;
      totalKgOut: number;
      totalMtOut: number;
      typeCodes: Set<string>;
      varietyNames: Set<string>;
      classNames: Set<string>;
      gradeNames: Set<string>;
      storageCodes: Set<string>;
      srNos: Set<string>;
      deliveryNos: Set<string>;
    }>();

    filteredList.forEach((d) => {
      const entry = map.get(d.date) || {
        date: d.date,
        bagOut: 0,
        totalKgOut: 0,
        totalMtOut: 0,
        typeCodes: new Set<string>(),
        varietyNames: new Set<string>(),
        classNames: new Set<string>(),
        gradeNames: new Set<string>(),
        storageCodes: new Set<string>(),
        srNos: new Set<string>(),
        deliveryNos: new Set<string>(),
      };

      const kgPerBag = d.kgPerBag || 50;
      const kg = d.totalKg || d.sackQuantity * kgPerBag;
      const mt = d.totalMt || Number((kg / 1000).toFixed(3));

      entry.bagOut += d.sackQuantity;
      entry.totalKgOut += kg;
      entry.totalMtOut += mt;

      const v = varieties.find((item) => item.id === d.varietyId);
      if (v?.name) entry.varietyNames.add(v.name.toUpperCase());

      const t = potatoTypes.find((item) => item.id === d.potatoTypeId);
      entry.typeCodes.add(getPotatoTypeCode(t?.name || '', t?.code));

      const cls = seedClasses.find((c) => c.id === d.classId);
      if (cls?.name) entry.classNames.add(cls.name.replace(/\s*\([^)]*\)/gi, '').trim().toUpperCase());

      const grd = grades.find((g) => g.id === d.gradeId);
      if (grd?.name) entry.gradeNames.add(grd.code || grd.name.toUpperCase());

      const cs = coldStorages.find((c) => c.id === d.coldStorageId);
      if (cs) entry.storageCodes.add(cs.code || cs.name.replace(/cold\s*storage/gi, '').trim());

      const sr = d.srNo || d.deliveryReference;
      if (sr) entry.srNos.add(sr);

      const dNo = d.deliveryNo || d.doNumber;
      if (dNo) entry.deliveryNos.add(dNo);

      map.set(d.date, entry);
    });

    const dayRows = Array.from(map.values());
    const sorted = sortData(dayRows, sortKey, sortDir);

    let runningCumulativeKg = 0;
    return sorted.map((r, index) => {
      runningCumulativeKg += r.totalKgOut;

      const typeCode = Array.from(r.typeCodes)[0] || 'CS';
      const varietyStr = Array.from(r.varietyNames).slice(0, 2).join(', ') || 'SEED POTATO';
      const classStr = Array.from(r.classNames).slice(0, 1).join(', ') || '-';
      const gradeStr = Array.from(r.gradeNames).slice(0, 2).join(', ') || 'A';
      const storageStr = Array.from(r.storageCodes).join(', ') || '-';
      const srStr = r.srNos.size > 0 ? (r.srNos.size === 1 ? Array.from(r.srNos)[0] : `${r.srNos.size} SRs`) : '-';
      const delivStr = r.deliveryNos.size > 0 ? (r.deliveryNos.size === 1 ? Array.from(r.deliveryNos)[0] : `${r.deliveryNos.size} PASSES`) : '-';

      return {
        id: r.date,
        sl: index + 1,
        date: r.date,
        potatoTypeCode: typeCode,
        varietyName: varietyStr,
        className: classStr,
        gradeName: gradeStr,
        srNo: srStr,
        coldStorageCode: storageStr,
        deliveryPassNo: delivStr,
        bagOut: r.bagOut,
        totalKgOut: r.totalKgOut,
        totalMtOut: Number((r.totalKgOut / 1000).toFixed(3)),
        cumulativeTotalKg: runningCumulativeKg,
      };
    });
  }, [
    filteredList,
    sortKey,
    sortDir,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    potatoTypes,
  ]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const totalBags = dayWiseList.reduce((acc, row) => acc + row.bagOut, 0);
    const totalKg = dayWiseList.reduce((acc, row) => acc + row.totalKgOut, 0);
    const totalMt = Number((totalKg / 1000).toFixed(3));
    return {
      totalBags,
      totalKg,
      totalMt,
    };
  }, [dayWiseList]);

  // Paginated records
  const totalRecords = dayWiseList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? dayWiseList : dayWiseList.slice(startIndex, endIndex);

  // Dynamic table density styles matching Stock In
  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
      variety: 'text-[9.5px]',
      tfoot: 'py-1 text-[9.5px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
      variety: 'text-[10px]',
      tfoot: 'py-1.2 text-[10px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
      variety: 'text-[10.5px]',
      tfoot: 'py-1.5 text-[10.5px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  // Excel Export
  const handleExportExcel = () => {
    const exportData: any[] = dayWiseList.map((row) => ({
      date: row.date,
      typeVariety: `${row.potatoTypeCode} ${row.varietyName}`,
      className: row.className,
      gradeName: row.gradeName,
      srNo: row.srNo,
      coldStorageCode: row.coldStorageCode,
      deliveryPassNo: row.deliveryPassNo,
      bagOut: row.bagOut,
      totalKgOut: row.totalKgOut,
      totalMtOut: row.totalMtOut,
      cumulativeTotalKg: row.cumulativeTotalKg,
    }));

    if (dayWiseList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        typeVariety: '',
        className: '',
        gradeName: '',
        srNo: '',
        coldStorageCode: '',
        deliveryPassNo: '',
        bagOut: overallTotals.totalBags,
        totalKgOut: overallTotals.totalKg,
        totalMtOut: overallTotals.totalMt,
        cumulativeTotalKg: overallTotals.totalKg,
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', width: 13 },
      { header: 'TYPE & VARIETY', key: 'typeVariety', width: 22 },
      { header: 'CLASS & GRADE', key: 'className', width: 18 },
      { header: 'SR NO', key: 'srNo', width: 14 },
      { header: 'COLD STORAGE', key: 'coldStorageCode', width: 16 },
      { header: 'DELIVERY/GATE PASS NO', key: 'deliveryPassNo', width: 22 },
      { header: 'BAG OUT', key: 'bagOut', width: 14 },
      { header: 'STOK OUT (KG)', key: 'totalKgOut', width: 18 },
      { header: 'STOK OUT (MT)', key: 'totalMtOut', width: 16 },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', width: 20 },
    ];

    exportToExcel(
      exportData,
      columns,
      `DAY_WISE_DELIVERY_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE DELIVERY REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Delivery Report exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = dayWiseList.map((row) => ({
      date: row.date,
      typeVariety: `${row.potatoTypeCode} ${row.varietyName}`,
      classGrade: `${row.className} • ${row.gradeName}`,
      srNo: row.srNo,
      coldStorageCode: row.coldStorageCode,
      deliveryPassNo: row.deliveryPassNo,
      bagOut: row.bagOut.toLocaleString(),
      totalKgOut: row.totalKgOut.toLocaleString(),
      totalMtOut: row.totalMtOut.toFixed(3),
      cumulativeTotalKg: row.cumulativeTotalKg.toLocaleString(),
    }));

    if (dayWiseList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        typeVariety: '',
        classGrade: '',
        srNo: '',
        coldStorageCode: '',
        deliveryPassNo: '',
        bagOut: overallTotals.totalBags.toLocaleString(),
        totalKgOut: overallTotals.totalKg.toLocaleString(),
        totalMtOut: overallTotals.totalMt.toFixed(3),
        cumulativeTotalKg: overallTotals.totalKg.toLocaleString(),
      });
    }

    const columns = [
      { header: 'DATE', key: 'date' },
      { header: 'TYPE & VARIETY', key: 'typeVariety' },
      { header: 'CLASS & GRADE', key: 'classGrade' },
      { header: 'SR NO', key: 'srNo' },
      { header: 'COLD STORAGE', key: 'coldStorageCode' },
      { header: 'DELIVERY/GATE PASS NO', key: 'deliveryPassNo' },
      { header: 'BAG OUT', key: 'bagOut' },
      { header: 'STOK OUT (KG)', key: 'totalKgOut' },
      { header: 'STOK OUT (MT)', key: 'totalMtOut' },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg' },
    ];

    exportToPdf(
      exportData,
      columns,
      `DAY_WISE_DELIVERY_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE DELIVERY REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Delivery Report exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DAY-WISE DELIVERY REPORT
          </h2>
        </div>

        {/* Action Controls: Density & Exports */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Density Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast?.('Table density set to COMPACT', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'compact'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('normal');
                addToast?.('Table density set to NORMAL', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('comfortable');
                addToast?.('Table density set to COMFORTABLE', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          {/* Export & Print */}
          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100">
        {/* ROW 1: Search, Date Pickers, Quick Buttons, record counter & Icon-only Clear button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-40 sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Search records"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Pickers container */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 p-1 rounded-lg border border-slate-700/80 shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-normal px-1 uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-sky-400" />
                <span>Date:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-700 bg-slate-900 text-sky-400 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                title="From Date"
              />
              <span className="text-[11px] text-slate-400 font-normal">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-700 bg-slate-900 text-sky-400 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                title="To Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setActiveDatePreset(null);
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right grouping */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            {/* Quick Date Presets */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs text-xs font-semibold">
              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 px-1 tracking-wider">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span>QUICK:</span>
              </span>

              <button
                type="button"
                onClick={() => handleDatePreset('today')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'today'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Today's Date"
              >
                TODAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('7days')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === '7days'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Last 7 Days"
              >
                7 DAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('thisMonth')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'thisMonth'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by This Month"
              >
                THIS MONTH
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('season')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'season'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Season 2024"
              >
                SEASON
              </button>
            </div>

            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{dayWiseList.length}</strong> days
            </span>

            {/* Clear Filter button with icon only */}
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title={`Clear all filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              aria-label="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ROW 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          <div>
            <select
              value={selectedStorage}
              onChange={(e) => {
                setSelectedStorage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY COLD STORAGE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL STORAGES</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {cs.name.toUpperCase()} ({cs.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY POTATO TYPE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL POTATO TYPES</option>
              {potatoTypes.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {t.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedVariety}
              onChange={(e) => {
                setSelectedVariety(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY VARIETY"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL VARIETIES</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {v.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY SEED CLASS"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL SEED CLASSES</option>
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY GRADE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL GRADES</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {g.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY CUSTOMER"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL CLIENTS/RECEIVERS</option>
              {uniqueCustomers.map((c) => (
                <option key={c} value={c} className="text-slate-600 dark:text-slate-300 font-normal">
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full min-w-[1020px] table-fixed text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              {/* 1. DATE (8%) */}
              <th
                onClick={() => handleSort('date')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] min-w-[78px] overflow-hidden ${
                  sortKey === 'date'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="truncate">DATE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="date" />
                </div>
              </th>

              {/* 2. TYPE & VARIETY (14%) */}
              <th
                onClick={() => handleSort('potatoTypeCode')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] min-w-[125px] overflow-hidden ${
                  sortKey === 'potatoTypeCode'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="truncate">TYPE & VARIETY</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="potatoTypeCode" />
                </div>
              </th>

              {/* 3. CLASS & GRADE (13%) */}
              <th
                onClick={() => handleSort('className')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[13%] min-w-[110px] overflow-hidden ${
                  sortKey === 'className'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="truncate">CLASS & GRADE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="className" />
                </div>
              </th>

              {/* 4. SR NO (9%) */}
              <th
                onClick={() => handleSort('srNo')}
                className={`${thPadding} border border-slate-300 dark:border-slate-700 text-center cursor-pointer select-none transition-colors w-[9%] min-w-[80px] overflow-hidden ${
                  sortKey === 'srNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-center gap-0.5 w-full">
                  <span className="truncate">SR NO</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srNo" />
                </div>
              </th>

              {/* 5. COLD STORAGE (11%) */}
              <th
                onClick={() => handleSort('coldStorageCode')}
                className={`${thPadding} border border-slate-300 dark:border-slate-700 text-center cursor-pointer select-none transition-colors w-[11%] min-w-[95px] overflow-hidden ${
                  sortKey === 'coldStorageCode'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-center gap-0.5 w-full">
                  <span className="truncate">COLD STORAGE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="coldStorageCode" />
                </div>
              </th>

              {/* 6. DELIVERY/GATE PASS NO (13%) */}
              <th
                onClick={() => handleSort('deliveryPassNo')}
                className={`${thPadding} border border-slate-300 dark:border-slate-700 text-center cursor-pointer select-none transition-colors w-[13%] min-w-[110px] overflow-hidden ${
                  sortKey === 'deliveryPassNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-center gap-0.5 w-full">
                  <span className="truncate">DELIVERY/GATE PASS NO</span>
                  <SortIcon sortKey={sortDir} columnKey="deliveryPassNo" />
                </div>
              </th>

              {/* 7. BAG OUT (8%) */}
              <th
                onClick={() => handleSort('bagOut')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] min-w-[75px] overflow-hidden ${
                  sortKey === 'bagOut'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="truncate">BAG OUT</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="bagOut" />
                </div>
              </th>

              {/* 8. STOK OUT (KG) (8.5%) */}
              <th
                onClick={() => handleSort('totalKgOut')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8.5%] min-w-[85px] overflow-hidden ${
                  sortKey === 'totalKgOut'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="truncate">STOK OUT (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgOut" />
                </div>
              </th>

              {/* 9. STOK OUT (MT) (7.5%) */}
              <th
                onClick={() => handleSort('totalMtOut')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[7.5%] min-w-[75px] overflow-hidden ${
                  sortKey === 'totalMtOut'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="truncate">STOK OUT (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalMtOut" />
                </div>
              </th>

              {/* 10. CUMULATIVE (KG) (9%) */}
              <th
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 font-bold select-none text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20 w-[9%] min-w-[95px] overflow-hidden`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="truncate">CUMULATIVE (KG)</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching Day-wise Delivery records found.</p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                    >
                      Clear search query
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  {/* 1. DATE */}
                  <td className={`${cellPadding} pl-3 text-left whitespace-nowrap overflow-hidden border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium tabular-nums`}>
                    {row.date}
                  </td>

                  {/* 2. TYPE & VARIETY */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 whitespace-nowrap overflow-hidden`}>
                    <div className="flex items-center gap-1.5 min-w-0" title={`${row.potatoTypeCode} ${row.varietyName}`}>
                      <span className={`inline-flex items-center justify-center font-black tracking-wider uppercase border border-amber-500/70 text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 rounded leading-none shadow-2xs shrink-0 ${densityStyles.badge}`}>
                        {row.potatoTypeCode}
                      </span>
                      <span className={`font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight ${densityStyles.variety}`}>
                        {row.varietyName}
                      </span>
                    </div>
                  </td>

                  {/* 3. CLASS & GRADE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 whitespace-nowrap overflow-hidden`}>
                    <div className="flex items-center gap-1.5 min-w-0" title={`${row.className} - Grade ${row.gradeName}`}>
                      <span className={`font-bold text-purple-900 dark:text-purple-200 truncate uppercase tracking-tight ${densityStyles.variety}`}>
                        {row.className}
                      </span>
                      <span className={`inline-flex items-center justify-center font-black uppercase border border-teal-500 text-teal-800 dark:text-teal-200 bg-teal-100/80 dark:bg-teal-950/50 rounded leading-none shadow-2xs shrink-0 ${densityStyles.badge}`}>
                        {row.gradeName}
                      </span>
                    </div>
                  </td>

                  {/* 4. SR NO */}
                  <td className={`${cellPadding} px-2 text-center font-bold border border-slate-300 dark:border-slate-700 whitespace-nowrap overflow-hidden`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold border border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 bg-transparent shadow-2xs tabular-nums">
                      {row.srNo}
                    </span>
                  </td>

                  {/* 5. COLD STORAGE */}
                  <td className={`${cellPadding} px-2 text-center font-bold border border-slate-300 dark:border-slate-700 whitespace-nowrap overflow-hidden`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs">
                      {row.coldStorageCode}
                    </span>
                  </td>

                  {/* 6. DELIVERY/GATE PASS NO */}
                  <td className={`${cellPadding} px-2 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 truncate overflow-hidden text-center`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold border border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-transparent tabular-nums">
                      {row.deliveryPassNo}
                    </span>
                  </td>

                  {/* 7. BAG OUT */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-blue-700 dark:text-blue-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums overflow-hidden`}>
                    {row.bagOut > 0 ? row.bagOut.toLocaleString() : '-'}
                  </td>

                  {/* 8. STOK OUT (KG) */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-purple-700 dark:text-purple-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums overflow-hidden`}>
                    {row.totalKgOut > 0 ? row.totalKgOut.toLocaleString() : '-'}
                  </td>

                  {/* 9. STOK OUT (MT) */}
                  <td className={`${cellPadding} pr-3 text-right font-bold text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums overflow-hidden`}>
                    {row.totalMtOut > 0 ? row.totalMtOut.toFixed(3) : '-'}
                  </td>

                  {/* 10. CUMULATIVE (KG) */}
                  <td className={`${cellPadding} pr-3 text-right font-bold text-cyan-700 dark:text-cyan-400 border border-slate-300 dark:border-slate-700 whitespace-nowrap bg-cyan-50/20 dark:bg-cyan-950/10 tabular-nums overflow-hidden`}>
                    {row.cumulativeTotalKg > 0 ? row.cumulativeTotalKg.toLocaleString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Total Row */}
          {dayWiseList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                <td
                  colSpan={6}
                  className="py-2 px-2.5 text-center uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>

                {/* Total BAG OUT */}
                <td className="py-2 pr-3 text-right font-bold text-blue-700 dark:text-blue-300 bg-transparent border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums text-[10.5px]">
                  {overallTotals.totalBags.toLocaleString()}
                </td>

                {/* Total STOK OUT (KG) */}
                <td className="py-2 pr-3 text-right font-bold text-purple-700 dark:text-purple-300 bg-transparent border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums text-[10.5px]">
                  {overallTotals.totalKg.toLocaleString()}
                </td>

                {/* Total STOK OUT (MT) */}
                <td className="py-2 pr-3 text-right font-black text-emerald-700 dark:text-emerald-300 bg-transparent border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums text-[10.5px]">
                  {overallTotals.totalMt.toFixed(3)}
                </td>

                {/* CUMULATIVE (KG) final total */}
                <td className="py-2 pr-3 text-right font-black text-cyan-700 dark:text-cyan-300 bg-cyan-50/30 dark:bg-cyan-950/20 border border-slate-300 dark:border-slate-700 whitespace-nowrap tabular-nums text-[10.5px]">
                  {overallTotals.totalKg.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      {totalRecords > 0 && (
        <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
          {/* Left Side */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer font-bold"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>

            <span className="text-slate-300 dark:text-slate-600">·</span>

            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> records
            </span>
          </div>

          {/* Right Side */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={effectivePage === 1}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-0.5 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (effectivePage > 3 && effectivePage < totalPages - 2) {
                      pageNum = effectivePage - 2 + idx;
                    } else if (effectivePage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-6 h-6 px-1.5 text-[11px] rounded-md font-semibold transition-all cursor-pointer ${
                        effectivePage === pageNum
                          ? 'bg-sky-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="DAY-WISE DELIVERY REPORT"
          documentTitle="DAY-WISE DELIVERY REPORT"
          subtitle="Day-wise Outbound Potato Seed Delivery Aggregation"
          period={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
          columns={[
            { header: 'DATE', key: 'date' },
            { header: 'TYPE & VARIETY', key: 'varietyName' },
            { header: 'CLASS & GRADE', key: 'className' },
            { header: 'SR NO', key: 'srNo' },
            { header: 'COLD STORAGE', key: 'coldStorageCode' },
            { header: 'DELIVERY/GATE PASS NO', key: 'deliveryPassNo' },
            { header: 'BAG OUT', key: 'bagOut', align: 'right' },
            { header: 'STOK OUT (KG)', key: 'totalKgOut', align: 'right' },
            { header: 'STOK OUT (MT)', key: 'totalMtOut', align: 'right' },
            { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', align: 'right' },
          ]}
          data={dayWiseList.map((row) => ({
            ...row,
            bagOut: row.bagOut.toLocaleString(),
            totalKgOut: row.totalKgOut.toLocaleString(),
            totalMtOut: row.totalMtOut.toFixed(3),
            cumulativeTotalKg: row.cumulativeTotalKg.toLocaleString(),
          }))}
          summaryItems={[
            { label: 'Total Bag Out', value: `${overallTotals.totalBags.toLocaleString()} Bags`, highlight: true },
            { label: 'Total Stock Out (KG)', value: `${overallTotals.totalKg.toLocaleString()} KG` },
            { label: 'Total Stock Out (MT)', value: `${overallTotals.totalMt.toFixed(3)} MT` },
          ]}
          onConfirmPrint={() => {
            validateAndTriggerPrint();
            setIsPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
};
