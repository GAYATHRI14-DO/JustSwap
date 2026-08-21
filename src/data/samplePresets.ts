export interface SamplePreset {
  title: string;
  category: string;
  condition: 'Brand New' | 'Like New' | 'Very Good' | 'Good' | 'Fair';
  description: string;
  conditionNotes: string;
  verificationTags: string[];
  photos: string[];
  estimatedValue: number;
  swapWishlist: string;
  location: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    title: 'Sony PlayStation 5 Console (Disc Edition) + 2 DualSense Controllers',
    category: 'Gaming & Consoles',
    condition: 'Like New',
    description: 'Flawlessly maintained PS5 with original box, all power and HDMI 2.1 cables, and 2 genuine DualSense controllers with zero stick drift. Barely used due to busy work schedule.',
    conditionNotes: 'No scratches on faceplates or glossy center. Always kept in well-ventilated smoke-free room.',
    verificationTags: ['Original Box Included', 'Scratch-Free Finish', 'Tested & 100% Working', 'Original Accessories', 'Smoke-Free Home'],
    photos: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&auto=format&fit=crop&q=80'
    ],
    estimatedValue: 450,
    swapWishlist: 'Looking for a Gaming Laptop (RTX 3060+) or Canon/Sony Mirrorless Camera',
    location: 'San Francisco, CA (or Inspected Ship)'
  },
  {
    title: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium',
    category: 'Smartphones & Tablets',
    condition: 'Brand New',
    description: 'Factory sealed iPhone 15 Pro Max 256GB in Natural Titanium. Unlocked for all carriers with full 1-year Apple Warranty intact upon activation.',
    conditionNotes: 'Box seal unbroken, pristine packaging with proof of purchase.',
    verificationTags: ['Factory Sealed', 'Original Box Included', 'Proof of Purchase', 'Battery 100%', 'Carrier Unlocked'],
    photos: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&auto=format&fit=crop&q=80'
    ],
    estimatedValue: 1100,
    swapWishlist: 'Looking for M2/M3 MacBook Pro 14" or Sony A7 IV setup',
    location: 'Austin, TX'
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    category: 'Audio & Headphones',
    condition: 'Very Good',
    description: 'Top-tier active noise-canceling headphones in Silver. Comes with original hard carrying case, 3.5mm cable, and USB-C charger.',
    conditionNotes: 'Micro-wear on headband cushion, earcups pristine and clean. Battery still holds 30+ hours charge.',
    verificationTags: ['Tested & 100% Working', 'Original Hard Case', 'Clean & Sanitized', 'Battery Healthy'],
    photos: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900&auto=format&fit=crop&q=80'
    ],
    estimatedValue: 280,
    swapWishlist: 'Looking for Apple AirPods Max, mechanical keyboard build, or iPad Mini',
    location: 'Seattle, WA'
  },
  {
    title: 'Fujifilm X-T30 II Mirrorless Camera + XF 18-55mm f/2.8-4 Lens',
    category: 'Cameras & Optics',
    condition: 'Like New',
    description: 'Compact mirrorless camera with famous Fuji film simulations. Includes kit lens, UV filter, 2 extra batteries, dual charger, and 64GB SanDisk Extreme SD card.',
    conditionNotes: 'Sensor clean, shutter count under 2,100 clicks. LCD has glass screen protector since day 1.',
    verificationTags: ['Scratch-Free Finish', 'Clean Lens Glass', 'Extra Batteries Included', 'Tested & 100% Working', 'Screen Protector Applied'],
    photos: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=900&auto=format&fit=crop&q=80'
    ],
    estimatedValue: 850,
    swapWishlist: 'Looking for DJI Mini 4 Pro Drone Fly More Combo or Sony G-Master lens',
    location: 'New York, NY'
  },
  {
    title: 'Nike Air Jordan 1 Retro High OG "Chicago" (Size 10.5 US)',
    category: 'Fashion & Sneakers',
    condition: 'Brand New',
    description: 'Deadstock Air Jordan 1 High Chicago colorway, never worn or tried on. With original box, extra white/black laces, and store verification tag.',
    conditionNotes: 'Kept in plastic shrink wrap with silica gel packets in temperature-controlled room.',
    verificationTags: ['Factory Sealed', 'Original Box Included', 'Authenticity Verified', 'Never Worn / Deadstock'],
    photos: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=900&auto=format&fit=crop&q=80'
    ],
    estimatedValue: 420,
    swapWishlist: 'Looking for Travis Scott Jordan 1 Low or Steam Deck OLED 512GB',
    location: 'Chicago, IL'
  }
];

export const CATEGORIES = [
  'All Categories',
  'Gaming & Consoles',
  'Smartphones & Tablets',
  'Laptops & Computers',
  'Audio & Headphones',
  'Cameras & Optics',
  'Fashion & Sneakers',
  'Watches & Jewelry',
  'Collectibles & Cards',
  'Musical Instruments',
  'Sports & Outdoors',
  'Home & Smart Tech'
];

export const CONDITIONS: { value: SamplePreset['condition']; label: string; desc: string; color: string }[] = [
  { value: 'Brand New', label: 'Brand New (Sealed)', desc: 'Never opened, factory packaging intact', color: 'emerald' },
  { value: 'Like New', label: 'Like New (Flawless)', desc: 'Opened but flawless, zero scratches/defects', color: 'cyan' },
  { value: 'Very Good', label: 'Very Good (Minor Wear)', desc: 'Fully functional, very light cosmetic signs', color: 'blue' },
  { value: 'Good', label: 'Good (Normal Wear)', desc: 'Tested working, normal signs of previous use', color: 'amber' },
  { value: 'Fair', label: 'Fair (Visible Wear)', desc: 'Functional with noticeable cosmetic flaws/wear', color: 'purple' }
];

export const VERIFICATION_CHECKLIST_OPTIONS = [
  'Original Box & Packaging Included',
  'Original Charging Cable / Power Adapter',
  'Proof of Purchase / Invoice Available',
  'Scratch-Free Display / Lens Surface',
  'Hardware Buttons & Ports 100% Functional',
  'Battery Tested & In Good Health',
  'Cleaned & Sanitized',
  'Carrier / Account Unlocked (iCloud/Google removed)'
];
