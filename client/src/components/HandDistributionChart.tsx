import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GameState } from '@shared/schema';

interface HandDistributionChartProps {
  data: GameState['sessionStats']['handDistribution'];
}

const HAND_RANKS = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
];

export function HandDistributionChart({ data }: HandDistributionChartProps) {
  const chartData = HAND_RANKS.map(rank => ({
    name: rank,
    count: data[rank] || 0,
  })).filter(item => item.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg bg-black/70 p-3 text-white mt-4 text-center">
        <h3 className="text-md font-bold mb-2">Winning Hand Distribution</h3>
        <p className="text-sm text-gray-400">Win a hand to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/70 p-3 text-white mt-4">
      <h3 className="text-md font-bold mb-2 text-center">Winning Hand Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis type="number" stroke="#888" allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="#888" width={100} />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid #555' }}
          />
          <Bar dataKey="count" fill="#D4AF37" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
