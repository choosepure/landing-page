import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Pantry', 'Dairy', 'Produce', 'Bakery', 'Beverages', 'Snacks'];

const ITEMS = [
  { name: 'Organic Whole Milk', brand: 'Happy Valley',   meta: 'Dairy',   score: 87, imageGradient: 'linear-gradient(135deg, #F4F0E8, #B8A584)' },
  { name: 'Greek Yogurt',       brand: 'Mountain Fresh', meta: 'Dairy',   score: 92, imageGradient: 'linear-gradient(135deg, #FFFDF8, #E89E92)' },
  { name: 'Whole Grain Bread',  brand: 'Artisan Bakery', meta: 'Bakery',  score: 75, imageGradient: 'linear-gradient(135deg, #E5D5BE, #6B4423)' },
  { name: 'Wild Blueberries',   brand: 'FreshHarvest',   meta: 'Produce', score: 96, imageGradient: 'linear-gradient(135deg, #4A5C82, #2D3E5F)' },
];

export default function DiscoverScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('home')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Discover</h1>
        <button>
          <Icon name="sliders" className="w-5 h-5 text-green-800" />
        </button>
      </header>

      <div className="cp-content px-5 pb-5">
        <div className="cp-card flex items-center gap-2.5 px-3.5 py-2.5 mb-3">
          <Icon name="search" className="w-[18px] h-[18px] text-ink-dim" />
          <input
            placeholder="Search by product or brand"
            className="flex-1 text-base bg-transparent placeholder:text-ink-dim"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mb-4 pb-1">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
                i === 0 ? 'bg-green-800 text-white' : 'bg-white text-ink-muted border border-line'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-2">Top scoring this week</h2>
        <div className="flex flex-col gap-2.5">
          {ITEMS.map((p, i) => (
            <ProductCard key={i} {...p} onClick={() => navigate('product-detail')} />
          ))}
        </div>
      </div>

      <TabBar active="home" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
