import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import Dropdown from '../components/Dropdown';
import NutriGradeBadge from '../components/NutriGradeBadge';
import { NUTRI_GRADES } from '../tokens';
import { useState } from 'react';

const RECENT = [
  { name: 'Organic Whole Milk', brand: 'Happy Valley Farms', meta: '2 hours ago', score: 87, imageGradient: 'linear-gradient(135deg, #F4F0E8, #B8A584)' },
  { name: 'Greek Yogurt',       brand: 'Mountain Fresh',     meta: '5 hours ago', score: 92, imageGradient: 'linear-gradient(135deg, #FFFDF8, #E89E92)' },
  { name: 'Whole Grain Bread',  brand: 'Artisan Bakery',     meta: '1 day ago',   score: 75, imageGradient: 'linear-gradient(135deg, #E5D5BE, #6B4423)' },
];

const NUTRI_PRODUCTS = {
  A: [
    { name: 'Organic Quinoa',  brand: 'Ancient Grains', meta: 'Pantry',    imageGradient: 'linear-gradient(135deg, #F4D03F, #D4A82A)' },
    { name: 'Steel-Cut Oats',  brand: 'Earthlight Co.', meta: 'Pantry',    imageGradient: 'linear-gradient(135deg, #E8DCC4, #B89A6F)' },
    { name: 'Wild Blueberries',brand: 'FreshHarvest',   meta: 'Produce',   imageGradient: 'linear-gradient(135deg, #4A5C82, #2D3E5F)' },
  ],
  B: [
    { name: 'Greek Yogurt',     brand: 'Mountain Fresh', meta: 'Dairy',     imageGradient: 'linear-gradient(135deg, #FBE6E0, #E89E92)' },
    { name: 'Whole-Wheat Bread',brand: 'Artisan Bakery', meta: 'Bakery',    imageGradient: 'linear-gradient(135deg, #E5D5BE, #B5874E)' },
  ],
  C: [{ name: 'Granola Crunch', brand: 'Sunrise Foods', meta: 'Pantry',  imageGradient: 'linear-gradient(135deg, #E8945A, #C97640)' }],
  D: [{ name: 'Cheese Crackers',brand: 'SnackTime',     meta: 'Snacks',  imageGradient: 'linear-gradient(135deg, #F4C430, #D4A030)' }],
  E: [{ name: 'Cola Drink',     brand: 'FizzCo',        meta: 'Drinks',  imageGradient: 'linear-gradient(135deg, #3E2716, #1a1109)' }],
};

export default function HomeScreen({ navigate = () => {} }) {
  const [grade, setGrade] = useState('A');
  const products = NUTRI_PRODUCTS[grade] || [];

  const dropdownOptions = NUTRI_GRADES.map(g => ({
    value: g.grade,
    label: `Grade ${g.grade} · ${g.label}`,
    meta:  `${g.count} products`,
  }));

  return (
    <PhoneFrame>
      <StatusBar />

      <div className="cp-content px-5 pt-3 pb-4">
        {/* Header */}
        <header className="flex items-start justify-between mb-5">
          <div>
            <img src="/choosepure-logo.png" alt="Choosepure" className="h-8 mb-1" />
            <p className="text-base text-ink">Good morning, Sarah</p>
          </div>
          <button
            onClick={() => navigate('profile')}
            className="w-11 h-11 rounded-full overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #B85C4D 0%, #7E2A1E 100%)' }}
          >
            <span className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#E8C0A8]" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-5 rounded-t-2xl bg-[#7E2A1E]" />
          </button>
        </header>

        {/* Search */}
        <div className="cp-card flex items-center gap-2.5 px-4 py-3 mb-7">
          <Icon name="search" className="w-[18px] h-[18px] text-ink-dim" />
          <input
            type="search"
            placeholder="Search products, brands, categories..."
            className="flex-1 text-base bg-transparent placeholder:text-ink-dim"
          />
          <button onClick={() => navigate('scanner')}>
            <Icon name="scan-corners" className="w-[18px] h-[18px] text-ink" />
          </button>
        </div>

        {/* Latest Testing Reports */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Latest Testing Reports</h2>
          <button onClick={() => navigate('history')} className="text-sm font-semibold text-green-800">
            View All
          </button>
        </div>
        <div className="flex flex-col gap-2.5 mb-7">
          {RECENT.map((p, i) => (
            <ProductCard key={i} {...p} onClick={() => navigate('product-detail')} />
          ))}
        </div>

        {/* Check Nutri-score */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Check Nutri-score</h2>
          <button
            onClick={() => navigate('nutri-grade-list', { grade })}
            className="text-sm font-semibold text-green-800"
          >
            View All
          </button>
        </div>

        <div className="mb-4">
          <Dropdown
            label="Filter by grade"
            value={grade}
            onChange={setGrade}
            options={dropdownOptions}
            renderTriggerLeft={() => <NutriGradeBadge grade={grade} size={36} />}
            renderOption={opt => <NutriGradeBadge grade={opt.value} size={32} />}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          {products.map((p, i) => (
            <ProductCard key={i} {...p} grade={grade} onClick={() => navigate('product-detail')} />
          ))}
        </div>
      </div>

      <TabBar
        active="home"
        items={TAB_PRESETS.v1}
        onTab={id => {
          if (id === 'scan')    navigate('scanner');
          if (id === 'history') navigate('history');
          if (id === 'profile') navigate('profile');
        }}
      />
    </PhoneFrame>
  );
}
