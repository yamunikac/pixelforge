import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { imageAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload, X, Download, RotateCw, Crop, Zap, Palette,
  ArrowRight, CheckCircle, Image, RefreshCw, TrendingDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const FILTERS = ['grayscale', 'sepia', 'blur'];
const FORMATS = ['jpeg', 'png'];
const ROTATIONS = [0, 90, 180, 270];

const ProcessorPage = () => {
  // Upload state
  const [preview, setPreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Processing options
  const [options, setOptions] = useState({
    enhance: false,
    quality: 80,
    rotate: 0,
    format: 'jpeg',
    filters: [],
    removeBackground: false,
    resize: { width: '', height: '' },
  });

  // Result state
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // Drag & drop upload
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0];
      if (err.code === 'file-too-large') toast.error('File too large. Max size is 5MB.');
      else if (err.code === 'file-invalid-type') toast.error('Only JPG and PNG files are allowed.');
      else toast.error(err.message);
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Show local preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setUploadedImage(null);

    // Upload to server
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await imageAPI.upload(formData, setUploadProgress);
      setUploadedImage(data.image);
      toast.success('Image uploaded! Configure processing options below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: uploading || processing,
  });

  const toggleFilter = (filter) => {
    setOptions(prev => ({
      ...prev,
      filters: prev.filters.includes(filter)
        ? prev.filters.filter(f => f !== filter)
        : [...prev.filters, filter],
    }));
  };

  const handleProcess = async () => {
    if (!uploadedImage) return toast.error('Please upload an image first');

    setProcessing(true);
    try {
      const payload = {
        ...options,
        resize: {
          width: options.resize.width ? parseInt(options.resize.width) : undefined,
          height: options.resize.height ? parseInt(options.resize.height) : undefined,
        },
      };
      const { data } = await imageAPI.process(uploadedImage.id, payload);
      setResult(data.image);
      toast.success('Image processed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setUploadedImage(null);
    setResult(null);
    setOptions({ enhance: false, quality: 80, rotate: 0, format: 'jpeg', filters: [], removeBackground: false, resize: { width: '', height: '' } });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.processedPath;
    link.download = `pixelforge-processed.${result.format}`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Image Processor</h1>
        <p className="text-white/40 text-sm">Upload, configure, and download your transformed image</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Upload + Preview */}
        <div className="space-y-4">
          {/* Drop Zone */}
          {!preview ? (
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'dropzone-active border-violet-400 bg-violet-500/10'
                  : 'border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Upload size={24} className={isDragActive ? 'text-violet-400 scale-110' : 'text-white/40'} />
                </div>
                <div>
                  <p className="text-white/70 font-medium text-lg">
                    {isDragActive ? 'Drop it here!' : 'Drag & drop your image'}
                  </p>
                  <p className="text-white/30 text-sm mt-1">
                    or <span className="text-violet-400">click to browse</span>
                  </p>
                  <p className="text-white/20 text-xs mt-3">Supports JPG, PNG · Max 5MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-white/5" />
                <button onClick={handleReset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur hover:bg-red-500/80 flex items-center justify-center transition-colors">
                  <X size={14} className="text-white" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner text="Uploading..." />
                    <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-white/60 text-xs font-mono">{uploadProgress}%</p>
                  </div>
                )}
              </div>
              {uploadedImage && (
                <div className="p-4 flex items-center gap-3 border-t border-white/5">
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="text-white/70">{uploadedImage.originalName}</span>
                    <span className="text-white/30 ml-2">{formatBytes(uploadedImage.originalSize)}</span>
                    <span className="text-white/30 ml-2">{uploadedImage.width}×{uploadedImage.height}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Preview */}
          {result && (
            <div className="glass-card overflow-hidden border-emerald-500/20 animate-slide-up">
              <div className="px-4 pt-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Processing Complete</span>
              </div>
              <img src={result.processedPath} alt="Processed"
                className="w-full h-64 object-contain bg-white/5 mt-3" />
              <div className="p-4 border-t border-white/5 space-y-3">
                {/* Size comparison */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/50">{formatBytes(result.originalSize)}</span>
                  <ArrowRight size={14} className="text-white/30" />
                  <span className="text-emerald-400 font-medium">{formatBytes(result.processedSize)}</span>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                    <TrendingDown size={11} />
                    {result.compressionRatio}% saved
                  </span>
                </div>
                <button onClick={handleDownload}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  <Download size={16} />
                  Download {result.format?.toUpperCase()}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Processing Options */}
        <div className="glass-card p-6 space-y-6 h-fit">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Zap size={16} className="text-violet-400" />
            Processing Options
          </h2>

          {/* Enhance */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white/80">Enhance Clarity</div>
              <div className="text-xs text-white/30">Sharpen and improve details</div>
            </div>
            <button
              onClick={() => setOptions(p => ({ ...p, enhance: !p.enhance }))}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${options.enhance ? 'bg-violet-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${options.enhance ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Remove Background */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white/80">Remove Background</div>
              <div className="text-xs text-white/30">Replace with white background</div>
            </div>
            <button
              onClick={() => setOptions(p => ({ ...p, removeBackground: !p.removeBackground }))}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${options.removeBackground ? 'bg-violet-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${options.removeBackground ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Compression Quality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                <TrendingDown size={14} className="text-cyan-400" />
                Compression Quality
              </div>
              <span className="text-xs font-mono text-violet-400">{options.quality}%</span>
            </div>
            <input type="range" min="10" max="100" value={options.quality}
              onChange={e => setOptions(p => ({ ...p, quality: parseInt(e.target.value) }))}
              className="w-full" />
            <div className="flex justify-between text-xs text-white/20 mt-1">
              <span>Small file</span><span>High quality</span>
            </div>
          </div>

          {/* Resize / Crop */}
          <div>
            <div className="text-sm font-medium text-white/80 mb-3 flex items-center gap-1.5">
              <Crop size={14} className="text-cyan-400" />
              Resize / Crop
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/30 mb-1 block">Width (px)</label>
                <input type="number" placeholder="Auto" value={options.resize.width}
                  onChange={e => setOptions(p => ({ ...p, resize: { ...p.resize, width: e.target.value } }))}
                  className="input-field text-sm py-2" min="1" max="5000" />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Height (px)</label>
                <input type="number" placeholder="Auto" value={options.resize.height}
                  onChange={e => setOptions(p => ({ ...p, resize: { ...p.resize, height: e.target.value } }))}
                  className="input-field text-sm py-2" min="1" max="5000" />
              </div>
            </div>
          </div>

          {/* Rotate */}
          <div>
            <div className="text-sm font-medium text-white/80 mb-3 flex items-center gap-1.5">
              <RotateCw size={14} className="text-cyan-400" />
              Rotate
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ROTATIONS.map(deg => (
                <button key={deg}
                  onClick={() => setOptions(p => ({ ...p, rotate: deg }))}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    options.rotate === deg
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-transparent'
                  }`}>
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div>
            <div className="text-sm font-medium text-white/80 mb-3 flex items-center gap-1.5">
              <Image size={14} className="text-cyan-400" />
              Output Format
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(fmt => (
                <button key={fmt}
                  onClick={() => setOptions(p => ({ ...p, format: fmt }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold uppercase transition-all ${
                    options.format === fmt
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-transparent'
                  }`}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="text-sm font-medium text-white/80 mb-3 flex items-center gap-1.5">
              <Palette size={14} className="text-cyan-400" />
              Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(filter => (
                <button key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    options.filters.includes(filter)
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 border border-transparent'
                  }`}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button onClick={handleReset} disabled={!preview}
              className="btn-secondary flex items-center gap-2 flex-1">
              <RefreshCw size={14} />
              Reset
            </button>
            <button onClick={handleProcess}
              disabled={!uploadedImage || processing || uploading}
              className="btn-primary flex items-center justify-center gap-2 flex-1">
              {processing ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Processing...</>
              ) : (
                <><Zap size={15} />Process Image</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessorPage;
