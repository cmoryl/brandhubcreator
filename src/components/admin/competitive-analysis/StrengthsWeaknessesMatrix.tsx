import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StrengthsWeaknessesMatrix as MatrixType } from '@/types/competitiveAnalysis';

interface StrengthsWeaknessesMatrixProps {
  matrix: MatrixType;
}

export function StrengthsWeaknessesMatrix({ matrix }: StrengthsWeaknessesMatrixProps) {
  const data = useMemo(() => [
    { name: 'Design Sophistication', value: matrix.designSophistication },
    { name: 'Visual Consistency', value: matrix.visualConsistency },
    { name: 'User Centricity', value: matrix.userCentricity },
    { name: 'Innovation', value: matrix.innovation },
    { name: 'Clarity', value: matrix.clarity },
    { name: 'Emotional Connection', value: matrix.emotionalConnection },
    { name: 'Professional Polish', value: matrix.professionalPolish },
  ].sort((a, b) => b.value - a.value), [matrix]);

  const getBarColor = (value: number) => {
    if (value >= 8) return 'hsl(142, 76%, 36%)'; // green
    if (value >= 6) return 'hsl(48, 96%, 53%)'; // yellow
    if (value >= 4) return 'hsl(25, 95%, 53%)'; // orange
    return 'hsl(0, 84%, 60%)'; // red
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number" 
            domain={[0, 10]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
