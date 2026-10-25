import React, { useRef, useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import Button from '../components/Button';
import Icon from '../components/Icon';

export default function OTPScreen({ navigate = () => {} }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-6 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('signup')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Verify Email</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-6 pb-6">
        <div className="cp-card p-6 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 inline-flex items-center justify-center mb-3">
            <Icon name="mail" className="w-7 h-7 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
          <p className="text-base text-ink-muted leading-relaxed">
            We sent a 6-digit code to<br />
            <strong className="text-ink">sarah@example.com</strong>
          </p>
        </div>

        <div className="flex gap-2.5 justify-center mb-6">
          {code.map((c, i) => (
            <input
              key={i}
              ref={el => (refs.current[i] = el)}
              maxLength={1}
              inputMode="numeric"
              value={c}
              onChange={e => setDigit(i, e.target.value)}
              className="w-12 h-14 text-center text-2xl font-display font-bold rounded-md bg-white border-2 border-line focus:border-green-700 focus:ring-2 focus:ring-green-100"
            />
          ))}
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('profile-setup')} disabled={code.some(c => !c)}>
          Verify & Continue
        </Button>

        <p className="text-center text-sm text-ink-muted mt-5">
          Didn't receive code?{' '}
          <button className="font-semibold text-green-800">Resend (00:42)</button>
        </p>
      </div>
    </PhoneFrame>
  );
}
