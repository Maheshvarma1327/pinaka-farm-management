import React, { useState, useEffect, useRef } from 'react';
import { useAnimalStore } from '../../store/useAnimalStore';
import { Search, Hash, ChevronDown } from 'lucide-react';

export default function AnimalSelect({ 
  value, 
  onChange, 
  onSelectFull, // optional callback to get the full animal object
  filterBySex, 
  filterByStage, 
  filterActive, 
  required = false, 
  disabled = false,
  className = ""
}) {
  const { animals, fetchAnimals } = useAnimalStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAnimals = animals.filter(a => {
    if (filterBySex && a.sex !== filterBySex) return false;
    if (filterByStage && a.lifecycleStage !== filterByStage) return false;
    if (filterActive && (a.operationalStatus === 'Culled' || a.operationalStatus === 'Dead' || a.isDeleted)) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (a.animalNo && a.animalNo.toLowerCase().includes(query)) ||
        (a.earTag && a.earTag.toLowerCase().includes(query)) ||
        (a.breed && a.breed.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const selectedAnimal = animals.find(a => a.animalNo === value || a._id === value);

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div 
        className={`dense-input flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed bg-sidebar/50' : 'bg-transparent'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate font-mono ${selectedAnimal ? 'text-primary font-bold' : 'text-textSecondary'}`}>
          {selectedAnimal ? `${selectedAnimal.animalNo} [${selectedAnimal.breed}]` : 'Select an animal...'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-textSecondary opacity-70" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-cardBg border border-borderDark rounded shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-borderDark/50 flex items-center gap-2 bg-sidebar/30">
            <Search className="w-3.5 h-3.5 text-textSecondary" />
            <input 
              type="text" 
              placeholder="Search ID, tag, breed..."
              className="w-full bg-transparent text-xs text-textPrimary outline-none font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredAnimals.length === 0 ? (
              <div className="p-3 text-xs text-textSecondary italic text-center">
                No matching animals found.
              </div>
            ) : (
              filteredAnimals.map(a => (
                <div 
                  key={a._id}
                  className="px-3 py-2 hover:bg-sidebar/50 cursor-pointer flex flex-col border-b border-borderDark/30 last:border-0 transition-colors"
                  onClick={() => {
                    if (onChange) onChange(a.animalNo); // usually forms store animalNo
                    if (onSelectFull) onSelectFull(a);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-primary font-bold text-xs flex items-center gap-1">
                      <Hash className="w-3 h-3 opacity-50" />
                      {a.animalNo}
                    </span>
                    <span className="text-[10px] text-textSecondary font-semibold px-1.5 py-0.5 rounded bg-sidebar border border-borderDark">
                      {a.lifecycleStage}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-textSecondary tracking-wide">
                    <span>{a.sex}</span>
                    <span>•</span>
                    <span>{a.breed}</span>
                    {a.earTag && (
                      <>
                        <span>•</span>
                        <span>Tag: {a.earTag}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
