import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Item, SwapOffer } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ShieldAlert,
  Users,
  Package,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Trash2,
  Lock,
  Shield
} from 'lucide-react';
import { formatWhatsAppUrl } from '../utils/imageHelper';

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'items' | 'swaps'>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [swapsList, setSwapsList] = useState<SwapOffer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Listen to all users
  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const users: UserProfile[] = [];
        snap.forEach((d) => users.push({ id: d.id, ...(d.data() as any) }));
        setUsersList(users);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    );

    const unsubItems = onSnapshot(
      collection(db, 'items'),
      (snap) => {
        const items: Item[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
        setItemsList(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'items');
      }
    );

    const unsubSwaps = onSnapshot(
      collection(db, 'swapOffers'),
      (snap) => {
        const swaps: SwapOffer[] = [];
        snap.forEach((d) => swaps.push({ id: d.id, ...(d.data() as any) }));
        setSwapsList(swaps);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'swapOffers');
      }
    );

    return () => {
      unsubUsers();
      unsubItems();
      unsubSwaps();
    };
  }, [isAdmin]);

  // Security barrier
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
          This section requires administrator privileges (<code className="text-red-600 dark:text-red-400 font-mono">isAdmin: true</code>).
        </p>
      </div>
    );
  }

  // Toggle Admin status for a user
  const handleToggleAdminRole = async (targetUser: UserProfile) => {
    try {
      setProcessingId(targetUser.id);
      const newAdminState = !targetUser.isAdmin;
      await updateDoc(doc(db, 'users', targetUser.id), {
        isAdmin: newAdminState,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUser.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Toggle Registration status manually
  const handleToggleRegistrationStatus = async (targetUser: UserProfile) => {
    try {
      setProcessingId(targetUser.id);
      const newRegState = !targetUser.isRegistered;
      await updateDoc(doc(db, 'users', targetUser.id), {
        isRegistered: newRegState,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUser.id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Delete an item from the platform
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'items', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `items/${itemId}`);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.whatsappNumber?.includes(q)
    );
  });

  const filteredItems = itemsList.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title?.toLowerCase().includes(q) ||
      i.ownerName?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-panel-root" className="space-y-6">
      {/* Admin Dashboard Header */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Admin Management
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage registered users, listed inventory, and platform swap records
            </p>
          </div>
        </div>

        {/* Global Key Stats */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[85px]">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Users</span>
            <span className="text-base font-bold text-white">{usersList.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[85px]">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Items</span>
            <span className="text-base font-bold text-white">{itemsList.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[85px]">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Offers</span>
            <span className="text-base font-bold text-white">{swapsList.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'items'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Items ({itemsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'swaps'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swaps ({swapsList.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">WhatsApp Contact</th>
                  <th className="p-3.5">Registration</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={
                            u.photoURL ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`
                          }
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {u.name || 'Unnamed User'}
                          </span>
                          <span className="text-slate-400 text-[11px]">{u.email}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {u.whatsappNumber ? (
                          <a
                            href={formatWhatsAppUrl(u.whatsappNumber, `Hi ${u.name}!`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{u.whatsappNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {u.isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <XCircle className="w-3 h-3" />
                            Incomplete
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Member</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        {/* Toggle Admin role */}
                        <button
                          disabled={processingId === u.id}
                          onClick={() => handleToggleAdminRole(u)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition cursor-pointer ${
                            u.isAdmin
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                        </button>

                        {/* Toggle Registration */}
                        <button
                          disabled={processingId === u.id}
                          onClick={() => handleToggleRegistrationStatus(u)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          {u.isRegistered ? 'Mark Incomplete' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Table */}
      {activeTab === 'items' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex gap-3">
                <img
                  src={item.photos[0]}
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase block">
                    {item.category} • {item.condition}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Owner: {item.ownerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  ~${item.estimatedValue || 0}
                </span>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="px-2.5 py-1 rounded-md text-red-600 dark:text-red-400 text-[10px] font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Listing</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Swaps Table */}
      {activeTab === 'swaps' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Target Item</th>
                  <th className="p-3.5">Offered Item(s)</th>
                  <th className="p-3.5">Participants</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {swapsList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {s.targetItemTitle}
                    </td>
                    <td className="p-3.5 font-medium text-blue-600 dark:text-blue-400">
                      {s.offeredItemsSummary}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {s.requesterName} → {s.receiverName}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

