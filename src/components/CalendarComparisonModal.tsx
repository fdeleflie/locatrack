import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Robust UTC date helpers to avoid local timezone shifts
const parseUTCDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatUTCDate = (date: Date) => {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
};

interface CalendarComparisonModalProps {
  onClose: () => void;
  initialMonthIndex?: number;
}

const months = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function CalendarComparisonModal({ onClose, initialMonthIndex = new Date().getMonth() }: CalendarComparisonModalProps) {
  const { state } = useStore();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialMonthIndex);

  const prevMonth = () => {
    setSelectedMonthIndex((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const nextMonth = () => {
    setSelectedMonthIndex((prev) => (prev === 11 ? 0 : prev + 1));
  };

  // Get all years from transactions or current year
  const years = useMemo(() => {
    const ySet = new Set<string>();
    state.transactions.forEach((t) => {
      ySet.add(t.date.substring(0, 4));
    });
    ySet.add(new Date().getFullYear().toString());
    return Array.from(ySet).sort((a, b) => b.localeCompare(a)); // Descending order (latest first)
  }, [state.transactions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Comparateur de Calendrier</h2>
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-sm font-bold w-24 text-center text-gray-900">
                {months[selectedMonthIndex]}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-gray-50">
          <div className="flex gap-6 min-w-max">
            {years.map((yearStr) => {
              const year = parseInt(yearStr);
              
              // Compute calendar logic
              const firstDay = new Date(year, selectedMonthIndex, 1).getDay(); // 0 is Sunday
              const daysInMonth = new Date(year, selectedMonthIndex + 1, 0).getDate();
              const startOffset = firstDay === 0 ? 6 : firstDay - 1;
              
              const days: (Date | null)[] = [];
              for (let i = 0; i < startOffset; i++) {
                days.push(null);
              }
              for (let i = 1; i <= daysInMonth; i++) {
                days.push(new Date(year, selectedMonthIndex, i));
              }

              // Compute occupancy rate
              let occupiedDays = 0;
              for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year}-${(selectedMonthIndex + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
                const hasTx = state.transactions.some(t => {
                   const start = parseUTCDate(t.date);
                   const end = parseUTCDate(t.date);
                   end.setUTCDate(end.getUTCDate() + (t.nights || 1) - 1);
                   const current = parseUTCDate(dateStr);
                   return current.getTime() >= start.getTime() && current.getTime() <= end.getTime();
                });
                if (hasTx) occupiedDays++;
              }
              
              const occupancyRate = ((occupiedDays / daysInMonth) * 100).toFixed(1);

              return (
                <div key={yearStr} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 w-80 flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">{year}</h3>
                    <div className="text-sm px-2 py-1 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-100">
                      Taux occ.: {occupancyRate}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((d) => (
                      <div key={d} className="text-xs font-medium text-gray-500 py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((date, idx) => {
                      if (!date) return <div key={`empty-${idx}`} className="p-2" />;
                      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
                      
                      const dayTxs = state.transactions
                        .filter((t) => {
                          const start = parseUTCDate(t.date);
                          const end = parseUTCDate(t.date);
                          end.setUTCDate(end.getUTCDate() + (t.nights || 1) - 1);
                          const current = parseUTCDate(dateStr);
                          return (
                            current.getTime() >= start.getTime() &&
                            current.getTime() <= end.getTime()
                          );
                        })
                        .sort((a, b) => {
                          const nightsA = a.nights || 1;
                          const nightsB = b.nights || 1;
                          return nightsB - nightsA;
                        });

                      return (
                        <div
                          key={dateStr}
                          className="relative p-1 min-h-[56px] text-sm text-center rounded-md bg-gray-50 flex flex-col items-center justify-start overflow-hidden border border-gray-100"
                        >
                          <span className="z-10 relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/90 font-medium text-xs shadow-sm">
                            {date.getDate()}
                          </span>
                          <div className="absolute top-6 left-0 right-0 flex flex-col gap-[1px] z-0 px-0.5">
                            {dayTxs.map((t, i) => {
                              const isStart = t.date === dateStr;
                              const endD = parseUTCDate(t.date);
                              endD.setUTCDate(endD.getUTCDate() + (t.nights || 1) - 1);
                              const isEnd = formatUTCDate(endD) === dateStr;
                              
                              return (
                                <div key={t.id + i} className="h-[8px] w-full flex items-center relative">
                                  <div
                                    className={`h-1.5 w-full absolute ${isStart ? "rounded-l-sm ml-0.5" : ""} ${isEnd ? "rounded-r-sm mr-0.5" : ""}`}
                                    style={{
                                      backgroundColor: state.settings.platformColors?.[t.platform] || "#9ca3af",
                                      left: isStart ? "0" : "-4px",
                                      right: isEnd ? "0" : "-4px"
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
