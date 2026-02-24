import { useEffect, useState } from 'react';
import { imageAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { Image, Trash2, Download, ChevronLeft, ChevronRight, ArrowRight, TrendingDown, History } from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatOps = (ops) => {
  if (!ops) return [];
  const parts = [];
  if (ops.filters?.length) parts.push(ops.filters.join(', '));
  if (ops.rotate) parts.push(`${ops.rotate}° rotation`);
  if (ops.resize?.width || ops.resize?.height) parts.push(`${ops.resize.width || '?'}×${ops.resize.height || '?'}px`);
  if (ops.format) parts.push(ops.format.toUpperCase());
  if (ops.quality) parts.push(`${ops.quality}% quality`);
  return parts;
};

const HistoryPage = () => {
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await imageAPI.getHistory(page, 8);
      setImages(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this image and its files?')) return;
    setDeleting(id);
    try {
      await imageAPI.deleteImage(id);
      toast.success('Image deleted');
      fetchHistory(pagination.page);
    } catch {
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (img) => {
    const url = img.processedPath || img.originalPath;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixelforge-${img.id}.${img.processedFormat || img.originalFormat}`;
    link.click();
  };

  if (loading && images.length === 0) return (
    <div className="flex items-center justify-center h-96">
      <LoadingSpinner size="lg" text="Loading history..." />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <History size={24} className="text-violet-400" />
            Processing History
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {pagination.total} image{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Image size={28} className="text-violet-400/60" />
          </div>
          <h3 className="text-white/60 font-semibold text-lg mb-2">No history yet</h3>
          <p className="text-white/30 text-sm">Process your first image to see it here</p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex justify-center mb-4">
              <LoadingSpinner size="sm" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((img) => {
              const ops = formatOps(img.operations);
              const savings = img.originalSize && img.processedSize
                ? ((1 - img.processedSize / img.originalSize) * 100).toFixed(1)
                : null;

              return (
                <div key={img.id} className="glass-card overflow-hidden group hover:border-white/20 transition-all duration-300">
                  {/* Image preview */}
                  <div className="relative h-44 bg-white/5 overflow-hidden">
                    {(img.processedPath || img.originalPath) ? (
                      <img
                        src={img.processedPath || img.originalPath}
                        alt={img.originalName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display='none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={24} className="text-white/20" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        img.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        img.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {img.status}
                      </span>
                    </div>

                    {/* Savings badge */}
                    {savings && parseFloat(savings) > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                          <TrendingDown size={10} />
                          {savings}%
                        </span>
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {img.processedPath && (
                        <button onClick={() => handleDownload(img)}
                          className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center hover:bg-violet-500 transition-colors">
                          <Download size={14} className="text-white" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(img.id)} disabled={deleting === img.id}
                        className="w-9 h-9 rounded-full bg-red-600/80 flex items-center justify-center hover:bg-red-600 transition-colors">
                        {deleting === img.id
                          ? <div className="w-3.5 h-3.5 rounded-full border border-white/40 border-t-white animate-spin" />
                          : <Trash2 size={14} className="text-white" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-white truncate" title={img.originalName}>
                      {img.originalName}
                    </p>

                    {/* Size comparison */}
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <span>{formatBytes(img.originalSize)}</span>
                      {img.processedSize && (
                        <>
                          <ArrowRight size={10} className="text-white/20" />
                          <span className="text-emerald-400">{formatBytes(img.processedSize)}</span>
                        </>
                      )}
                    </div>

                    {/* Operations tags */}
                    {ops.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ops.slice(0, 3).map((op, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                            {op}
                          </span>
                        ))}
                        {ops.length > 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/20">+{ops.length - 3}</span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-white/20">
                      {new Date(img.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => fetchHistory(pagination.page - 1)} disabled={pagination.page <= 1 || loading}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors border border-white/5">
                <ChevronLeft size={16} className="text-white/60" />
              </button>

              <span className="text-sm text-white/40 font-mono">
                {pagination.page} / {pagination.pages}
              </span>

              <button onClick={() => fetchHistory(pagination.page + 1)} disabled={pagination.page >= pagination.pages || loading}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors border border-white/5">
                <ChevronRight size={16} className="text-white/60" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
