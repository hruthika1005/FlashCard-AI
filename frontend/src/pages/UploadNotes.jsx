import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import uploadService from '../services/uploadService';

export default function UploadNotes() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ subject: '', chapter: '', topic: '' });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selected.type)) {
      toast.error('Only PDF, JPG, PNG, or WEBP files are supported');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadService.uploadAndGenerate(file, meta, (evt) => {
        setProgress(Math.round((evt.loaded * 100) / evt.total));
      });
      toast.success(`Generated ${result.flashcards.length} flashcards!`);
      navigate('/flashcards');
    } catch (err) {
      // Error toast already shown by axios interceptor
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a PDF or image of your notes — AI will extract the text and generate flashcards automatically.
          </p>
        </div>

        <div className="glass-card p-6 animate-slide-up">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            {file ? (
              <>
                {file.type === 'application/pdf' ? (
                  <FileText size={36} className="text-primary-500" />
                ) : (
                  <ImageIcon size={36} className="text-primary-500" />
                )}
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <X size={12} /> Remove
                </button>
              </>
            ) : (
              <>
                <UploadCloud size={36} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">PDF, JPG, PNG, WEBP — up to 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              placeholder="Subject (optional)"
              value={meta.subject}
              onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Chapter (optional)"
              value={meta.chapter}
              onChange={(e) => setMeta({ ...meta, chapter: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Topic (optional)"
              value={meta.topic}
              onChange={(e) => setMeta({ ...meta, topic: e.target.value })}
              className="input-field"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Leave these blank to let AI classify your notes automatically based on content.
          </p>

          {uploading && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {progress < 100 ? `Uploading... ${progress}%` : 'Extracting text & generating flashcards with AI...'}
              </p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={uploading || !file} className="btn-primary mt-5 w-full">
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
