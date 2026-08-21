export type AppTab = 'explore' | 'my_items' | 'offers' | 'chat' | 'admin' | 'profile';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  whatsappNumber: string;
  photoURL?: string;
  isRegistered: boolean;
  isAdmin: boolean;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCondition = 'Brand New' | 'Like New' | 'Very Good' | 'Good' | 'Fair';

export type ItemStatus = 'active' | 'pending_swap' | 'swapped' | 'archived';

export interface Item {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto?: string;
  ownerWhatsapp?: string;
  title: string;
  description: string;
  category: string;
  condition: ItemCondition;
  conditionNotes?: string;
  verificationTags: string[];
  photos: string[];
  estimatedValue?: number;
  swapWishlist?: string;
  location?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export type SwapOfferStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface SwapOffer {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhoto?: string;
  requesterWhatsapp?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  receiverWhatsapp?: string;
  targetItemId: string;
  targetItemTitle: string;
  targetItemPhoto?: string;
  offeredItemIds: string[];
  offeredItemsSummary: string;
  offeredPhotos: string[];
  message?: string;
  cashAdjustment?: number; // positive = requester adds cash, negative = requester asks cash
  status: SwapOfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  name: string;
  photoURL?: string;
  whatsappNumber?: string;
}

export interface Chat {
  id: string;
  participantIds: string[];
  participantDetails: Record<string, ChatParticipant>;
  lastMessage?: string;
  lastMessageTime?: string;
  relatedItemId?: string;
  relatedItemTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'item' | 'user' | 'offer';
  targetId: string;
  reason: string;
  description?: string;
  status: 'open' | 'reviewed' | 'dismissed';
  createdAt: string;
}
