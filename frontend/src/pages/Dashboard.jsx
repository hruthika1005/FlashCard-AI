import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Clock, Star, Upload, BookOpen, Brain, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import { StatCardSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import statsService from '../services/statsService';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService
      .getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const pieData =
    stats?.difficultyBreakdown?.map((d) => ({ name: d._id, value: d.count })) || [];

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Here's your learning overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Layers} label="Total Flashcards" value={stats.totalFlashcards} accent="bg-primary-500" />
          <StatCard icon={Clock} label="Due Today" value={stats.dueToday} accent="bg-amber-500" />
          <StatCard icon={Star} label="Favorites" value={stats.favoritesCount} accent="bg-rose-500" />
          <StatCard icon={Upload} label="Notes Uploaded" value={stats.totalNotesUploaded} accent="bg-accent-500" />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2 animate-slide-up">
          <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to="/upload" className="glass-card flex flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-1">
              <Upload className="text-primary-500" size={26} />
              <span className="text-sm font-semibold">Upload Notes</span>
            </Link>
            <Link to="/study" className="glass-card flex flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-1">
              <BookOpen className="text-emerald-500" size={26} />
              <span className="text-sm font-semibold">Study Mode</span>
            </Link>
            <Link to="/quiz" className="glass-card flex flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-1">
              <Brain className="text-accent-500" size={26} />
              <span className="text-sm font-semibold">Quiz Mode</span>
            </Link>
          </div>

          {stats?.subjectBreakdown?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <TrendingUp size={16} /> Top Subjects
              </h3>
              <div className="space-y-2">
                {stats.subjectBreakdown.map((s) => (
                  <div key={s._id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{s._id}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{s.count} cards</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-6 animate-slide-up">
          <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">Difficulty Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-400">No flashcards yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
