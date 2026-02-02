import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { PersonalityMatrix } from '@/types/competitiveAnalysis';

interface PersonalityMatrixChartProps {
  matrix: PersonalityMatrix;
}

export function PersonalityMatrixChart({ matrix }: PersonalityMatrixChartProps) {
  const data = useMemo(() => [
    { attribute: 'Innovation', value: matrix.innovationScore, fullMark: 10 },
    { attribute: 'Approachability', value: matrix.approachabilityScore, fullMark: 10 },
    { attribute: 'Technical', value: matrix.technicalScore, fullMark: 10 },
    { attribute: 'Boldness', value: matrix.boldnessScore, fullMark: 10 },
    { attribute: 'Enterprise', value: matrix.enterpriseScore, fullMark: 10 },
    { attribute: 'Global', value: matrix.globalScore, fullMark: 10 },
  ], [matrix]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="attribute" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Radar
            name="Brand Personality"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
