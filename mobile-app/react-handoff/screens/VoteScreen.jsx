import React, { useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';
import Button from '../components/Button';

const SUGGESTIONS = [
  { name: 'Plant-based protein bars',  votes: 1240 },
  { name: 'Cold-pressed juices',       votes:  892 },
  { name: 'Sourdough breads',          votes:  756 },
  { name: 'Kombucha',                  votes:  531 },
];

export default function VoteScreen({ navigate = () => {} }) {
  const [voted, setVoted] = useState({});
  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('home')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Vote on next test</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-5">
        <div className="cp-card p-4 mb-4">
          <p className="text-base text-ink leading-relaxed">
            Every month we test a new category. Your votes decide what we test next.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          {SUGGESTIONS.map(s => {
            const isVoted = !!voted[s.name];
            return (
              <div key={s.name} className="cp-card p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-base font-bold">{s.name}</p>
                  <p className="text-sm text-ink-muted">{(s.votes + (isVoted ? 1 : 0)).toLocaleString()} votes</p>
                </div>
                <Button
                  size="sm"
                  variant={isVoted ? 'secondary' : 'primary'}
                  onClick={() => setVoted(v => ({ ...v, [s.name]: !v[s.name] }))}
                >
                  {isVoted ? 'Voted' : 'Vote'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="cp-card p-4">
          <p className="text-2xs uppercase tracking-widest font-bold text-ink-muted mb-2">Suggest a category</p>
          <input
            placeholder="What would you like us to test?"
            className="cp-field"
          />
          <Button fullWidth className="mt-3">Submit</Button>
        </div>
      </div>

      <TabBar active="home" items={TAB_PRESETS.v1} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
