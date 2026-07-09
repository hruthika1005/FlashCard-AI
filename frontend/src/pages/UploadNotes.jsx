import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2, Sparkles, Camera as CameraIcon, Save } from 'lucide-react';
import Layout from '../components/Layout';
import uploadService from '../services/uploadService';
import { isNativePlatform, capturePhotoNative } from '../services/cameraService';

export default function UploadNotes() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ subject: '', chapter: '', topic: '' });
  const [uploading, setUploading] = useState(false);
  // Tracks which action is currently running so each button can show its own loading state
  const [activeAction, setActiveAction] = useState(null); // 'save' | 'generate' | null
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

  // Opens the native camera on Android (via Capacitor), or falls back to the
  // browser's camera capture input on the web. The captured photo is fed
  // through the exact same handleFileSelect() path as a regular upload.
  const handleTakePhoto = async () => {
    if (isNativePlatform()) {
      try {
        const capturedFile = await capturePhotoNative();
        handleFileSelect(capturedFile);
      } catch (err) {
        const message = err?.message || '';
        if (!message.toLowerCase().includes('cancel')) {
          toast.error('Unable to access the camera');
        }
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const runUpload = async (action) => {
    if (!file) {
      toast.error('Please select a file or take a photo first');
      return;
    }
    setUploading(true);
    setActiveAction(action);
    setProgress(0);
    try {
      const onUploadProgress = (evt) => setProgress(Math.round((evt.loaded * 100) / evt.total));

      if (action === 'save') {
        await uploadService.saveNote(file, meta, onUploadProgress);
        toast.success('Note saved successfully');
        navigate('/notes');
      } else {
        const result = await uploadService.uploadAndGenerate(file, meta, onUploadProgress);
        toast.success(`Generated ${result.flashcards.length} flashcards!`);
        navigate('/flashcards');
      }
    } catch (err) {
      // Error toast already shown by axios interceptor
    } finally {
      setUploading(false);
      setActiveAction(null);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Upload Notes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a PDF or image, or take a photo of your notes. Save it for later, or generate flashcards right
            away with AI.
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
            {/* Web camera-capture fallback: on mobile browsers this opens the device camera;
                on desktop browsers it falls back to a normal file picker. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTakePhoto();
            }}
            className="btn-secondary mt-3 w-full"
          >
            <CameraIcon size={18} /> Take Photo
          </button>

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
                {progress < 100
                  ? `Uploading... ${progress}%`
                  : activeAction === 'save'
                  ? 'Saving note...'
                  : 'Extracting text & generating flashcards with AI...'}
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => runUpload('save')}
              disabled={uploading || !file}
              className="btn-secondary w-full"
            >
              {uploading && activeAction === 'save' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Notes
                </>
              )}
            </button>
            <button
              onClick={() => runUpload('generate')}
              disabled={uploading || !file}
              className="btn-primary w-full"
            >
              {uploading && activeAction === 'generate' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Save & Generate Flashcards
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            "Save Notes" stores your file without generating flashcards — you can generate them later from the Notes
            page.
          </p>
        </div>
      </div>
    </Layout>
  );
}
