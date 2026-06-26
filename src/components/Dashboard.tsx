import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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

    const isCurrentYear = selectedYear === new Date().getFullYear().toString();
    let daysInYear = 365;
    if (isCurrentYear) {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
      daysInYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      const yearNum = parseInt(selectedYear);
      if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) {
        daysInYear = 366;
      }
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
      
      const isCurrentYear = y === new Date().getFullYear().toString();
      let daysInYear = 365;
      if (isCurrentYear) {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
        daysInYear = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        const yearNum = parseInt(y);
        if ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) {
          daysInYear = 366;
        }
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
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Platform breakdown */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">Répartition</td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  <div className="flex gap-4 font-medium text-gray-700">
                    {state.settings.platforms.map(p => (
                      <div key={p} className="flex-1 text-center border-b border-gray-200 pb-1" style={{ color: state.settings.platformColors?.[p] }}>
                        {p}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Nb nuits</td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  <div className="flex gap-4">
                    {state.settings.platforms.map(p => (
                      <div key={p} className="flex-1 text-center">{yearData.platformStats[p]?.nights || 0}</div>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenus</td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  <div className="flex gap-4">
                    {state.settings.platforms.map(p => (
                      <div key={p} className="flex-1 text-center">{Math.round(yearData.platformStats[p]?.gross || 0)}</div>
                    ))}
                  </div>
                </td>
              </tr>
              {/* Core Metrics */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenu fiscal</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center bg-gray-50">{Math.round(yearData.fiscalGross)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenus brut</td>
                <td className="px-6 py-3 text-sm font-bold text-gray-900 text-center">{Math.round(yearData.gross)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Revenus net</td>
                <td className="px-6 py-3 text-sm font-bold text-green-700 text-center">{Math.round(yearData.net)}</td>
              </tr>
              {/* Monthly averages */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Brut mensuel</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{Math.round(yearData.gross / 12)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Net mensuel</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{Math.round(yearData.net / 12)}</td>
              </tr>
              {/* Per night averages */}
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Brut par nuit</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{yearData.nights > 0 ? Math.round(yearData.gross / yearData.nights) : 0}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">Net par nuit</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-center">{yearData.nights > 0 ? Math.round(yearData.net / yearData.nights) : 0}</td>
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
