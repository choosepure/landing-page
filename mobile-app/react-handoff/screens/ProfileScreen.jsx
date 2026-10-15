import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';

const ITEMS = [
  { group: 'Account',   rows: [
    ['user',   'Edit profile'],
    ['bell',   'Notifications'],
    ['lock',   'Privacy & security'],
  ]},
  { group: 'Subscription', rows: [
    ['star',   'Plan & billing',     'plans'],
    ['gift',   'Refer & earn',       'referral'],
  ]},
  { group: 'Support', rows: [
    ['help',   'Help center'],
    ['info',   'About Choosepure'],
    ['logout', 'Sign out'],
  ]},
];

export default function ProfileScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('home')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Profile</h1>
        <button>
          <Icon name="sliders" className="w-5 h-5 text-green-800" />
        </button>
      </header>

      <div className="cp-content px-5 pb-5">
        {/* Profile card */}
        <div className="cp-card p-5 flex items-center gap-3.5 mb-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #B85C4D, #7E2A1E)' }}
          >
            <span className="absolute top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#E8C0A8]" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-7 rounded-t-2xl bg-[#7E2A1E]" />
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-bold">Sarah Johnson</p>
            <p className="text-sm text-ink-muted">sarah@example.com</p>
            <span className="inline-block mt-1 text-2xs font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-sm px-2 py-0.5">
              Premium · Yearly
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            ['142', 'Scans'],
            ['38',  'Saved'],
            ['9',   'Referrals'],
          ].map(([n, l]) => (
            <div key={l} className="cp-card p-3 text-center">
              <p className="font-display text-2xl font-bold text-green-800">{n}</p>
              <p className="text-2xs uppercase tracking-wider text-ink-muted mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {ITEMS.map(group => (
          <div key={group.group} className="mb-4">
            <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted px-1 mb-1.5">
              {group.group}
            </p>
            <div className="cp-card overflow-hidden">
              {group.rows.map(([icon, label, route], i, a) => (
                <button
                  key={label}
                  onClick={() => route && navigate(route)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                    i < a.length - 1 ? 'border-b border-line-soft' : ''
                  } ${label === 'Sign out' ? 'text-nutri-e' : 'text-ink'}`}
                >
                  <Icon
                    name={icon}
                    className={`w-5 h-5 ${label === 'Sign out' ? 'text-nutri-e' : 'text-ink-muted'}`}
                  />
                  <span className="flex-1 text-base font-medium">{label}</span>
                  {label !== 'Sign out' && <Icon name="chevron-right" className="w-4 h-4 text-ink-dim" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-ink-dim">Choosepure v1.4.2</p>
      </div>

      <TabBar active="profile" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
