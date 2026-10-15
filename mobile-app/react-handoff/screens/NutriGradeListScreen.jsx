import React, { useState, useMemo } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import ProductCard from '../components/ProductCard';
import { NUTRI_GRADES } from '../tokens';

const ALL_PRODUCTS = {
  A: [
    { name: 'Organic Quinoa',       brand: 'Ancient Grains', category: 'Pantry',     imageGradient: 'linear-gradient(135deg, #F4D03F, #D4A82A)' },
    { name: 'Steel-Cut Oats',       brand: 'Earthlight Co.', category: 'Pantry',     imageGradient: 'linear-gradient(135deg, #E8DCC4, #B89A6F)' },
    { name: 'Wild Blueberries',     brand: 'FreshHarvest',   category: 'Produce',    imageGradient: 'linear-gradient(135deg, #4A5C82, #2D3E5F)' },
    { name: 'Spinach Bunch',        brand: 'GreenLeaf',      category: 'Produce',    imageGradient: 'linear-gradient(135deg, #5B8B3A, #3D6A1F)' },
    { name: 'Plain Lentils',        brand: 'Heritage',       category: 'Pantry',     imageGradient: 'linear-gradient(135deg, #B5874E, #6B4423)' },
  ],
  B: [
    { name: 'Greek Yogurt',         brand: 'Mountain Fresh', category: 'Dairy',      imageGradient: 'linear-gradient(135deg, #FBE6E0, #E89E92)' },
    { name: 'Whole-Wheat Bread',    brand: 'Artisan Bakery', category: 'Bakery',     imageGradient: 'linear-gradient(135deg, #E5D5BE, #B5874E)' },
    { name: 'Almond Milk',          brand: 'PureLife',       category: 'Beverages',  imageGradient: 'linear-gradient(135deg, #F4F0E8, #D9CDB8)' },
  ],
  C: [
    { name: 'Granola Crunch',       brand: 'Sunrise Foods',  category: 'Pantry',     imageGradient: 'linear-gradient(135deg, #E8945A, #C97640)' },
    { name: 'Fruit Yogurt',         brand: 'DairyDay',       category: 'Dairy',      imageGradient: 'linear-gradient(135deg, #FBE6E0, #F4C7BE)' },
  ],
  D: [
    { name: 'Cheese Crackers',      brand: 'SnackTime',      category: 'Snacks',     imageGradient: 'linear-gradient(135deg, #F4C430, #D4A030)' },
    { name: 'Flavored Milk',        brand: 'KidCo',          category: 'Beverages',  imageGradient: 'linear-gradient(135deg, #E89B3C, #B5723C)' },
  ],
  E: [
    { name: 'Chocolate Spread',     brand: 'SweetJar',       category: 'Pantry',     imageGradient: 'linear-gradient(135deg, #6B4423, #3E2716)' },
    { name: 'Cola Drink',           brand: 'FizzCo',         category: 'Beverages',  imageGradient: 'linear-gradient(135deg, #3E2716, #1a1109)' },
  ],
};

export default function NutriGradeListScreen({ navigate = () => {}, params = {} }) {
  const [grade, setGrade] = useState(params.grade ?? 'A');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const list = ALL_PRODUCTS[grade] || [];
  const categories = useMemo(() => ['All', ...new Set(list.map(p => p.category))], [list]);

  const filtered = useMemo(
    () =>
      list.filter(p => {
        const matchesQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase());
        const matchesC = category === 'All' || p.category === category;
        return matchesQ && matchesC;
      }),
    [list, query, category],
  );

  return (
    <PhoneFrame>
      <StatusBar />

      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('home')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Nutri-Score</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-5">
        {/* Grade pills */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {NUTRI_GRADES.map(g => {
            const sel = g.grade === grade;
            return (
              <button
                key={g.grade}
                onClick={() => setGrade(g.grade)}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 border transition ${
                  sel ? 'bg-white border-green-700 shadow-elev' : 'bg-white/60 border-line opacity-70'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center font-display text-lg font-bold"
                  style={{ background: g.bg, color: g.text }}
                >
                  {g.grade}
                </div>
                <span className="text-2xs font-bold">{g.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="cp-card flex items-center gap-2.5 px-3.5 py-2.5 mb-3">
          <Icon name="search" className="w-[18px] h-[18px] text-ink-dim" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by product or brand"
            className="flex-1 text-base bg-transparent placeholder:text-ink-dim"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <Icon name="close" className="w-4 h-4 text-ink-muted" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mb-4 pb-1">
          {categories.map(c => {
            const sel = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                  sel ? 'bg-green-800 text-white' : 'bg-white text-ink-muted border border-line'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-ink-muted mb-2.5">
          {filtered.length} of {list.length} products in Grade {grade}
        </p>

        <div className="flex flex-col gap-2.5">
          {filtered.map((p, i) => (
            <ProductCard key={i} {...p} grade={grade} meta={p.category} onClick={() => navigate('product-detail')} />
          ))}
          {filtered.length === 0 && (
            <div className="cp-card p-8 text-center">
              <p className="text-base font-bold mb-1">No matches</p>
              <p className="text-sm text-ink-muted">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>

      <TabBar active="home" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
