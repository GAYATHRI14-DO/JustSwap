import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Item, ItemCondition } from '../types';
import {
  Search,
  SlidersHorizontal,
  Plus,
  MapPin,
  Tag,
  ArrowRightLeft,
  MessageSquare,
  ShieldCheck,
  Package,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { CATEGORIES, CONDITIONS, SAMPLE_PRESETS } from '../data/samplePresets';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ExploreFeedProps {
  items: Item[];
  loading: boolean;
  onSelectItem: (item: Item) => void;
  onProposeSwap: (item: Item) => void;
  onStartChat: (item: Item) => void;
  onOpenCreateItem: () => void;
}

export function ExploreFeed({
  items,
  loading,
  onSelectItem,
  onProposeSwap,
  onStartChat,
  onOpenCreateItem
}: ExploreFeedProps) {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'value_desc' | 'value_asc'>('newest');
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      // Must be active
      if (item.status !== 'active') return false;

      // Category filter
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }

      // Condition filter
      if (selectedCondition !== 'All' && item.condition !== selectedCondition) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesWishlist = item.swapWishlist?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        const matchesLocation = item.location?.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesWishlist || matchesCategory || matchesLocation;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'value_desc') {
        return (b.estimatedValue || 0) - (a.estimatedValue || 0);
      }
      if (sortBy === 'value_asc') {
        return (a.estimatedValue || 0) - (b.estimatedValue || 0);
      }
      return 0;
    });

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Brand New':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Like New':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Very Good':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Good':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  const handleSeedDemoItems = async () => {
    if (!userProfile) return;
    setIsSeeding(true);
    try {
      for (const preset of SAMPLE_PRESETS) {
        await addDoc(collection(db, 'items'), {
          ownerId: userProfile.id,
          ownerName: userProfile.name,
          ownerPhoto: userProfile.photoURL,
          ownerWhatsapp: userProfile.whatsappNumber,
          title: preset.title,
          description: preset.description,
          category: preset.category,
          condition: preset.condition,
          conditionNotes: preset.conditionNotes,
          verificationTags: preset.verificationTags,
          photos: preset.photos,
          estimatedValue: preset.estimatedValue,
          swapWishlist: preset.swapWishlist,
          location: preset.location,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'items');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div id="explore-feed-section" className="space-y-6">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="explore-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by title, category, console, brand, or wishlist..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Condition Dropdown */}
            <select
              id="explore-condition-filter"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Conditions</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              id="explore-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Newest Listed</option>
              <option value="value_desc">Valuation: High to Low</option>
              <option value="value_asc">Valuation: Low to High</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Available Swap Items
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {filteredItems.length}
          </span>
        </div>

        {items.length === 0 && (
          <button
            onClick={handleSeedDemoItems}
            disabled={isSeeding}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isSeeding ? 'Populating...' : 'Seed Sample Gear'}</span>
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No active swap items found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Try adjusting your search criteria or be the first swapper to list physical gear!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenCreateItem}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              List an Item
            </button>
            <button
              onClick={handleSeedDemoItems}
              disabled={isSeeding}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Seed Sample Items
            </button>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isOwner = userProfile?.id === item.ownerId;
            return (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div
                  onClick={() => onSelectItem(item)}
                  className="relative h-48 bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.photos[0] || 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />

                  {/* Condition Badge */}
                  <span
                    className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-xs shadow-2xs ${getConditionColor(
                      item.condition
                    )}`}
                  >
                    {item.condition}
                  </span>

                  {/* Photos count */}
                  {item.photos.length > 1 && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/75 backdrop-blur-xs text-white">
                      {item.photos.length} photos
                    </span>
                  )}

                  {/* Estimated Valuation */}
                  {item.estimatedValue && item.estimatedValue > 0 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-xs text-white">
                      ~${item.estimatedValue}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1">
                      <span>{item.category}</span>
                      {item.location && (
                        <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location.split(',')[0]}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onSelectItem(item)}
                      className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition cursor-pointer"
                    >
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Verification Checklist Pills */}
                    {item.verificationTags && item.verificationTags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {item.verificationTags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {tag}
                          </span>
                        ))}
                        {item.verificationTags.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            +{item.verificationTags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Swap Wishlist */}
                    {item.swapWishlist && (
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong className="font-semibold text-slate-900 dark:text-slate-100">
                          Looking for:
                        </strong>{' '}
                        <span className="line-clamp-1 text-slate-600 dark:text-slate-400">{item.swapWishlist}</span>
                      </div>
                    )}
                  </div>

                  {/* Owner info & Action buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            item.ownerPhoto ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${item.ownerId}`
                          }
                          alt={item.ownerName}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {item.ownerName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectItem(item)}
                        className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition text-center cursor-pointer"
                      >
                        Inspect
                      </button>

                      {!isOwner ? (
                        <button
                          onClick={() => onProposeSwap(item)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Swap</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
                          Your Item
                        </span>
                      )}
                    </div>
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

