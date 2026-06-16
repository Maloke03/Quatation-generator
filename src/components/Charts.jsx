import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export function ProfitChart({ projects, expenses }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const labels = projects.map(p => p.projectName?.substring(0, 15) + (p.projectName?.length > 15 ? '...' : '') || 'Unnamed');
    const quoted = projects.map(p => p.grandTotal || 0);
    const actual = projects.map(p => {
      const projectExpenses = expenses.filter(e => e.projectId === p.id);
      return projectExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Quoted Amount',
          data: quoted,
          backgroundColor: 'rgba(74, 222, 128, 0.6)',
          borderColor: 'rgba(74, 222, 128, 1)',
          borderWidth: 2,
        },
        {
          label: 'Actual Expenses',
          data: actual,
          backgroundColor: 'rgba(248, 113, 113, 0.6)',
          borderColor: 'rgba(248, 113, 113, 1)',
          borderWidth: 2,
        }
      ]
    });
  }, [projects, expenses]);

  if (!chartData) {
    return <div className="text-center text-gray-500 py-4">No data to display</div>;
  }

  return (
    <div className="h-64">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#9ca3af' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#9ca3af' }
            },
            x: {
              ticks: { color: '#9ca3af' }
            }
          }
        }}
      />
    </div>
  );
}

export function StatusChart({ quotes }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    const statuses = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0
    };

    quotes.forEach(q => {
      if (statuses.hasOwnProperty(q.status)) {
        statuses[q.status]++;
      }
    });

    const colors = {
      draft: 'rgba(156, 163, 175, 0.8)',
      sent: 'rgba(96, 165, 250, 0.8)',
      accepted: 'rgba(74, 222, 128, 0.8)',
      rejected: 'rgba(248, 113, 113, 0.8)'
    };

    setChartData({
      labels: ['Draft', 'Sent', 'Accepted', 'Rejected'],
      datasets: [{
        data: [statuses.draft, statuses.sent, statuses.accepted, statuses.rejected],
        backgroundColor: [colors.draft, colors.sent, colors.accepted, colors.rejected],
        borderColor: ['#9ca3af', '#60a5fa', '#4ade80', '#f87171'],
        borderWidth: 2,
      }]
    });
  }, [quotes]);

  if (!chartData) {
    return <div className="text-center text-gray-500 py-4">No data to display</div>;
  }

  return (
    <div className="h-48">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#9ca3af' }
            }
          }
        }}
      />
    </div>
  );
}

export function MonthlyTrendChart({ quotes, expenses }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    const months = {};
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[key] = { quotes: 0, revenue: 0, expenses: 0 };
    }

    // Process quotes
    quotes.forEach(q => {
      const date = new Date(q.createdAt);
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (months[key]) {
        months[key].quotes++;
        months[key].revenue += (q.grandTotal || 0);
      }
    });

    // Process expenses
    expenses.forEach(e => {
      const date = new Date(e.date);
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (months[key]) {
        months[key].expenses += (e.amount || 0);
      }
    });

    const labels = Object.keys(months);
    // eslint-disable-next-line
    const quoteCounts = labels.map(l => months[l].quotes);
    const revenues = labels.map(l => months[l].revenue);
    const expenseTotals = labels.map(l => months[l].expenses);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenues,
          borderColor: 'rgba(74, 222, 128, 1)',
          backgroundColor: 'rgba(74, 222, 128, 0.2)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expenseTotals,
          borderColor: 'rgba(248, 113, 113, 1)',
          backgroundColor: 'rgba(248, 113, 113, 0.2)',
          fill: true,
          tension: 0.4,
        }
      ]
    });
  }, [quotes, expenses]);

  if (!chartData) {
    return <div className="text-center text-gray-500 py-4">No data to display</div>;
  }

  return (
    <div className="h-56">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#9ca3af' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#9ca3af' }
            },
            x: {
              ticks: { color: '#9ca3af' }
            }
          }
        }}
      />
    </div>
  );
}