import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import Button from '../components/Button';

const PLANS = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$9.99',
    period: '/month',
    blurb: 'Cancel anytime',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$79.99',
    period: '/year',
    blurb: 'Save 33% · 2 months free',
    featured: true,
  },
  {
    id: 'family',
    title: 'Family',
    price: '$129.99',
    period: '/year',
    blurb: 'Up to 6 members',
  },
];

const PERKS = [
  'Unlimited scans & lookups',
  'Full lab-grade reports for every product',
  'Personalized recommendations',
  'Early access to new tests & categories',
  'Premium customer support',
];

export default function PlansScreen({ navigate = () => {} }) {
  const [picked, setPicked] = React.useState('yearly');

  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('profile')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Choose Your Plan</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-5">
        <div className="cp-card p-5 text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
            <Icon name="star" className="w-7 h-7 text-green-700" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">Go Premium</h2>
          <p className="text-base text-ink-muted">Unlock the full Choosepure experience</p>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {PLANS.map(p => {
            const sel = picked === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPicked(p.id)}
                className={`relative cp-card p-4 text-left transition ${
                  sel ? 'border-2 border-green-700 shadow-elev' : ''
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-2 left-4 bg-green-800 text-white text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Best value
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base">{p.title}</p>
                    <p className="text-sm text-ink-muted">{p.blurb}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold">{p.price}</p>
                    <p className="text-xs text-ink-muted">{p.period}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="cp-card p-4 mb-5">
          <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-2.5">Includes</p>
          <ul className="space-y-2">
            {PERKS.map(perk => (
              <li key={perk} className="flex items-start gap-2.5 text-base">
                <Icon name="check" className="w-[18px] h-[18px] text-green-700 mt-0.5" strokeWidth={2.5} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('home')}>
          Start Free Trial
        </Button>
        <p className="text-center text-xs text-ink-muted mt-3">
          7-day free trial · Cancel anytime
        </p>
      </div>

      <TabBar active="profile" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
