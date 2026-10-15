import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import Button from '../components/Button';
import ScoreBadge from '../components/ScoreBadge';

export default function ProductDetailScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />

      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('home')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Product Details</h1>
        <button>
          <Icon name="share" className="w-5 h-5 text-green-800" />
        </button>
      </header>

      <div className="cp-content px-5 pb-5">
        {/* Hero */}
        <div
          className="rounded-xl p-6 flex flex-col items-center mb-4"
          style={{ background: 'linear-gradient(135deg, #E8DCC4, #C9986A)' }}
        >
          <div className="w-32 h-32 rounded-lg bg-white/20 mb-3" />
          <h2 className="font-display text-2xl font-bold text-white">Organic Almond Butter</h2>
          <p className="text-base text-white/85">NaturePath Farms</p>
        </div>

        {/* Score */}
        <div className="cp-card p-5 mb-4 flex items-center gap-4">
          <ScoreBadge score={94} size={64} />
          <div className="flex-1">
            <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-1">Choosepure Score</p>
            <p className="text-base font-bold text-score-good">Excellent · Recommended</p>
          </div>
          <Icon name="shield-check" className="w-6 h-6 text-score-good" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            ['Nutri', 'A', '#1E8449'],
            ['NOVA', '1',  '#2D7A52'],
            ['Eco',  'A',  '#1E8449'],
          ].map(([k, v, bg]) => (
            <div key={k} className="cp-card p-3 text-center">
              <p className="text-2xs uppercase tracking-wider text-ink-muted mb-1.5">{k}</p>
              <div
                className="w-10 h-10 rounded-md mx-auto flex items-center justify-center font-display text-lg font-bold text-white"
                style={{ background: bg }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {[
          {
            title: 'Ingredients',
            body: 'Organic almonds (100%). No additives, preservatives, or oils.',
          },
          {
            title: 'Allergens',
            body: 'Tree nuts (almonds). Manufactured in a facility that processes peanuts.',
          },
          {
            title: 'Certifications',
            body: 'USDA Organic · Non-GMO Project Verified · ISO 17025 Lab-Tested',
          },
        ].map(s => (
          <div key={s.title} className="cp-card p-4 mb-3">
            <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-1.5">{s.title}</p>
            <p className="text-base leading-relaxed text-ink">{s.body}</p>
          </div>
        ))}

        <Button fullWidth size="lg" onClick={() => navigate('lab-report')}>
          View Full Lab Report
        </Button>
      </div>

      <TabBar active="home" items={TAB_PRESETS.v1} onTab={id => navigate(id === 'home' ? 'home' : id)} />
    </PhoneFrame>
  );
}
