'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Colors for charts
const COLORS = {
  male: '#3182ce',
  female: '#d53f8c', 
  other: '#718096',
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'],
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
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={(entry: any) => `${entry.percent}%`}
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
  ageGroupsByGender?: {
    age18_21: { male: number; female: number };
    age22_25: { male: number; female: number };
    age26_35: { male: number; female: number };
    age36_45: { male: number; female: number };
    age46_60: { male: number; female: number };
    age60plus: { male: number; female: number };
  };
}

export function AgeBarChart({ 
  firstTimeVoters, 
  young22to25, 
  age26to35, 
  age36to45, 
  age46to60, 
  seniorCitizens,
  ageGroupsByGender 
}: AgeChartProps) {
  // If we have gender breakdown, use stacked bars
  if (ageGroupsByGender) {
    const data = [
      { name: '18-21', male: ageGroupsByGender.age18_21.male, female: ageGroupsByGender.age18_21.female },
      { name: '22-25', male: ageGroupsByGender.age22_25.male, female: ageGroupsByGender.age22_25.female },
      { name: '26-35', male: ageGroupsByGender.age26_35.male, female: ageGroupsByGender.age26_35.female },
      { name: '36-45', male: ageGroupsByGender.age36_45.male, female: ageGroupsByGender.age36_45.female },
      { name: '46-60', male: ageGroupsByGender.age46_60.male, female: ageGroupsByGender.age46_60.female },
      { name: '60+', male: ageGroupsByGender.age60plus.male, female: ageGroupsByGender.age60plus.female },
    ];

    return (
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={40} />
            <Tooltip 
              formatter={(value: any, name: any) => [
                Number(value).toLocaleString(), 
                name === 'male' ? '👨 Male' : '👩 Female'
              ]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={30}
              formatter={(value: any) => <span style={{ fontSize: '0.75rem' }}>{value === 'male' ? '👨 Male' : '👩 Female'}</span>}
            />
            <Bar dataKey="male" stackId="a" fill={COLORS.male} radius={[0, 0, 0, 0]} />
            <Bar dataKey="female" stackId="a" fill={COLORS.female} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback to old single-bar chart if no gender data
  const data = [
    { name: '18-21', value: firstTimeVoters, label: 'First-time' },
    { name: '22-25', value: young22to25, label: 'Young' },
    { name: '26-35', value: age26to35, label: 'Adults' },
    { name: '36-45', value: age36to45, label: 'Middle' },
    { name: '46-60', value: age46to60, label: 'Mature' },
    { name: '60+', value: seniorCitizens, label: 'Seniors' },
  ];

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 0 }}>
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
  const topSurnames = surnames.slice(0, 7);
  const othersCount = surnames.slice(7).reduce((sum, s) => sum + s.count, 0);
  
  const data = topSurnames.map((s) => ({
    name: s.name,
    value: s.count,
  }));
  
  if (othersCount > 0) {
    data.push({ name: 'इतर (Others)', value: othersCount });
  }

  // Create color mapping for each surname (based on original order)
  const colorMap = new Map<string, string>();
  data.forEach((item, index) => {
    colorMap.set(item.name, index < 7 ? COLORS.primary[index] : '#a0aec0');
  });

  // Sort data for legend display - descending by value, "Others" at end
  const sortedForLegend = [...data].sort((a, b) => {
    if (a.name === 'इतर (Others)') return 1;
    if (b.name === 'इतर (Others)') return -1;
    return b.value - a.value;
  });

  // Custom legend component
  const renderCustomLegend = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '6px 10px',
        marginTop: '8px',
        padding: '0 10px'
      }}>
        {sortedForLegend.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '0.75rem'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: colorMap.get(item.name),
              borderRadius: '2px'
            }} />
            <span style={{ color: '#4a5568', whiteSpace: 'nowrap' }}>{item.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 260, display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            label={({ percent }) => (percent ?? 0) > 0.03 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index < 7 ? COLORS.primary[index] : '#a0aec0'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {renderCustomLegend()}
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
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend 
            verticalAlign="bottom" 
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

// New Religion Distribution Chart
interface ReligionChartProps {
  data: Array<{ name: string; nameMr: string; count: number; percentage: number }>;
}

const RELIGION_COLORS: { [key: string]: string } = {
  Hindu: '#FF9933',
  Muslim: '#138808',
  Buddhist: '#000080',
  Christian: '#8B0000',
  Jain: '#FFD700',
  Sikh: '#FF4500',
  Unknown: '#A0AEC0'
};

export function ReligionPieChart({ data }: ReligionChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>No data available</div>;
  }

  const chartData = data.map(item => ({
    name: `${item.nameMr} (${item.name})`,
    value: item.count,
    percentage: item.percentage,
    religionKey: item.name
  }));

  // Create color mapping for each religion
  const colorMap = new Map<string, string>();
  chartData.forEach((item, index) => {
    const religionName = data[index].name;
    const color = RELIGION_COLORS[religionName] || COLORS.primary[index % COLORS.primary.length];
    colorMap.set(item.name, color);
  });

  // Sort data for legend display - descending by value
  const sortedForLegend = [...chartData].sort((a, b) => b.value - a.value);

  // Custom legend component
  const renderCustomLegend = () => {
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '6px 12px',
        marginTop: '12px',
        padding: '0 10px'
      }}>
        {sortedForLegend.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '0.75rem'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: colorMap.get(item.name),
              borderRadius: '2px'
            }} />
            <span style={{ color: '#4a5568', whiteSpace: 'nowrap' }}>{item.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart margin={{ top: 10, right: 0, bottom: 10, left: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={(entry: any) => entry.percentage > 2 ? `${entry.percentage}%` : ''}
            labelLine={false}
          >
            {chartData.map((entry, index) => {
              const religionName = data[index].name;
              const color = RELIGION_COLORS[religionName] || COLORS.primary[index % COLORS.primary.length];
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [
              `${Number(value).toLocaleString()} voters`,
              name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      {renderCustomLegend()}
    </div>
  );
}

// New Community Distribution Chart
interface CommunityChartProps {
  data: Array<{ name: string; nameMr: string; count: number; percentage: number }>;
}

// Quick Stats Card Component
interface QuickStatsProps {
  totalVoters: number;
  avgAge: number;
  genderRatio: number;
  firstTimeVoters: number;
  seniorCitizens: number;
}

export function QuickStatsCard({ totalVoters, avgAge, genderRatio, firstTimeVoters, seniorCitizens }: QuickStatsProps) {
  const stats = [
    { 
      icon: '👥', 
      label: 'Total Voters / एकूण मतदार',
      value: totalVoters.toLocaleString(), 
      color: '#3182ce' 
    },
    { 
      icon: '📅', 
      label: 'Average Age / सरासरी वय',
      value: `${avgAge.toFixed(1)} yrs`, 
      color: '#38b2ac' 
    },
    { 
      icon: '🆕', 
      label: 'First-time Voters / प्रथमवार मतदार',
      value: firstTimeVoters.toLocaleString(), 
      color: '#48bb78' 
    },
    { 
      icon: '👴', 
      label: 'Senior Citizens / ज्येष्ठ नागरिक',
      value: seniorCitizens.toLocaleString(), 
      color: '#ed8936' 
    },
  ];

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      {stats.map((stat, idx) => (
        <div 
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.65rem 0.85rem',
            background: '#f7fafc',
            borderRadius: '6px',
            borderLeft: `3px solid ${stat.color}`
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
          <span style={{ 
            flex: 1,
            color: '#2d3748',
            fontWeight: 500,
            fontSize: '0.9rem'
          }}>
            {stat.label}
          </span>
          <span style={{ 
            color: '#718096',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Community Distribution Chart
interface CommunityChartProps {
  data: Array<{ name: string; nameMr: string; count: number; percentage: number }>;
}

const COMMUNITY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E'];

export function CommunityBarChart({ data }: CommunityChartProps) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>No data available</div>;
  }

  const chartData = data.map((item, index) => ({
    name: item.nameMr,
    nameEn: item.name,
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={90}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            domain={[0, 'auto']}
            width={40}
          />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [
              `${Number(value).toLocaleString()} (${props.payload.percentage}%)`,
              'Voters'
            ]}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COMMUNITY_COLORS[index % COMMUNITY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// New Family Power Analysis Table
interface FamilyPowerProps {
  data: Array<{ family: string; surname: string; houseNo: string; voters: number }>;
}

export function FamilyPowerTable({ data }: FamilyPowerProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
        No influential families found (min 3 voters per family)
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxHeight: '300px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
          <tr>
            <th style={{ padding: '10px 8px', textAlign: 'left', color: '#2d3748' }}>Rank</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', color: '#2d3748' }}>Family (Surname)</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', color: '#2d3748' }}>House No</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', color: '#2d3748' }}>Voters</th>
          </tr>
        </thead>
        <tbody>
          {data.map((family, index) => (
            <tr 
              key={index} 
              style={{ 
                borderBottom: '1px solid #e2e8f0',
                background: index % 2 === 0 ? '#fff' : '#f7fafc'
              }}
            >
              <td style={{ padding: '10px 8px' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </td>
              <td style={{ padding: '10px 8px', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                {family.surname}
              </td>
              <td style={{ padding: '10px 8px', color: '#718096' }}>{family.houseNo}</td>
              <td style={{ 
                padding: '10px 8px', 
                textAlign: 'right', 
                fontWeight: 'bold',
                color: index < 3 ? '#2b6cb0' : '#4a5568'
              }}>
                {family.voters}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

