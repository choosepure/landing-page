import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import Button from '../components/Button';

export default function ReferralScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('profile')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Refer & Earn</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-5">
        <div
          className="rounded-xl p-6 mb-4 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #226342, #2D7A52)' }}
        >
          <div className="w-16 h-16 mx-auto mb-3 bg-white/15 rounded-full flex items-center justify-center">
            <Icon name="gift" className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm uppercase tracking-widest font-semibold opacity-80 mb-1">You've earned</p>
          <p className="font-display text-4xl font-bold mb-2">$45</p>
          <p className="text-base opacity-90">From 9 friends who joined</p>
        </div>

        {/* Code box */}
        <div className="cp-card p-4 mb-4">
          <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-2">Your referral code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-green-50 border border-dashed border-green-700 rounded-md py-3 text-center font-display text-xl font-bold text-green-800 tracking-[0.2em]">
              SARAH-PURE
            </div>
            <Button size="md" variant="secondary">Copy</Button>
          </div>
        </div>

        {/* How it works */}
        <div className="cp-card p-4 mb-4">
          <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-3">How it works</p>
          <ol className="space-y-3">
            {[
              ['Share your code',  'Send your code to friends via any app.'],
              ['They sign up',     'Friend creates an account using your code.'],
              ['You both earn',    'You get $5 credit, friend gets $5 off premium.'],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-base font-bold">{t}</p>
                  <p className="text-sm text-ink-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Recent activity */}
        <div className="cp-card overflow-hidden mb-4">
          <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted px-4 pt-4 pb-2.5">
            Recent activity
          </p>
          {[
            ['Maya R.',  'Joined yesterday', '+$5'],
            ['Tom B.',   'Joined 3d ago',    '+$5'],
            ['Lila S.',  'Joined Jun 12',    '+$5'],
          ].map(([n, when, amt], i, a) => (
            <div
              key={n}
              className={`flex items-center gap-3 px-4 py-3 ${i < a.length - 1 ? 'border-b border-line-soft' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-sm text-green-800">
                {n[0]}
              </div>
              <div className="flex-1">
                <p className="text-base font-medium">{n}</p>
                <p className="text-xs text-ink-muted">{when}</p>
              </div>
              <p className="font-display font-bold text-green-700">{amt}</p>
            </div>
          ))}
        </div>

        <Button fullWidth size="lg">
          <Icon name="share" className="w-[18px] h-[18px]" /> Share with friends
        </Button>
      </div>

      <TabBar active="profile" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
