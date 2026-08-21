import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';
import {
  X,
  ShieldCheck,
  Phone,
  MessageSquare,
  ArrowRightLeft,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ZoomIn,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatWhatsAppUrl } from '../utils/imageHelper';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onProposeSwap: (item: Item) => void;
  onStartChat: (item: Item) => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onProposeSwap,
  onStartChat
}: ItemDetailModalProps) {
  const { userProfile } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [zoomMode, setZoomMode] = useState(false);

  if (!isOpen || !item) return null;

  const isOwner = userProfile?.id === item.ownerId;
  const whatsappUrl = item.ownerWhatsapp
    ? formatWhatsAppUrl(
        item.ownerWhatsapp,
        `Hi ${item.ownerName}! I found your item "${item.title}" on JustSwap and would like to propose a swap.`
      )
    : '';

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Brand New':
        return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Like New':
        return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Very Good':
        return 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Good':
        return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      id="item-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="item-detail-modal-card"
        className="w-full max-w-4xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden relative max-h-[92vh] flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          id="item-detail-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition shadow-xs cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: High-Res Condition Inspection Gallery */}
        <div className="w-full md:w-1/2 bg-slate-950 relative flex flex-col items-center justify-center min-h-[300px] md:min-h-[500px]">
          <div className="relative w-full h-[280px] sm:h-[350px] md:h-full flex items-center justify-center overflow-hidden">
            <img
              src={item.photos[activePhotoIndex] || item.photos[0]}
              alt={item.title}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                zoomMode ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              onClick={() => setZoomMode(!zoomMode)}
            />

            {/* Zoom hint badge */}
            <button
              onClick={() => setZoomMode(!zoomMode)}
              className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 border border-slate-700 hover:bg-slate-800 transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
              <span>{zoomMode ? 'Reset' : 'Zoom'}</span>
            </button>

            {/* Prev / Next buttons */}
            {item.photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? item.photos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setActivePhotoIndex((prev) =>
                      prev === item.photos.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails row */}
          {item.photos.length > 1 && (
            <div className="w-full p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
              {item.photos.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-11 h-11 rounded-md overflow-hidden border-2 transition cursor-pointer ${
                    activePhotoIndex === idx
                      ? 'border-blue-500 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Item Metadata, Condition Verification & Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[500px] md:max-h-[600px]">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {item.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getConditionColor(
                  item.condition
                )}`}
              >
                {item.condition}
              </span>
              {item.estimatedValue && item.estimatedValue > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Est. ~${item.estimatedValue}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
              {item.title}
            </h2>

            {/* Location & Date */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3.5">
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {item.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Listed {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Description */}
            <div className="mb-3.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Specifications & Inclusions
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {/* Verification Checklist Badges */}
            {item.verificationTags && item.verificationTags.length > 0 && (
              <div className="mb-3.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60">
                <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified Condition Checks
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.verificationTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Flaws / Condition Disclosure */}
            {item.conditionNotes && (
              <div className="mb-3.5 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-300">
                  <strong className="font-semibold">Condition Notes:</strong> {item.conditionNotes}
                </div>
              </div>
            )}

            {/* Swap Wishlist */}
            {item.swapWishlist && (
              <div className="mb-3.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  Owner's Wishlist:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {item.swapWishlist}
                </div>
              </div>
            )}

            {/* Owner Profile Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={item.ownerPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.ownerId}`}
                  alt={item.ownerName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{item.ownerName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Member
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.location || 'Local / Shipped swaps'}
                  </p>
                </div>
              </div>

              {item.ownerWhatsapp && !isOwner && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Chat directly on WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
            {!isOwner ? (
              <>
                <button
                  id="item-detail-propose-swap-btn"
                  onClick={() => {
                    onClose();
                    onProposeSwap(item);
                  }}
                  className="flex-1 py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Propose Swap</span>
                </button>

                <button
                  id="item-detail-start-chat-btn"
                  onClick={() => {
                    onClose();
                    onStartChat(item);
                  }}
                  className="py-2 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>In-App Chat</span>
                </button>
              </>
            ) : (
              <div className="w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium text-center">
                This is your active listed item
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
