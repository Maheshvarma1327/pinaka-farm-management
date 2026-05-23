import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function DatePicker({
  value,
  onChange,
  className = 'dense-input',
  required = false,
  disabled = false,
  placeholder = 'Select date...',
  name = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date value
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Calendar navigation state (default to parsed date or current date)
  const [navDate, setNavDate] = useState(() => parsedDate || new Date());

  // Keep navigation in sync with value updates
  useEffect(() => {
    if (parsedDate) {
      setNavDate(parsedDate);
    }
  }, [parsedDate]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentYear = navDate.getFullYear();
  const currentMonth = navDate.getMonth(); // 0-indexed

  // Month navigation dropdown options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year navigation options (from 10 years past to 10 years future)
  const years = useMemo(() => {
    const startYear = new Date().getFullYear() - 10;
    return Array.from({ length: 25 }, (_, i) => startYear + i);
  }, []);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // First day of current month (day of the week, 0 = Sunday)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];

    // Pad days from the previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false
      });
    }

    // Days for the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }

    // Pad days from next month to complete the last row
    const totalSlots = 42; // 6 rows of 7 days
    const nextMonthDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      days.push({
        day: i,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setNavDate(new Date(currentYear, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setNavDate(new Date(newYear, currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setNavDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDaySelect = (dayObj) => {
    if (disabled) return;
    const selectedDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    // Format to local date string YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;

    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;

    onChange(formatted);
    setNavDate(today);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Format date for display in input
  const displayValue = useMemo(() => {
    if (!parsedDate) return '';
    return parsedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [parsedDate]);

  const isSelected = (dayObj) => {
    if (!parsedDate) return false;
    return (
      parsedDate.getDate() === dayObj.day &&
      parsedDate.getMonth() === dayObj.month &&
      parsedDate.getFullYear() === dayObj.year
    );
  };

  const isToday = (dayObj) => {
    const today = new Date();
    return (
      today.getDate() === dayObj.day &&
      today.getMonth() === dayObj.month &&
      today.getFullYear() === dayObj.year
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Target input wrapper */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          type="text"
          readOnly
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          className={`${className} cursor-pointer w-full pr-8`}
        />
        <div className="absolute right-2.5 flex items-center gap-1 text-textSecondary hover:text-primary">
          {value && !required && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-cardHover rounded"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* Advanced popover overlay */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 bg-sidebar border border-borderDark rounded-lg shadow-xl z-50 overflow-hidden text-xs">
          
          {/* Calendar Header with Month/Year Navigation Dropdowns */}
          <div className="flex items-center justify-between p-2.5 border-b border-borderDark bg-cardBg/40">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-cardHover text-textSecondary hover:text-primary border border-borderDark rounded transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-textPrimary">
              <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="bg-transparent border border-transparent hover:border-borderDark/40 hover:bg-cardBg px-1 py-0.5 rounded outline-none font-bold text-textPrimary text-xs cursor-pointer"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx} className="bg-sidebar text-textPrimary">
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={handleYearChange}
                className="bg-transparent border border-transparent hover:border-borderDark/40 hover:bg-cardBg px-1 py-0.5 rounded outline-none font-bold text-textPrimary text-xs cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-sidebar text-textPrimary">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-cardHover text-textSecondary hover:text-primary border border-borderDark rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 text-center font-bold text-textMuted py-2 border-b border-borderDark/20 bg-cardBg/10">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] uppercase tracking-wider">{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5 p-2 bg-cardBg/10">
            {calendarDays.map((dayObj, idx) => {
              const selected = isSelected(dayObj);
              const current = isToday(dayObj);
              
              let cellClass = 'text-textSecondary hover:bg-cardHover';
              
              if (!dayObj.isCurrentMonth) {
                cellClass = 'text-textMuted/50 hover:bg-cardHover/30';
              }
              
              if (current && !selected) {
                cellClass += ' border border-primary/50 text-primary font-bold';
              }
              
              if (selected) {
                cellClass = 'bg-primary text-black font-extrabold shadow-glow';
              }

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleDaySelect(dayObj)}
                  className={`h-8 w-full rounded flex items-center justify-center transition-all ${cellClass}`}
                >
                  {dayObj.day}
                </button>
              );
            })}
          </div>

          {/* Quick Navigation Action footer */}
          <div className="flex items-center justify-between p-2 border-t border-borderDark bg-cardBg/30">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2 py-1 bg-primary/10 border border-primary/25 hover:bg-primary hover:text-black rounded text-[10px] text-primary font-bold uppercase transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 hover:bg-cardHover border border-borderDark text-textSecondary rounded text-[10px] font-bold uppercase transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
