'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Colors for charts
const COLORS = {
  male: '#3182ce',
  female: '#d53f8c', 
  other: '#718096',
  primary: ['#FF9933', '#FF6600', '#e65c00', '#cc5200', '#b34700'],
  age: ['#48bb78', '#4299e1', '#ed8936', '#9f7aea', '#f56565', '#38b2ac']
};

interface GenderChartProps {
  male: number;
  female: number;
  other?: number;
}

export function GenderPieChart({ male, female, other = 0 }: GenderChartProps) {
  const total = male + female + other;
  const data = [
    { name: 'पुरुष (Male)', value: male, percent: ((male / total) * 100).toFixed(1) },
    { name: 'स्त्री (Female)', value: female, percent: ((female / total) * 100).toFixed(1) },
  ];
  
  if (other > 0) {
    data.push({ name: 'इतर (Other)', value: other, percent: ((other / total) * 100).toFixed(1) });
  }

  const colors = [COLORS.male, COLORS.female, COLORS.other];

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ percent }) => `${percent}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value: any) => <span style={{ color: '#4a5568', fontSize: '0.8rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AgeChartProps {
  firstTimeVoters: number;
  young22to25: number;
  age26to35: number;
  age36to45: number;
  age46to60: number;
  seniorCitizens: number;
}

export function AgeBarChart({ 
  firstTimeVoters, 
  young22to25, 
  age26to35, 
  age36to45, 
  age46to60, 
  seniorCitizens 
}: AgeChartProps) {
  const data = [
    { name: '18-21', value: firstTimeVoters, label: 'First-time' },
    { name: '22-25', value: young22to25, label: 'Young' },
    { name: '26-35', value: age26to35, label: 'Adults' },
    { name: '36-45', value: age36to45, label: 'Middle' },
    { name: '46-60', value: age46to60, label: 'Mature' },
    { name: '60+', value: seniorCitizens, label: 'Seniors' },
  ];

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={40} />
          <Tooltip 
            formatter={(value: any) => [Number(value).toLocaleString(), 'Voters']}
            labelFormatter={(label: any) => `Age: ${label}`}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.age[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SurnameChartProps {
  surnames: Array<{ name: string; count: number; percentage: string }>;
}

export function SurnameDonutChart({ surnames }: SurnameChartProps) {
  const topSurnames = surnames.slice(0, 5);
  const othersCount = surnames.slice(5).reduce((sum, s) => sum + s.count, 0);
  
  const data = topSurnames.map((s) => ({
    name: s.name,
    value: s.count,
  }));
  
  if (othersCount > 0) {
    data.push({ name: 'इतर (Others)', value: othersCount });
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index < 5 ? COLORS.primary[index] : '#a0aec0'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={50}
            formatter={(value: any) => <span style={{ color: '#4a5568', fontSize: '0.75rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FocusGroupChartProps {
  firstTimeVoters: { male: number; female: number };
  seniorVoters: { male: number; female: number };
}

export function FocusGroupChart({ firstTimeVoters, seniorVoters }: FocusGroupChartProps) {
  const data = [
    { 
      name: 'First-time (18-21)', 
      male: firstTimeVoters.male, 
      female: firstTimeVoters.female,
      total: firstTimeVoters.male + firstTimeVoters.female
    },
    { 
      name: 'Seniors (60+)', 
      male: seniorVoters.male, 
      female: seniorVoters.female,
      total: seniorVoters.male + seniorVoters.female
    },
  ];

  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend 
            verticalAlign="top" 
            height={30}
            formatter={(value: any) => <span style={{ fontSize: '0.75rem' }}>{value === 'male' ? '👨 Male' : '👩 Female'}</span>}
          />
          <Bar dataKey="male" stackId="a" fill={COLORS.male} radius={[0, 0, 0, 0]} />
          <Bar dataKey="female" stackId="a" fill={COLORS.female} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
