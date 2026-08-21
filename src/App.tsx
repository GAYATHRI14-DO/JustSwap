import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { RegistrationModal } from './components/RegistrationModal';
import { Navbar } from './components/Navbar';
import { ExploreFeed } from './components/ExploreFeed';
import { SwapOffersView } from './components/SwapOffersView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { AdminPanel } from './components/AdminPanel';
import { CreateItemModal } from './components/CreateItemModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ProposeSwapModal } from './components/ProposeSwapModal';
import { ConditionComparisonModal } from './components/ConditionComparisonModal';
import { Item, SwapOffer, AppTab } from './types';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, addDoc } from 'firebase/firestore';
import { Loader2, ArrowRightLeft, Sparkles } from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, isRegistered, authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('explore');

  // Firestore real-time state
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [swapOffers, setSwapOffers] = useState<SwapOffer[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [targetItemForSwap, setTargetItemForSwap] = useState<Item | null>(null);
  const [compareOffer, setCompareOffer] = useState<SwapOffer | null>(null);

  // Chat navigation state
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Listen to items collection
  useEffect(() => {
    if (!currentUser) return;

    const itemsQuery = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const fetchedItems: Item[] = [];
        snapshot.forEach((docSnap) => {
          fetchedItems.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setItems(fetchedItems);
        setItemsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'items');
        setItemsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to swapOffers collection
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const unsubscribe = onSnapshot(
      collection(db, 'swapOffers'),
      (snapshot) => {
        const fetchedOffers: SwapOffer[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOffers.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setSwapOffers(fetchedOffers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'swapOffers');
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // My own listed items
  const myItems = items.filter((item) => item.ownerId === userProfile?.id);

  // Pending incoming swap offers count for badge
  const pendingIncomingCount = swapOffers.filter(
    (o) => o.receiverId === userProfile?.id && o.status === 'pending'
  ).length;

  // Handler: Start chat with item owner
  const handleStartChatWithItem = async (item: Item) => {
    if (!userProfile) return;
    const participantIds = [userProfile.id, item.ownerId].sort();
    const chatId = `${participantIds[0]}_${participantIds[1]}`;

    try {
      const chatDocRef = doc(db, 'chats', chatId);
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
            [item.ownerId]: {
              name: item.ownerName,
              photoURL: item.ownerPhoto,
              whatsappNumber: item.ownerWhatsapp
            }
          },
          lastMessage: `Inquiring about item: "${item.title}"`,
          lastMessageTime: new Date().toISOString(),
          relatedItemId: item.id,
          relatedItemTitle: item.title,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        { merge: true }
      );

      setActiveChatId(chatId);
      setActiveTab('chat');
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  // Handler: Direct chat navigation from Swap Offers
  const handleOpenChatWithUser = async (
    otherUserId: string,
    otherUserName: string,
    otherUserPhoto?: string,
    otherUserWhatsapp?: string,
    itemTitle?: string
  ) => {
    if (!userProfile) return;
    const participantIds = [userProfile.id, otherUserId].sort();
    const chatId = `${participantIds[0]}_${participantIds[1]}`;

    try {
      const chatDocRef = doc(db, 'chats', chatId);
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
            [otherUserId]: {
              name: otherUserName,
              photoURL: otherUserPhoto || '',
              whatsappNumber: otherUserWhatsapp || ''
            }
          },
          updatedAt: new Date().toISOString(),
          ...(itemTitle ? { relatedItemTitle: itemTitle } : {})
        },
        { merge: true }
      );

      setActiveChatId(chatId);
      setActiveTab('chat');
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Connecting to JustSwap...</span>
        </div>
      </div>
    );
  }

  // View 1: Not Logged In -> Show Landing Page
  if (!currentUser) {
    return <LandingPage />;
  }

  // View 2: Logged In but Not Registered (needs name & WhatsApp number)
  if (!isRegistered) {
    return <RegistrationModal />;
  }

  // View 3: Logged In & Registered Swapper -> Main JustSwap App
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        pendingOffersCount={pendingIncomingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'explore' && (
          <ExploreFeed
            items={items}
            loading={itemsLoading}
            onSelectItem={(item) => setSelectedItemForDetail(item)}
            onProposeSwap={(item) => setTargetItemForSwap(item)}
            onStartChat={handleStartChatWithItem}
            onOpenCreateItem={() => setIsCreateModalOpen(true)}
          />
        )}

        {activeTab === 'offers' && (
          <SwapOffersView
            offers={swapOffers}
            allItems={items}
            onOpenCompare={(offer) => setCompareOffer(offer)}
            onOpenChatWithUser={handleOpenChatWithUser}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            selectedChatId={activeChatId}
            onSelectChat={(chatId) => setActiveChatId(chatId)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            myItems={myItems}
            onOpenCreateItem={() => setIsCreateModalOpen(true)}
            onSelectItem={(item) => setSelectedItemForDetail(item)}
          />
        )}

        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-5 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              JustSwap
            </span>
            <span>• Peer-to-peer physical swap platform</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Verify condition photos, inspect items carefully, and swap safely.
          </p>
        </div>
      </footer>

      {/* Modal: Create Item */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onItemCreated={(newItem) => {
          setSelectedItemForDetail(newItem);
        }}
      />

      {/* Modal: Item Detail & Condition Zoom */}
      <ItemDetailModal
        item={selectedItemForDetail}
        isOpen={!!selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onProposeSwap={(item) => {
          setTargetItemForSwap(item);
        }}
        onStartChat={(item) => {
          handleStartChatWithItem(item);
        }}
      />

      {/* Modal: Propose Swap */}
      <ProposeSwapModal
        targetItem={targetItemForSwap}
        myItems={myItems}
        isOpen={!!targetItemForSwap}
        onClose={() => setTargetItemForSwap(null)}
        onOfferSubmitted={() => {
          setActiveTab('offers');
        }}
        onOpenCreateItem={() => setIsCreateModalOpen(true)}
      />

      {/* Modal: Side-by-Side Condition Inspector */}
      <ConditionComparisonModal
        offer={compareOffer}
        targetItem={items.find((i) => i.id === compareOffer?.targetItemId)}
        offeredItems={items.filter((i) => compareOffer?.offeredItemIds?.includes(i.id))}
        isOpen={!!compareOffer}
        onClose={() => setCompareOffer(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
