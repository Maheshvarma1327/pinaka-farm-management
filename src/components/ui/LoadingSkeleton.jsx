import React from 'react';

/**
 * Reusable Loading Skeleton for KPI summary tiles.
 */
export const CardSkeleton = () => (
  <div className="bg-cardBg border border-borderDark rounded-lg p-4 w-full animate-pulse-fast">
    <div className="h-3 w-20 bg-textSecondary/20 rounded mb-3"></div>
    <div className="h-6 w-32 bg-primary/20 rounded mb-2"></div>
    <div className="h-3.5 w-40 bg-textSecondary/15 rounded"></div>
  </div>
);

/**
 * Reusable Loading Skeleton for dense register spreadsheets.
 */
export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  const rowArr = Array.from({ length: rows });
  const colArr = Array.from({ length: cols });

  return (
    <div className="w-full border border-borderDark rounded-lg bg-surface overflow-hidden animate-pulse-fast">
      <div className="bg-sidebar px-4 py-2.5 border-b border-borderDark flex items-center justify-between">
        <div className="h-4 w-36 bg-textSecondary/20 rounded"></div>
        <div className="h-6 w-24 bg-textSecondary/10 rounded"></div>
      </div>
      <div className="p-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-borderDark">
              {colArr.map((_, i) => (
                <th key={i} className="py-2.5 px-3">
                  <div className="h-3 w-16 bg-textSecondary/25 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowArr.map((_, rIndex) => (
              <tr key={rIndex} className="border-b border-borderDark/40">
                {colArr.map((_, cIndex) => (
                  <td key={cIndex} className="py-3 px-3">
                    <div className={`h-3 bg-textSecondary/10 rounded ${cIndex === 0 ? 'w-10' : 'w-20'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default { CardSkeleton, TableSkeleton };
