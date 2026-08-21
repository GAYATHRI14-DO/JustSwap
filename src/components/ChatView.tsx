import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat, ChatMessage } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import {
  Send,
  Camera,
  MessageSquare,
  Phone,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { formatWhatsAppUrl, compressImage } from '../utils/imageHelper';

interface ChatViewProps {
  selectedChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
}

export function ChatView({ selectedChatId, onSelectChat }: ChatViewProps) {
  const { userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(selectedChatId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selectedChatId prop
  useEffect(() => {
    if (selectedChatId) {
      setActiveChatId(selectedChatId);
    }
  }, [selectedChatId]);

  // Listen to all chats where current user is a participant
  useEffect(() => {
    if (!userProfile) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userProfile.id)
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const fetchedChats: Chat[] = [];
        snapshot.forEach((docSnap) => {
          fetchedChats.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        // Sort chats by lastMessageTime descending
        fetchedChats.sort((a, b) => {
          const tA = new Date(a.lastMessageTime || a.updatedAt || 0).getTime();
          const tB = new Date(b.lastMessageTime || b.updatedAt || 0).getTime();
          return tB - tA;
        });

        setChats(fetchedChats);

        // Auto select first chat if none selected
        if (!activeChatId && fetchedChats.length > 0) {
          setActiveChatId(fetchedChats[0].id);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats');
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Listen to messages of active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          fetchedMessages.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setMessages(fetchedMessages);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `chats/${activeChatId}/messages`);
      }
    );

    return () => unsubscribe();
  }, [activeChatId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userProfile || !activeChatId) return;
    if (!inputText.trim() && !attachedPhoto) return;

    const messageText = inputText.trim();
    const photoUrl = attachedPhoto;

    setInputText('');
    setAttachedPhoto(null);
    setIsSending(true);

    try {
      // 1. Add message document
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        chatId: activeChatId,
        senderId: userProfile.id,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL,
        text: messageText,
        photoUrl: photoUrl || '',
        createdAt: new Date().toISOString()
      });

      // 2. Update chat metadata
      const chatDocRef = doc(db, 'chats', activeChatId);
      await updateDoc(chatDocRef, {
        lastMessage: messageText || (photoUrl ? 'Photo attachment' : ''),
        lastMessageTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${activeChatId}`);
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImage(file);
      setAttachedPhoto(compressed);
    } catch (err) {
      console.error('Photo compression error:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Get other participant details
  const otherParticipantId = activeChat?.participantIds.find((id) => id !== userProfile?.id);
  const otherParticipant = otherParticipantId
    ? activeChat?.participantDetails?.[otherParticipantId]
    : null;

  return (
    <div
      id="chat-view-container"
      className="h-[calc(100vh-140px)] min-h-[500px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col md:flex-row"
    >
      {/* Left Sidebar: Conversations List */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/30">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Conversations</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {chats.length}
          </span>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-medium text-slate-600 dark:text-slate-400">No active chats yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Propose a swap or message a user to start a conversation.
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const partnerId = chat.participantIds.find((id) => id !== userProfile?.id) || '';
              const partner = chat.participantDetails?.[partnerId];
              const isSelected = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (onSelectChat) onSelectChat(chat.id);
                  }}
                  className={`w-full p-3.5 text-left transition flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-2 border-blue-600'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <img
                    src={
                      partner?.photoURL ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerId}`
                    }
                    alt={partner?.name || 'Swapper'}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {partner?.name || 'Swapper'}
                      </span>
                      {chat.lastMessageTime && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    {chat.relatedItemTitle && (
                      <span className="inline-block text-[10px] font-medium text-blue-600 dark:text-blue-400 truncate max-w-full">
                        {chat.relatedItemTitle}
                      </span>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {chat.lastMessage || 'Start conversation...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Conversation & Messaging Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {activeChat && otherParticipant ? (
          <>
            {/* Active Conversation Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <img
                  src={
                    otherParticipant.photoURL ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${otherParticipant.name}`
                  }
                  alt={otherParticipant.name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{otherParticipant.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Swapper
                    </span>
                  </h4>
                  {activeChat.relatedItemTitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Item: <span className="font-medium text-slate-700 dark:text-slate-300">{activeChat.relatedItemTitle}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Header actions: WhatsApp button */}
              {otherParticipant.whatsappNumber && (
                <a
                  href={formatWhatsAppUrl(
                    otherParticipant.whatsappNumber,
                    `Hi ${otherParticipant.name}! Chatting with you from JustSwap regarding our items.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-slate-50/30 dark:bg-slate-950/40">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Real-Time Chat
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Say hello, share verification photos, or coordinate meetup details.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userProfile?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Left: Other User Avatar */}
                      {!isMe && (
                        <img
                          src={
                            msg.senderPhoto ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}`
                          }
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 mb-1"
                        />
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-3 text-xs shadow-2xs transition ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Sender name for group/other user */}
                        {!isMe && (
                          <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            {msg.senderName}
                          </span>
                        )}

                        {/* Optional photo attached */}
                        {msg.photoUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden bg-black/10">
                            <img
                              src={msg.photoUrl}
                              alt="Attached item verification"
                              className="w-full max-h-60 object-contain"
                            />
                          </div>
                        )}

                        {/* Message text */}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {/* Timestamp */}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                            isMe ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Photo Attachment Toolbar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Photo Preview if attached */}
              {attachedPhoto && (
                <div className="mb-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-between max-w-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={attachedPhoto}
                      alt="Preview"
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Photo attached
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedPhoto(null)}
                    className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Photo upload trigger */}
                <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Text input */}
                <input
                  id="chat-message-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />

                {/* Send button */}
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={isSending || isCompressingPhoto || (!inputText.trim() && !attachedPhoto)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3 border border-slate-200 dark:border-slate-700">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Select a Conversation
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Choose a conversation from the left or propose a swap on an item in Explore.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

