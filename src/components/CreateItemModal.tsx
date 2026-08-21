import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Package,
  Wand2
} from 'lucide-react';
import { CATEGORIES, CONDITIONS, VERIFICATION_CHECKLIST_OPTIONS, SAMPLE_PRESETS } from '../data/samplePresets';
import { compressImage } from '../utils/imageHelper';
import { Item, ItemCondition } from '../types';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated?: (item: Item) => void;
}

export function CreateItemModal({ isOpen, onClose, onItemCreated }: CreateItemModalProps) {
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]); // Default to first actual category
  const [condition, setCondition] = useState<ItemCondition>('Like New');
  const [description, setDescription] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [verificationTags, setVerificationTags] = useState<string[]>([
    VERIFICATION_CHECKLIST_OPTIONS[0],
    VERIFICATION_CHECKLIST_OPTIONS[3],
    VERIFICATION_CHECKLIST_OPTIONS[4]
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>(250);
  const [swapWishlist, setSwapWishlist] = useState('');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newPhotos.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6));
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Could not process image file. Try another photo or URL.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAddCustomPhotoUrl = () => {
    if (!customPhotoUrl.trim()) return;
    setPhotos((prev) => [...prev, customPhotoUrl.trim()].slice(0, 6));
    setCustomPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleVerificationTag = (tag: string) => {
    setVerificationTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLoadPreset = (presetIndex: number) => {
    const preset = SAMPLE_PRESETS[presetIndex];
    if (!preset) return;
    setTitle(preset.title);
    setCategory(preset.category);
    setCondition(preset.condition);
    setDescription(preset.description);
    setConditionNotes(preset.conditionNotes);
    setVerificationTags(preset.verificationTags);
    setPhotos(preset.photos);
    setEstimatedValue(preset.estimatedValue);
    setSwapWishlist(preset.swapWishlist);
    setLocation(preset.location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!title.trim()) {
      setError('Please provide an item title');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description of the physical item');
      return;
    }
    if (photos.length === 0) {
      setError('Please upload at least 1 photo for condition verification');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const newItemData: Omit<Item, 'id'> = {
        ownerId: userProfile.id,
        ownerName: userProfile.name,
        ownerPhoto: userProfile.photoURL,
        ownerWhatsapp: userProfile.whatsappNumber,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        conditionNotes: conditionNotes.trim(),
        verificationTags,
        photos,
        estimatedValue: Number(estimatedValue) || 0,
        swapWishlist: swapWishlist.trim(),
        location: location.trim() || userProfile.location || 'Local Meetup / Shipped',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'items'), newItemData);
      if (onItemCreated) {
        onItemCreated({ id: docRef.id, ...newItemData });
      }
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'items');
      setError(err.message || 'Failed to list item. Please check inputs.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="create-item-modal-card"
        className="w-full max-w-3xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              List Item for Swap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide condition photos and details so other members can verify authenticity
            </p>
          </div>
        </div>

        {/* Quick Demo Template Presets */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Wand2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Quick fill demo items:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadPreset(idx)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                + {p.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Item Title & Model <span className="text-red-500">*</span>
              </label>
              <input
                id="create-item-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sony PlayStation 5 Disc Edition + 2 Controllers"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="create-item-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Condition Grade <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    condition === c.value
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-xs font-semibold">
                    {c.value}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {c.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload & Gallery */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Verification Photos <span className="text-red-500">* (1-6 photos)</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {photos.length}/6 photos added
              </span>
            </div>

            {/* Photo Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2.5">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
                >
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-900/80 text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {photos.length < 6 && (
                <label className="aspect-square rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex flex-col items-center justify-center cursor-pointer transition p-2 text-center">
                  <Camera className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    {isCompressing ? 'Processing...' : 'Upload'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Direct Image URL input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="Or paste an image web URL"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddCustomPhotoUrl}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Verification Checklist */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Verification Checklist & Inclusions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VERIFICATION_CHECKLIST_OPTIONS.map((tag) => {
                const isChecked = verificationTags.includes(tag);
                return (
                  <label
                    key={tag}
                    onClick={() => toggleVerificationTag(tag)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span>{tag}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description & Specifications <span className="text-red-500">*</span>
            </label>
            <textarea
              id="create-item-description-input"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe model version, condition details, accessories included, reason for swapping..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs sm:text-sm"
            />
          </div>

          {/* Condition Notes / Flaws Disclosure */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span>Flaw Disclosure</span>
              <span className="text-slate-400 font-normal">(Scratches, blemishes, or wear)</span>
            </label>
            <input
              type="text"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="e.g. Minor hairline mark on back edge; screen is pristine."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs sm:text-sm"
            />
          </div>

          {/* Swap Wishlist & Valuation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Estimated Value ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={estimatedValue}
                  onChange={(e) =>
                    setEstimatedValue(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="250"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Looking to swap for (Wishlist)
              </label>
              <input
                type="text"
                value={swapWishlist}
                onChange={(e) => setSwapWishlist(e.target.value)}
                placeholder="e.g. Mirrorless camera lens, tablet, or mechanical keyboard"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Swap Location / Preference
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA (Local or tracked shipping)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="create-item-submit-btn"
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

