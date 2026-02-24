import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { imageAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Image, CheckCircle, HardDrive, TrendingDown, Plus, Clock, ChevronRight, Zap } from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="glass-card p-6 hover:border-white/20 transition-all duration-300 group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/50 font-medium">{label}</div>
    {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          imageAPI.getStats(),
          imageAPI.getHistory(1, 5),
        ]);
        setStats(statsRes.data.stats);
        setRecent(historyRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <LoadingSpinner size="lg" text="Loading dashboard..." />
    </div>
  );

  const statCards = [
    { icon: Image, label: 'Total Images', value: stats?.totalImages || 0, color: 'bg-violet-600/30' },
    { icon: CheckCircle, label: 'Processed', value: stats?.completedImages || 0, color: 'bg-emerald-600/30' },
    { icon: HardDrive, label: 'Data Processed', value: formatBytes(stats?.totalOriginalSize), color: 'bg-cyan-600/30' },
    {
      icon: TrendingDown, label: 'Space Saved', value: formatBytes(stats?.totalSaved),
      color: 'bg-orange-600/30',
      sub: stats?.totalOriginalSize > 0
        ? `${((stats.totalSaved / stats.totalOriginalSize) * 100).toFixed(1)}% reduction`
        : null
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Good day, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-white/40 mt-1 text-sm">Here's what's happening with your images</p>
        </div>
        <Link to="/process" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Image
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-violet-400" />
            <h2 className="font-semibold text-white">Recent Activity</h2>
          </div>
          {recent.length > 0 && (
            <Link to="/history" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-violet-400" />
            </div>
            <h3 className="text-white/60 font-medium mb-2">No images yet</h3>
            <p className="text-white/30 text-sm mb-4">Upload your first image to get started</p>
            <Link to="/process" className="btn-primary inline-flex items-center gap-2">
              <Plus size={15} />
              Process an image
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((img) => (
              <div key={img.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {img.processedPath ? (
                    <img src={img.processedPath} alt={img.originalName}
                      className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={16} className="text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{img.originalName}</p>
                  <p className="text-xs text-white/40">
                    {formatBytes(img.originalSize)}
                    {img.processedSize && <span className="text-emerald-400"> → {formatBytes(img.processedSize)}</span>}
                    <span className="ml-2">{new Date(img.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  img.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                  img.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                  'bg-yellow-500/15 text-yellow-400'
                }`}>
                  {img.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
