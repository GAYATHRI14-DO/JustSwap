import React, { useState } from 'react';
import { Item, SwapOffer } from '../types';
import {
  X,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  ZoomIn,
  DollarSign,
  Scale
} from 'lucide-react';

interface ConditionComparisonModalProps {
  offer: SwapOffer | null;
  targetItem?: Item | null;
  offeredItems?: Item[];
  isOpen: boolean;
  onClose: () => void;
}

export function ConditionComparisonModal({
  offer,
  targetItem,
  offeredItems = [],
  isOpen,
  onClose
}: ConditionComparisonModalProps) {
  const [zoomLeft, setZoomLeft] = useState(false);
  const [zoomRight, setZoomRight] = useState(false);

  if (!isOpen || !offer) return null;

  const leftItem = targetItem;
  const rightItem = offeredItems[0]; // Primary offered item if available

  return (
    <div
      id="condition-comparison-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="condition-comparison-modal-card"
        className="w-full max-w-5xl my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto"
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
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Condition Verification
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Side-by-Side
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect physical condition, checklists, and photo details before confirming the swap
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
          {/* Middle Divider Icon */}
          <div className="hidden md:flex absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-xs z-10">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>

          {/* Left: Target Item (Item A) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Target Item (To Receive)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Owner: {offer.receiverName}
                </span>
              </div>

              {/* Photo */}
              <div className="relative h-56 rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-200 dark:border-slate-700">
                <img
                  src={offer.targetItemPhoto || leftItem?.photos[0]}
                  alt={offer.targetItemTitle}
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    zoomLeft ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                  }`}
                  onClick={() => setZoomLeft(!zoomLeft)}
                />
                <button
                  onClick={() => setZoomLeft(!zoomLeft)}
                  className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zoom</span>
                </button>
              </div>

              {/* Title & Valuation */}
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {offer.targetItemTitle}
              </h3>
              {leftItem && (
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Grade: {leftItem.condition}
                  </span>
                  {leftItem.estimatedValue && <span>• ~${leftItem.estimatedValue}</span>}
                </div>
              )}

              {/* Checklist */}
              {leftItem?.verificationTags && leftItem.verificationTags.length > 0 && (
                <div className="space-y-1 mb-2.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Verified Checklist
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {leftItem.verificationTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Flaw Notes */}
              {leftItem?.conditionNotes && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  <strong>Notes:</strong> {leftItem.conditionNotes}
                </div>
              )}
            </div>
          </div>

          {/* Right: Offered Item(s) (Item B) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Offered In Exchange
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Requester: {offer.requesterName}
                </span>
              </div>

              {/* Photo */}
              <div className="relative h-56 rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-200 dark:border-slate-700">
                <img
                  src={offer.offeredPhotos[0] || rightItem?.photos[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'}
                  alt={offer.offeredItemsSummary}
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    zoomRight ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                  }`}
                  onClick={() => setZoomRight(!zoomRight)}
                />
                <button
                  onClick={() => setZoomRight(!zoomRight)}
                  className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zoom</span>
                </button>
              </div>

              {/* Title & Valuation */}
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {offer.offeredItemsSummary}
              </h3>
              {rightItem && (
                <div className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-2">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Grade: {rightItem.condition}
                  </span>
                  {rightItem.estimatedValue && <span>• ~${rightItem.estimatedValue}</span>}
                </div>
              )}

              {/* Cash Adjustment notice */}
              {offer.cashAdjustment !== undefined && offer.cashAdjustment !== 0 && (
                <div className="mb-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>
                    {offer.cashAdjustment > 0
                      ? `+ $${offer.cashAdjustment} Cash offered by requester`
                      : `$${Math.abs(offer.cashAdjustment)} Cash requested from receiver`}
                  </span>
                </div>
              )}

              {/* Checklist */}
              {rightItem?.verificationTags && rightItem.verificationTags.length > 0 && (
                <div className="space-y-1 mb-2.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Verified Checklist
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {rightItem.verificationTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message from requester */}
              {offer.message && (
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
                  "{offer.message}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Always test hardware and check serial numbers during physical exchange.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
