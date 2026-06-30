import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function Dashboard() {
  const { state } = useStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const years = useMemo(() => {
    const y = new Set<string>(state.transactions.map((t) => t.date.substring(0, 4)));
    y.add(new Date().getFullYear().toString());
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [state.transactions]);

  const distributedDays = useMemo(() => {
    const days: { date: string; amount: number; platform: string; fiscalAmount: number }[] = [];
    state.transactions.forEach(t => {
      const nights = t.nights || 1;
      const dailyAmount = t.amount / nights;
      const fiscalAmount = (t.clientAmount !== undefined && t.clientAmount !== null && !isNaN(t.clientAmount) && t.clientAmount > 0) ? t.clientAmount : t.amount;
      const dailyFiscalAmount = fiscalAmount / nights;
      const current = new Date(t.date);
      for (let i = 0; i < nights; i++) {
        days.push({
          date: current.toISOString().split('T')[0],
          amount: dailyAmount,
          platform: t.platform,
          fiscalAmount: dailyFiscalAmount
        });
        current.setDate(current.getDate() + 1);
      }
    });
    return days;
  }, [state.transactions]);

  const yearData = useMemo(() => {
    const yearDays = distributedDays.filter((d) => d.date.startsWith(selectedYear));
    const previousYearStr = (parseInt(selectedYear) - 1).toString();
    const previousYearDays = distributedDays.filter((d) => d.date.startsWith(previousYearStr));

    const nights = yearDays.length;
    const gross = yearDays.reduce((acc, curr) => acc + curr.amount, 0);
    const fiscalGross = yearDays.reduce((acc, curr) => acc + curr.fiscalAmount, 0);
    
    const previousGross = previousYearDays.reduce((acc, curr) => acc + curr.amount, 0);
    const previousNights = previousYearDays.length;

    // Platform breakdown
    const platformStats: Record<string, { nights: number; gross: number }> = {};
    state.settings.platforms.forEach(p => {
      platformStats[p] = { nights: 0, gross: 0 };
    });
    
    yearDays.forEach(d => {
      if (!platformStats[d.platform]) {
        platformStats[d.platform] = { nights: 0, gross: 0 };
      }
      platformStats[d.platform].nights += 1;
      platformStats[d.platform].gross += d.amount;
    });

    const currentYearTaxes = state.settings.yearlyTaxes?.[selectedYear] || state.settings.yearlyTaxes?.[new Date().getFullYear().toString()] || {
      csgRate: 18.6, taxRate: 11, abattementRate: 70, chargeParNuit: 5, chargeFonciere: 383
    };

    const prevYearTaxes = state.settings.yearlyTaxes?.[(parseInt(selectedYear) - 1).toString()] || currentYearTaxes;

    // Approximate calculations (to be refined by user)
    // Charges
    const variableCharges = nights * currentYearTaxes.chargeParNuit;
    const fixedCharges = currentYearTaxes.chargeFonciere;
    const totalCharges = variableCharges + fixedCharges;

    // Taxes (Micro-BIC estimation according to user's exact formula)
    const blackGross = yearDays.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
    const declaredGross = gross - blackGross;
    
    // User formula: (AG61+AH61+AJ61)*AH68/100*AH70/100
    const estimatedTaxes = declaredGross * (currentYearTaxes.abattementRate / 100) * (currentYearTaxes.csgRate / 100);

    // Net calculations
    const net = gross - estimatedTaxes - variableCharges - fixedCharges;
    const netNet = net; // Keeping variable for compatibility if used elsewhere

    // Previous year net
    const prevBlackGross = previousYearDays.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
    const prevDeclaredGross = previousGross - prevBlackGross;
    const prevVariableCharges = previousNights * prevYearTaxes.chargeParNuit;
    const prevTotalCharges = prevVariableCharges + prevYearTaxes.chargeFonciere;
    const prevEstimatedTaxes = prevDeclaredGross * (prevYearTaxes.abattementRate / 100) * (prevYearTaxes.csgRate / 100);
    const prevNet = previousGross - prevTotalCharges - prevEstimatedTaxes;

    const gainNet = net - prevNet;
    const gainNetPercent = prevNet > 0 ? (gainNet / prevNet) * 100 : 0;

    let daysInYear = 365;
    const yearNum = parseInt(selectedYear);
    if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) {
      daysInYear = 366;
    }
    
    const occupancyRate = (nights / Math.max(1, daysInYear)) * 100;

    return {
      nights,
      gross,
      fiscalGross,
      net,
      netNet,
      platformStats,
      occupancyRate,
      gainNet,
      gainNetPercent,
      yearDays
    };
  }, [distributedDays, selectedYear, state.settings]);

  const yearDataToDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yearDays = distributedDays.filter((d) => d.date.startsWith(selectedYear) && d.date <= today);
    const previousYearStr = (parseInt(selectedYear) - 1).toString();
    const prevToday = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    const previousYearDays = distributedDays.filter((d) => d.date.startsWith(previousYearStr) && d.date <= prevToday);

    const nights = yearDays.length;
    const gross = yearDays.reduce((acc, curr) => acc + curr.amount, 0);
    const fiscalGross = yearDays.reduce((acc, curr) => acc + curr.fiscalAmount, 0);
    
    const previousGross = previousYearDays.reduce((acc, curr) => acc + curr.amount, 0);
    const previousNights = previousYearDays.length;

    // Platform breakdown
    const platformStats: Record<string, { nights: number; gross: number }> = {};
    state.settings.platforms.forEach(p => {
      platformStats[p] = { nights: 0, gross: 0 };
    });
    
    yearDays.forEach(d => {
      if (!platformStats[d.platform]) {
        platformStats[d.platform] = { nights: 0, gross: 0 };
      }
      platformStats[d.platform].nights += 1;
      platformStats[d.platform].gross += d.amount;
    });

    const currentYearTaxes = state.settings.yearlyTaxes?.[selectedYear] || state.settings.yearlyTaxes?.[new Date().getFullYear().toString()] || {
      csgRate: 18.6, taxRate: 11, abattementRate: 70, chargeParNuit: 5, chargeFonciere: 383
    };

    const variableCharges = nights * currentYearTaxes.chargeParNuit;
    const fixedCharges = currentYearTaxes.chargeFonciere;

    const blackGross = yearDays.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
    const declaredGross = gross - blackGross;
    const estimatedTaxes = declaredGross * (currentYearTaxes.abattementRate / 100) * (currentYearTaxes.csgRate / 100);
    const net = gross - estimatedTaxes - variableCharges - fixedCharges;

    const startOfYear = new Date(parseInt(selectedYear), 0, 1);
    let todayDate = new Date();
    if (selectedYear !== todayDate.getFullYear().toString()) {
        todayDate = new Date(parseInt(selectedYear), 11, 31);
    }
    const diffTime = Math.max(0, todayDate.getTime() - startOfYear.getTime());
    let daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysElapsed === 0) daysElapsed = 1;
    const occupancyRate = (nights / daysElapsed) * 100;

    return {
      nights,
      gross,
      fiscalGross,
      net,
      platformStats,
      occupancyRate
    };
  }, [distributedDays, selectedYear, state.settings]);

  // Monthly breakdown
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthlyData = useMemo(() => {
    return months.map((monthName, index) => {
      const monthPrefix = `${selectedYear}-${(index + 1).toString().padStart(2, '0')}`;
      const days = yearData.yearDays.filter(d => d.date.startsWith(monthPrefix));
      const gross = days.reduce((acc, curr) => acc + curr.amount, 0);
      return { name: monthName, gross };
    });
  }, [yearData.yearDays, selectedYear]);

  const yearlyChartData = useMemo(() => {
    return years.map(y => {
      const yDays = distributedDays.filter(d => d.date.startsWith(y));
      const nights = yDays.length;
      const gross = yDays.reduce((acc, curr) => acc + curr.amount, 0);
      const blackGross = yDays.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
      const declaredGross = gross - blackGross;
      
      const yTaxes = state.settings.yearlyTaxes?.[y] || state.settings.yearlyTaxes?.[new Date().getFullYear().toString()] || {
        csgRate: 18.6, taxRate: 11, abattementRate: 70, chargeParNuit: 5, chargeFonciere: 383
      };
      
      const variableCharges = nights * yTaxes.chargeParNuit;
      const fixedCharges = yTaxes.chargeFonciere;
      const estimatedTaxes = declaredGross * (yTaxes.abattementRate / 100) * (yTaxes.csgRate / 100);
      const net = gross - estimatedTaxes - variableCharges - fixedCharges;
      
      let daysInYear = 365;
      const yearNum = parseInt(y);
      if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) {
        daysInYear = 366;
      }
      const occupancyRate = (nights / Math.max(1, daysInYear)) * 100;
      
      return {
        year: y,
        net: Math.round(net),
        gross: Math.round(gross),
        occupancyRate: Number(occupancyRate.toFixed(2)),
        netPerNight: nights > 0 ? Number((net / nights).toFixed(2)) : 0
      };
    }).reverse(); // chronological order for chart
  }, [years, distributedDays, state.settings]);

  const monthlyComparisonData = useMemo(() => {
    return months.map((monthName, index) => {
      const monthStr = (index + 1).toString().padStart(2, '0');
      const dataPoint: any = { name: monthName.substring(0, 3) };
      
      years.forEach(y => {
        const monthPrefix = `${y}-${monthStr}`;
        const days = distributedDays.filter(d => d.date.startsWith(monthPrefix));
        const nights = days.length;
        const gross = days.reduce((acc, curr) => acc + curr.amount, 0);
        
        const blackGross = days.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
        const declaredGross = gross - blackGross;
        
        const yTaxes = state.settings.yearlyTaxes?.[y] || state.settings.yearlyTaxes?.[new Date().getFullYear().toString()] || {
          csgRate: 18.6, taxRate: 11, abattementRate: 70, chargeParNuit: 5, chargeFonciere: 383
        };
        
        const variableCharges = nights * yTaxes.chargeParNuit;
        const fixedCharges = yTaxes.chargeFonciere / 12;
        const estimatedTaxes = declaredGross * (yTaxes.abattementRate / 100) * (yTaxes.csgRate / 100);
        const net = gross - estimatedTaxes - variableCharges - fixedCharges;
        
        dataPoint[y] = Math.round(net);
      });
      
      return dataPoint;
    });
  }, [months, years, distributedDays, state.settings]);

  const totalNetAllYears = useMemo(() => {
    return yearlyChartData.reduce((acc, curr) => acc + curr.net, 0);
  }, [yearlyChartData]);

  const totalInvestment = useMemo(() => {
    return state.settings.houseCosts?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  }, [state.settings.houseCosts]);

  const remainingInvestment = totalInvestment - totalNetAllYears;

  const currentYearStr = new Date().getFullYear().toString();
  const formattedToday = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const [comparisonRefYear, setComparisonRefYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return years.includes(current) ? current : (years[0] || current);
  });

  const comparisonData = useMemo(() => {
    const today = new Date();
    const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const isBeforeOrOnTodayMD = (dateStr: string) => {
      const md = dateStr.substring(5, 10);
      return md <= todayStr;
    };

    return years.map(y => {
      const periodDays = distributedDays.filter(d => d.date.startsWith(y) && isBeforeOrOnTodayMD(d.date));
      const gross = periodDays.reduce((acc, curr) => acc + curr.amount, 0);
      const nights = periodDays.length;
      const blackGross = periodDays.filter(d => d.platform === 'Black' || d.platform.toLowerCase() === 'black').reduce((acc, curr) => acc + curr.amount, 0);
      const declaredGross = gross - blackGross;

      const yTaxes = state.settings.yearlyTaxes?.[y] || state.settings.yearlyTaxes?.[currentYearStr] || {
        csgRate: 18.6, taxRate: 11, abattementRate: 70, chargeParNuit: 5, chargeFonciere: 383
      };

      const estimatedTaxes = declaredGross * (yTaxes.abattementRate / 100) * (yTaxes.csgRate / 100);
      const variableCharges = nights * yTaxes.chargeParNuit;

      // Elapsed days in period of year y
      const startOfYear = new Date(parseInt(y), 0, 1);
      const endOfPeriod = new Date(parseInt(y), today.getMonth(), today.getDate());
      const diffTime = Math.abs(endOfPeriod.getTime() - startOfYear.getTime());
      const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const isLeap = (yearNum: number) => (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
      const totalDays = isLeap(parseInt(y)) ? 366 : 365;

      const fixedCharges = yTaxes.chargeFonciere * (elapsedDays / totalDays);
      const net = gross - estimatedTaxes - variableCharges - fixedCharges;

      const occupancyRate = (nights / elapsedDays) * 100;

      return {
        year: y,
        gross: Math.round(gross),
        nights,
        occupancyRate: Number(occupancyRate.toFixed(1)),
        net: Math.round(net),
        elapsedDays
      };
    });
  }, [years, distributedDays, state.settings, currentYearStr]);

  const referenceYearComparison = useMemo(() => {
    return comparisonData.find(d => d.year === comparisonRefYear);
  }, [comparisonData, comparisonRefYear]);

  const chartColors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2', '#be123c'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Synthèse Annuelle</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-md shadow-sm py-2 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base font-semibold bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>Année {y}</option>
          ))}
        </select>
      </div>


      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Revenus Brut</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{Math.round(yearData.gross).toLocaleString()} €</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Revenus Net</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{Math.round(yearData.net).toLocaleString()} €</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Taux d'occupation</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{yearData.occupancyRate.toFixed(2)} %</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Nb nuits total</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{yearData.nights}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Total Net (Global)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{totalNetAllYears.toLocaleString()} €</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500">Coût Maison</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{remainingInvestment > 0 ? remainingInvestment.toLocaleString() : 0} €</p>
        </div>
      </div>

      {/* Comparatif à date section */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Comparateur d'avancement à date (du 1er Janvier au {formattedToday})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Comparez vos performances cumulées de chaque année sur la même période pour savoir si vous êtes en avance ou en retard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Année de référence :</span>
            <select
              value={comparisonRefYear}
              onChange={(e) => setComparisonRefYear(e.target.value)}
              className="border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>Année {y}</option>
              ))}
            </select>
            <div className="bg-blue-50 px-3 py-1.5 rounded-md text-xs font-semibold text-blue-700 flex items-center gap-1.5 border border-blue-100">
              <Info className="w-4 h-4 shrink-0" />
              Proratisation linéaire des charges fixes & impôts au jour près
            </div>
          </div>
        </div>

        <div className="w-full">
          {/* Table comparison */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Année</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nuits cumulées</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Taux Occ.</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Brut à date</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Net à date</th>
                  <th scope="col" className="px-4 py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Écart vs {comparisonRefYear}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonData.map((d) => {
                  const isRef = d.year === comparisonRefYear;
                  const refNet = referenceYearComparison?.net || 0;
                  const diff = refNet - d.net;
                  const pct = d.net !== 0 ? (diff / Math.abs(d.net)) * 100 : 0;
                  const isAhead = diff >= 0;

                  return (
                    <tr key={d.year} className={`${isRef ? 'bg-blue-50/50 font-semibold' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">
                        {d.year} {isRef && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded-full font-bold">Référence</span>}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700 text-right">{d.nights} nuits</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700 text-right">{d.occupancyRate}%</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-700 text-right">{d.gross.toLocaleString()} €</td>
                      <td className={`px-4 py-2.5 whitespace-nowrap text-sm text-right font-bold ${isRef ? 'text-blue-700' : 'text-gray-900'}`}>
                        {d.net.toLocaleString()} €
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-center">
                        {isRef ? (
                          <span className="text-gray-400 font-normal italic">-</span>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold ${
                              isAhead ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isAhead ? `+${diff.toLocaleString()} €` : `${diff.toLocaleString()} €`}
                            </span>
                            <span className={`text-[10px] font-bold ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
                              {isAhead ? 'En avance de +' : 'En retard de '}{pct.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual progress bar comparison chart */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Visualisation graphique : Revenu Net cumulé au {formattedToday} par année
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...comparisonData].reverse()} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}€`} />
                <RechartsTooltip formatter={(value) => [`${value} €`, 'Net cumulé à date']} cursor={{ fill: '#f3f4f6' }} />
                <Bar 
                  dataKey="net" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50}
                >
                  {[...comparisonData].reverse().map((entry, index) => {
                    const isRef = entry.year === comparisonRefYear;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isRef ? '#2563eb' : '#10b981'} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenu Net par Année</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}€`} />
                <RechartsTooltip formatter={(value) => [`${value} €`, 'Net']} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="net" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Comparatif Mensuel (Net)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}€`} />
                <RechartsTooltip formatter={(value, name) => [`${value} €`, `Année ${name}`]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                {years.map((y, i) => (
                  <Line 
                    key={y} 
                    type="monotone" 
                    dataKey={y} 
                    stroke={chartColors[i % chartColors.length]} 
                    strokeWidth={y === selectedYear ? 3 : 1.5}
                    dot={{ r: y === selectedYear ? 4 : 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taux d'occupation par Année</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                <RechartsTooltip formatter={(value) => [`${value} %`, "Taux d'occupation"]} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="occupancyRate" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Prix Moyen Net par Nuit</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}€`} />
                <RechartsTooltip formatter={(value) => [`${value} €`, "Prix moyen net"]} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="netPerNight" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthesis Table (Mimicking Excel format) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Bilan détaillé {selectedYear}</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-1/3">Indicateur</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 w-1/3">Projeté</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 w-1/3">À date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">Taux d'occupation</td>
                <td className="px-6 py-3 text-sm text-center text-gray-900">{yearData.occupancyRate.toFixed(1)} %</td>
                <td className="px-6 py-3 text-sm text-center text-gray-900 bg-gray-50/50">{yearDataToDate.occupancyRate.toFixed(1)} %</td>
              </tr>
              {/* Platform breakdown */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold mb-1 border-b border-gray-200 pb-1">Plateformes</span>
                    <span className="text-gray-500">Nb nuits</span>
                    <span className="text-gray-500">Revenus brut</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500 text-center">
                   <div className="flex flex-col gap-1">
                     <div className="flex gap-2 font-medium border-b border-gray-200 pb-1 text-gray-700 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center" style={{ color: state.settings.platformColors?.[p] }}>{p.substring(0, 3)}</div>)}
                     </div>
                     <div className="flex gap-2 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center text-gray-900">{yearData.platformStats[p]?.nights || 0}</div>)}
                     </div>
                     <div className="flex gap-2 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center text-gray-900">{Math.round(yearData.platformStats[p]?.gross || 0)}</div>)}
                     </div>
                   </div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500 text-center bg-gray-50/50">
                   <div className="flex flex-col gap-1">
                     <div className="flex gap-2 font-medium border-b border-gray-200 pb-1 text-gray-700 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center" style={{ color: state.settings.platformColors?.[p] }}>{p.substring(0, 3)}</div>)}
                     </div>
                     <div className="flex gap-2 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center text-gray-900">{yearDataToDate.platformStats[p]?.nights || 0}</div>)}
                     </div>
                     <div className="flex gap-2 justify-center">
                       {state.settings.platforms.map(p => <div key={p} className="flex-1 text-center text-gray-900">{Math.round(yearDataToDate.platformStats[p]?.gross || 0)}</div>)}
                     </div>
                   </div>
                </td>
              </tr>
              {/* Core Metrics */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">Total Nuitées</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center">{yearData.nights}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center bg-gray-50/50">{yearDataToDate.nights}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenu fiscal</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center">{Math.round(yearData.fiscalGross)}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center bg-gray-50/50">{Math.round(yearDataToDate.fiscalGross)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">Revenus brut</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center">{Math.round(yearData.gross)}</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center bg-gray-50/50">{Math.round(yearDataToDate.gross)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenus net</td>
                <td className="px-6 py-3 text-sm font-bold text-green-700 text-center">{Math.round(yearData.net)}</td>
                <td className="px-6 py-3 text-sm font-bold text-green-700 text-center bg-gray-50/50">{Math.round(yearDataToDate.net)}</td>
              </tr>
              {/* Monthly averages */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">Brut mensuel</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{Math.round(yearData.gross / 12)}</td>
                <td className="px-6 py-3 text-sm text-gray-400 text-center bg-gray-50/50">-</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Net mensuel</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{Math.round(yearData.net / 12)}</td>
                <td className="px-6 py-3 text-sm text-gray-400 text-center bg-gray-50/50">-</td>
              </tr>
              {/* Per night averages */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50">Brut par nuit</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{yearData.nights > 0 ? Math.round(yearData.gross / yearData.nights) : 0}</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center bg-gray-50/50">{yearDataToDate.nights > 0 ? Math.round(yearDataToDate.gross / yearDataToDate.nights) : 0}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Net par nuit</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{yearData.nights > 0 ? Math.round(yearData.net / yearData.nights) : 0}</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center bg-gray-50/50">{yearDataToDate.nights > 0 ? Math.round(yearDataToDate.net / yearDataToDate.nights) : 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Revenus mensuels (Brut)</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((m) => (
                <tr key={m.name} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 w-1/2">{m.name}</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-700 text-right">{Math.round(m.gross)} €</td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Total 12 mois</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">{Math.round(yearData.gross)} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
