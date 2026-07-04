import React, { useEffect, useState } from 'react';
import { BarChart3, Flame, Target, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import { StatCardSkeleton } from '../components/Skeleton';
import statsService from '../services/statsService';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card flex items-center gap-4 p-5 animate-slide-up">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService
      .getDetailedStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const chartData =
    stats?.cardsByChapter?.slice(0, 8).map((c) => ({
      name: `${c._id.subject} - ${c._id.chapter}`.slice(0, 20),
      count: c.count,
    })) || [];

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-2 animate-fade-in">
        <BarChart3 className="text-primary-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Statistics</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Target} label="Accuracy Rate" value={`${stats.accuracyRate}%`} accent="bg-primary-500" />
            <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} accent="bg-amber-500" />
            <StatCard
              icon={CheckSquare}
              label="Total Attempts"
              value={stats.totalCorrect + stats.totalIncorrect}
              accent="bg-emerald-500"
            />
          </div>

          <div className="glass-card mt-6 p-6 animate-slide-up">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">Cards by Chapter</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">No data yet — start creating flashcards!</p>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
