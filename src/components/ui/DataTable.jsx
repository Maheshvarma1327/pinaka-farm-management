import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download, 
  Printer, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database
} from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * Enterprise-grade modular Spreadsheet Table.
 * @param {Array} columns - Column definition configurations: { header, accessor, render, sortable }
 * @param {Array} data - Flat JSON data records
 * @param {String} searchPlaceholder - Placeholder label for searches
 * @param {Boolean} exportable - Enable Excel CSV downloads
 * @param {Boolean} printable - Enable printing stylesheet triggers
 */
export default function DataTable({
  columns,
  data = [],
  searchPlaceholder = "Search registers...",
  exportable = true,
  printable = true,
  actions = null
}) {
  // 1. Search Query state
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 3. Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Sorting handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Reset sorting state
      key = null;
    }
    setSortConfig({ key, direction });
  };

  // Safe dot-notation deep accessor resolution (e.g. 'sow.animalNo')
  const getNestedValue = (obj, path) => {
    if (!path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : '', obj);
  };

  // Filter and Sort dataset
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by global search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return columns.some((col) => {
          const val = getNestedValue(row, col.accessor);
          return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
        });
      });
    }

    // Sort by selected key
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = getNestedValue(a, sortConfig.key);
        let valB = getNestedValue(b, sortConfig.key);

        // Normalize weight/number values
        if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
          valA = Number(valA);
          valB = Number(valB);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortConfig, columns]);

  // Paginate records
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;

  // Reset pagination page on search triggers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Print Register Handler
  const triggerPrint = () => {
    window.print();
  };

  // Excel-compatible CSV Downloader
  const triggerCSVDownload = () => {
    if (processedData.length === 0) return;

    // Header strings
    const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    
    // Body lines
    const rows = processedData.map(row => {
      return columns.map(col => {
        const rawVal = getNestedValue(row, col.accessor);
        const cellString = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
        return `"${cellString.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PINAKA_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      
      {/* Search Filters & Export Tools Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-sidebar p-3 border border-borderDark rounded-lg no-print">
        
        {/* Quick Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-textSecondary pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-surface border border-borderDark focus:border-primary text-textPrimary text-xs pl-9 pr-3.5 py-2 rounded-md outline-none transition-all duration-150 ease-in-out placeholder:text-textSecondary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Global Action Handlers */}
        <div className="flex items-center gap-2">
          {actions}
          
          {exportable && (
            <button
              onClick={triggerCSVDownload}
              disabled={processedData.length === 0}
              className="p-2 bg-sidebar border border-borderDark text-textPrimary hover:text-primary disabled:opacity-40 hover:bg-cardBg rounded transition-colors text-xs font-medium flex items-center gap-1.5"
              title="Export spreadsheet to CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>
          )}

          {printable && (
            <button
              onClick={triggerPrint}
              disabled={processedData.length === 0}
              className="p-2 bg-sidebar border border-borderDark text-textPrimary hover:text-primary disabled:opacity-40 hover:bg-cardBg rounded transition-colors text-xs font-medium flex items-center gap-1.5"
              title="Print register layout sheets"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="dense-table-container min-h-[200px]">
        {processedData.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              title="No Registers Matching filters" 
              description="Refine your query string or register new records to fill the spreadsheet grid."
              icon={Database}
            />
          </div>
        ) : (
          <table className="dense-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th 
                    key={index}
                    onClick={() => col.sortable && handleSort(col.accessor)}
                    className={col.sortable ? 'cursor-pointer select-none hover:bg-cardBg transition-colors' : ''}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        sortConfig.key === col.accessor ? (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="w-3 h-3 text-primary" /> : 
                            <ArrowDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-textSecondary/40 hover:text-textSecondary" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    const cellVal = getNestedValue(row, col.accessor);
                    return (
                      <td key={colIndex}>
                        {col.render ? col.render(cellVal, row) : (cellVal !== null && cellVal !== undefined ? String(cellVal) : '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Pagination Controls */}
      {processedData.length > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1 text-xs text-textSecondary bg-sidebar/40 border border-borderDark rounded-lg no-print">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface border border-borderDark text-textPrimary text-xs rounded px-1.5 py-0.5 outline-none focus:border-primary"
              >
                {[10, 15, 25, 50, 100].map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, processedData.length)} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-cardBg disabled:opacity-30 rounded border border-borderDark transition-colors text-textPrimary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-cardBg disabled:opacity-30 rounded border border-borderDark transition-colors text-textPrimary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
