import React, { useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import Button from '../components/Button';

const SLIDES = [
  {
    title: 'Is it really clean?',
    body: 'Discover products free from harmful additives, pesticides, and contaminants.',
  },
  {
    title: 'Is it nutritious?',
    body: 'Every product is scored on calories, sugars, sodium, and key micronutrients.',
  },
  {
    title: 'Is it actually pure?',
    body: 'Make confident decisions with transparent safety scores you can rely on.',
  },
];

export default function OnboardingScreen({ navigate = () => {} }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;

  return (
    <PhoneFrame className="bg-green-50">
      <StatusBar />

      <div className="px-6 pt-3 flex justify-end">
        <button onClick={() => navigate('login')} className="text-sm font-semibold text-ink-muted">
          Skip
        </button>
      </div>

      <div className="cp-content flex flex-col items-center text-center px-8 pt-10">
        <div className="w-44 h-44 rounded-full bg-green-100 flex items-center justify-center mb-12 p-6">
          <img src="/choosepure-logo.png" alt="Choosepure" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-3 text-ink">{slide.title}</h1>
        <p className="text-md text-ink-muted leading-snug max-w-[280px] mb-8">{slide.body}</p>
        <div className="flex gap-2 mb-10">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-green-700' : 'w-2 bg-green-100'}`}
            />
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button
          fullWidth
          size="lg"
          onClick={() => (isLast ? navigate('signup') : setI(i + 1))}
        >
          {isLast ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </PhoneFrame>
  );
}
