"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
  badge?: string;
  badgeColor?: string;
  keywords?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

// Türkçe ve küçük-büyük harfe duyarsız arama normalleştirici
function normalizeSearchText(text: string): string {
  return (text || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim();
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Seçiniz veya arayın --",
  searchPlaceholder = "Aramak için yazın...",
  emptyMessage = "Eşleşen sonuç bulunamadı.",
  disabled = false,
  required = false,
  className = "",
  id,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Seçili seçeneği bul
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Arama filtresi
  const filteredOptions = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return options;

    return options.filter((opt) => {
      const matchLabel = normalizeSearchText(opt.label).includes(q);
      const matchSub = opt.sublabel && normalizeSearchText(opt.sublabel).includes(q);
      const matchGroup = opt.group && normalizeSearchText(opt.group).includes(q);
      const matchBadge = opt.badge && normalizeSearchText(opt.badge).includes(q);
      const matchKeywords = opt.keywords && normalizeSearchText(opt.keywords).includes(q);
      return matchLabel || matchSub || matchGroup || matchBadge || matchKeywords;
    });
  }, [options, searchQuery]);

  // Gruplandırılmış seçenekler
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: SearchableOption[] } = {};
    const ungrouped: SearchableOption[] = [];

    filteredOptions.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  }, [filteredOptions]);

  // Dropdown açıldığında arama kutusuna otomatik odaklan
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Dışarı tıklandığında veya ESC basıldığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full text-xs ${className}`}>
      {/* HTML5 Form Doğrulaması için Gizli Input */}
      {required && (
        <input
          tabIndex={-1}
          type="text"
          value={value || ""}
          required={required}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {/* Tetikleyici Buton / Alan */}
      <button
        id={selectId}
        name={name}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[36px] sm:min-h-[38px] px-2.5 py-1.5 bg-white border text-left flex items-center justify-between gap-2 transition cursor-pointer select-none font-mono ${
          isOpen
            ? "border-[#00adb5] ring-1 ring-[#00adb5]"
            : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "bg-slate-100 opacity-60 cursor-not-allowed border-slate-200" : ""}`}
      >
        <div className="flex-1 min-w-0 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedOption.badge && (
                <span
                  className={`text-[9.5px] font-bold px-1.5 py-0.2 shrink-0 ${
                    selectedOption.badgeColor || "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
              <span className="font-semibold text-slate-800 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-slate-400 font-normal truncate hidden sm:inline">
                  • {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer rounded-xs"
              title="Seçimi Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#00adb5]" : ""
            }`}
          />
        </div>
      </button>

      {/* Açılır Arama ve Seçenek Paneli */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 shadow-2xl z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Arama Inputu */}
          <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-mono text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0">
              {filteredOptions.length}
            </span>
          </div>

          {/* Liste */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500 font-mono text-[11px]">
                {emptyMessage}
              </div>
            ) : (
              <>
                {/* Gruplandırılmamış Öğeler */}
                {groupedOptions.ungrouped.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 text-left hover:bg-cyan-50/70 transition flex items-center justify-between gap-2 cursor-pointer font-mono group ${
                      opt.value === value ? "bg-cyan-50/90 text-[#00adb5] font-bold" : "text-slate-800"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        {opt.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 shrink-0 ${
                              opt.badgeColor || "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        <span className="truncate group-hover:text-[#00adb5] transition-colors">
                          {opt.label}
                        </span>
                      </div>
                      {opt.sublabel && (
                        <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {opt.value === value && (
                      <Check className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
                    )}
                  </button>
                ))}

                {/* Gruplandırılmış Öğeler */}
                {Object.entries(groupedOptions.groups).map(([groupName, groupOpts]) => (
                  <div key={groupName} className="border-t border-slate-200 first:border-t-0">
                    <div className="px-3 py-1 bg-slate-100/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                      {groupName} ({groupOpts.length})
                    </div>
                    {groupOpts.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full px-3 py-2 text-left hover:bg-cyan-50/70 transition flex items-center justify-between gap-2 cursor-pointer font-mono group ${
                          opt.value === value ? "bg-cyan-50/90 text-[#00adb5] font-bold" : "text-slate-800"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            {opt.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 shrink-0 ${
                                  opt.badgeColor || "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {opt.badge}
                              </span>
                            )}
                            <span className="truncate group-hover:text-[#00adb5] transition-colors">
                              {opt.label}
                            </span>
                          </div>
                          {opt.sublabel && (
                            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                        {opt.value === value && (
                          <Check className="w-3.5 h-3.5 text-[#00adb5] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
