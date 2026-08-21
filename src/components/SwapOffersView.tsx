import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Item, SwapOffer } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  Scale,
  Sparkles,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Package
} from 'lucide-react';
import { formatWhatsAppUrl } from '../utils/imageHelper';

interface SwapOffersViewProps {
  offers: SwapOffer[];
  allItems: Item[];
  onOpenCompare: (offer: SwapOffer) => void;
  onOpenChatWithUser: (otherUserId: string, otherUserName: string, otherUserPhoto?: string, otherUserWhatsapp?: string, itemTitle?: string) => void;
}

export function SwapOffersView({
  offers,
  allItems,
  onOpenCompare,
  onOpenChatWithUser
}: SwapOffersViewProps) {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!userProfile) return null;

  const incomingOffers = offers.filter((o) => o.receiverId === userProfile.id);
  const outgoingOffers = offers.filter((o) => o.requesterId === userProfile.id);

  const currentOffersList = (tab === 'incoming' ? incomingOffers : outgoingOffers)
    .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleUpdateStatus = async (offer: SwapOffer, newStatus: SwapOffer['status']) => {
    try {
      setProcessingId(offer.id);
      const offerRef = doc(db, 'swapOffers', offer.id);
      await updateDoc(offerRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      if (newStatus === 'completed') {
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b']
        });
      }

      // Add a system notification message into the chat
      const participantIds = [offer.requesterId, offer.receiverId].sort();
      const chatId = `${participantIds[0]}_${participantIds[1]}`;
      const statusText =
        newStatus === 'accepted'
          ? 'Swap proposal accepted. Coordinate physical condition verification and meetup.'
          : newStatus === 'completed'
          ? 'Swap marked as completed. Both items successfully exchanged.'
          : newStatus === 'rejected'
          ? 'Swap proposal declined.'
          : 'Swap proposal cancelled.';

      try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          chatId,
          senderId: userProfile.id,
          senderName: userProfile.name,
          senderPhoto: userProfile.photoURL,
          text: statusText,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not post status update to chat:', err);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `swapOffers/${offer.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: SwapOffer['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accepted • In Progress</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <div id="swap-offers-view" className="space-y-6">
      {/* Header Tabs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setTab('incoming')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'incoming'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Received Proposals</span>
            {incomingOffers.filter((o) => o.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {incomingOffers.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('outgoing')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'outgoing'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Sent Proposals ({outgoingOffers.length})</span>
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'accepted', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      {currentOffersList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <ArrowRightLeft className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No {statusFilter !== 'all' ? statusFilter : ''} swap proposals in this view
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {tab === 'incoming'
              ? 'When other users propose swaps for your listed items, they will appear here.'
              : 'Browse items in Explore and propose your first swap!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentOffersList.map((offer) => {
            const isReceiver = offer.receiverId === userProfile.id;
            const otherUserName = isReceiver ? offer.requesterName : offer.receiverName;
            const otherUserPhoto = isReceiver ? offer.requesterPhoto : offer.receiverPhoto;
            const otherUserWhatsapp = isReceiver ? offer.requesterWhatsapp : offer.receiverWhatsapp;

            const targetItem = allItems.find((i) => i.id === offer.targetItemId);

            return (
              <div
                key={offer.id}
                id={`offer-card-${offer.id}`}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
              >
                {/* Top bar: Status & Timestamps */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(offer.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compare Condition button */}
                    <button
                      onClick={() => onOpenCompare(offer)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Compare Condition</span>
                    </button>
                  </div>
                </div>

                {/* Items Comparison Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Left: Target Item */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <img
                      src={offer.targetItemPhoto || targetItem?.photos[0] || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'}
                      alt={offer.targetItemTitle}
                      className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase">
                        {isReceiver ? 'Your Listed Item' : 'Target Item'}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {offer.targetItemTitle}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Owner: {offer.receiverName}
                      </p>
                    </div>
                  </div>

                  {/* Right: Offered Item(s) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <img
                      src={offer.offeredPhotos[0] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'}
                      alt={offer.offeredItemsSummary}
                      className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">
                        {isReceiver ? "Offered in Exchange" : 'Your Offer'}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {offer.offeredItemsSummary}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>By: {offer.requesterName}</span>
                        {offer.cashAdjustment !== undefined && offer.cashAdjustment !== 0 && (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                            {offer.cashAdjustment > 0 ? `+ $${offer.cashAdjustment}` : `- $${Math.abs(offer.cashAdjustment)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {offer.message && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {offer.requesterName}:
                    </span>{' '}
                    "{offer.message}"
                  </div>
                )}

                {/* Bottom Action Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  {/* Swapper Info & Contacts */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        otherUserPhoto ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUserName}`
                      }
                      alt={otherUserName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div className="text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {otherUserName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isReceiver ? 'Requester' : 'Item Owner'}
                      </span>
                    </div>

                    {/* In-app chat button */}
                    <button
                      onClick={() =>
                        onOpenChatWithUser(
                          isReceiver ? offer.requesterId : offer.receiverId,
                          otherUserName,
                          otherUserPhoto,
                          otherUserWhatsapp,
                          offer.targetItemTitle
                        )
                      }
                      className="ml-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Chat</span>
                    </button>

                    {/* WhatsApp direct button */}
                    {otherUserWhatsapp && (
                      <a
                        href={formatWhatsAppUrl(
                          otherUserWhatsapp,
                          `Hi ${otherUserName}! Regarding our swap on JustSwap for "${offer.targetItemTitle}"...`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Decision Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Receiver actions on pending proposal */}
                    {isReceiver && offer.status === 'pending' && (
                      <>
                        <button
                          disabled={processingId === offer.id}
                          onClick={() => handleUpdateStatus(offer, 'rejected')}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30 text-slate-700 hover:text-red-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                        >
                          Decline
                        </button>

                        <button
                          disabled={processingId === offer.id}
                          onClick={() => handleUpdateStatus(offer, 'accepted')}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Offer</span>
                        </button>
                      </>
                    )}

                    {/* Requester cancel action on pending */}
                    {!isReceiver && offer.status === 'pending' && (
                      <button
                        disabled={processingId === offer.id}
                        onClick={() => handleUpdateStatus(offer, 'cancelled')}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition cursor-pointer"
                      >
                        Cancel Proposal
                      </button>
                    )}

                    {/* Complete Swap Action (when Accepted) */}
                    {offer.status === 'accepted' && (
                      <button
                        disabled={processingId === offer.id}
                        onClick={() => handleUpdateStatus(offer, 'completed')}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Confirm Swap Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

