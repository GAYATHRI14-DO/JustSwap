import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Item, SwapOffer } from '../types';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  DollarSign,
  Package,
  Camera
} from 'lucide-react';
import { compressImage } from '../utils/imageHelper';

interface ProposeSwapModalProps {
  targetItem: Item | null;
  myItems: Item[];
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted: (offer: SwapOffer) => void;
  onOpenCreateItem: () => void;
}

export function ProposeSwapModal({
  targetItem,
  myItems,
  isOpen,
  onClose,
  onOfferSubmitted,
  onOpenCreateItem
}: ProposeSwapModalProps) {
  const { userProfile } = useAuth();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [offerType, setOfferType] = useState<'my_items' | 'custom_item'>('my_items');
  const [customTitle, setCustomTitle] = useState('');
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState('Like New');
  const [message, setMessage] = useState('');
  const [cashAdjustment, setCashAdjustment] = useState<number | ''>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !targetItem || !userProfile) return null;

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressImage(files[i]);
      setCustomPhotos((prev) => [...prev, compressed].slice(0, 4));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let offeredItemIds: string[] = [];
    let offeredSummary = '';
    let offeredPhotos: string[] = [];

    if (offerType === 'my_items') {
      if (selectedItemIds.length === 0) {
        setError('Please select at least one of your items to offer in this swap proposal.');
        return;
      }
      offeredItemIds = selectedItemIds;
      const selectedItems = myItems.filter((item) => selectedItemIds.includes(item.id));
      offeredSummary = selectedItems.map((item) => item.title).join(' + ');
      offeredPhotos = selectedItems.map((item) => item.photos[0]).filter(Boolean);
    } else {
      if (!customTitle.trim()) {
        setError('Please enter the title/name of the item you want to offer.');
        return;
      }
      offeredSummary = `${customTitle.trim()} (${customCondition})`;
      offeredPhotos = customPhotos;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const swapData: Omit<SwapOffer, 'id'> = {
        requesterId: userProfile.id,
        requesterName: userProfile.name,
        requesterPhoto: userProfile.photoURL,
        requesterWhatsapp: userProfile.whatsappNumber,
        receiverId: targetItem.ownerId,
        receiverName: targetItem.ownerName,
        receiverPhoto: targetItem.ownerPhoto,
        receiverWhatsapp: targetItem.ownerWhatsapp,
        targetItemId: targetItem.id,
        targetItemTitle: targetItem.title,
        targetItemPhoto: targetItem.photos[0] || '',
        offeredItemIds,
        offeredItemsSummary: offeredSummary,
        offeredPhotos,
        message: message.trim() || 'Hi! I would like to swap for your item.',
        cashAdjustment: Number(cashAdjustment) || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'swapOffers'), swapData);

      // Also create/update a chat conversation
      const participantIds = [userProfile.id, targetItem.ownerId].sort();
      const chatId = `${participantIds[0]}_${participantIds[1]}`;
      const chatDocRef = doc(db, 'chats', chatId);

      const initialMessage = `[Swap Proposal Sent] Proposed swap: "${offeredSummary}" for your "${targetItem.title}". ${message.trim()}`;

      await setDoc(
        chatDocRef,
        {
          id: chatId,
          participantIds,
          participantDetails: {
            [userProfile.id]: {
              name: userProfile.name,
              photoURL: userProfile.photoURL,
              whatsappNumber: userProfile.whatsappNumber
            },
            [targetItem.ownerId]: {
              name: targetItem.ownerName,
              photoURL: targetItem.ownerPhoto,
              whatsappNumber: targetItem.ownerWhatsapp
            }
          },
          lastMessage: initialMessage,
          lastMessageTime: new Date().toISOString(),
          relatedItemId: targetItem.id,
          relatedItemTitle: targetItem.title,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Add message to subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: userProfile.id,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL,
        text: initialMessage,
        createdAt: new Date().toISOString()
      });

      onOfferSubmitted({ id: docRef.id, ...swapData });
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'swapOffers');
      setError(err.message || 'Failed to submit proposal.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="propose-swap-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="propose-swap-modal-card"
        className="w-full max-w-2xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
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
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Propose a Swap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Offer your gear in exchange for {targetItem.ownerName}'s item
            </p>
          </div>
        </div>

        {/* Target Item Preview */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <img
            src={targetItem.photos[0]}
            alt={targetItem.title}
            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Item to Receive
            </span>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
              {targetItem.title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Grade: {targetItem.condition}</span>
              {targetItem.estimatedValue && <span>• ~${targetItem.estimatedValue}</span>}
              <span>• Owner: {targetItem.ownerName}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggle Offer Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              What are you offering?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOfferType('my_items')}
                className={`p-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  offerType === 'my_items'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>My Listed Items ({myItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOfferType('custom_item')}
                className={`p-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  offerType === 'custom_item'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom / Unlisted Item</span>
              </button>
            </div>
          </div>

          {/* Option A: Select from My Listed Items */}
          {offerType === 'my_items' && (
            <div>
              {myItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-2">
                    You haven't listed any physical items on JustSwap yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateItem();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition cursor-pointer"
                  >
                    + List Your First Item Now
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {myItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer select-none transition ${
                          isSelected
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{item.condition}</span>
                            {item.estimatedValue && <span>• ~${item.estimatedValue}</span>}
                          </div>
                        </div>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Option B: Custom Unlisted Item */}
          {offerType === 'custom_item' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Offered Item Name & Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Nintendo Switch OLED + 3 Games"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Upload Photos
                  </label>
                  <label className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customPhotos.length > 0 ? `${customPhotos.length} Added` : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Cash Balance / Adjustment */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cash Balance Adjustment (Optional)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={cashAdjustment}
                onChange={(e) =>
                  setCashAdjustment(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="0 (e.g. +50 to balance value difference)"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Enter positive value if you want to add cash to your offer.
            </p>
          </div>

          {/* Message to Owner */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Message to {targetItem.ownerName}
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hey! I have my PS5 in great condition. Can meet locally or ship with tracking."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="propose-swap-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Send Proposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
