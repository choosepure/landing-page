import React, { useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import Button from '../components/Button';
import Input from '../components/Input';
import Icon from '../components/Icon';

export default function LoginScreen({ navigate = () => {} }) {
  const [tab, setTab] = useState('email');

  return (
    <PhoneFrame>
      <StatusBar />

      <header className="px-6 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('onboarding')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Welcome Back</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-6">
        <div className="cp-card p-6 text-center mb-4">
          <img src="/choosepure-logo.png" alt="Choosepure" className="h-11 mx-auto mb-3" />
          <p className="text-base text-ink-muted">Sign in to continue your pure journey</p>
        </div>

        <div className="flex bg-white rounded-md p-1 mb-4 shadow-card">
          {[
            ['email', 'Email'],
            ['mobile', 'Mobile Number'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 rounded-sm text-base font-semibold transition ${
                tab === id ? 'bg-green-800 text-white' : 'text-ink-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="cp-card p-5 mb-5 space-y-4">
          <Input
            label={tab === 'email' ? 'Email Address' : 'Mobile Number'}
            type={tab === 'email' ? 'email' : 'tel'}
            leftIcon={tab === 'email' ? 'mail' : 'phone'}
            placeholder={tab === 'email' ? 'sarah@example.com' : '+1 555 0123'}
          />
          <Input label="Password" type="password" leftIcon="lock" rightIcon="eye" placeholder="••••••••" />
          <button onClick={() => navigate('forgot')} className="text-sm font-semibold text-green-800">
            Forgot password?
          </button>
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('home')}>
          Sign In
        </Button>

        <div className="flex items-center gap-3 my-5 text-xs text-ink-dim">
          <span className="flex-1 h-px bg-line" /> OR <span className="flex-1 h-px bg-line" />
        </div>

        <div className="space-y-2">
          <Button variant="outline" fullWidth>
            Continue with Google
          </Button>
          <Button variant="outline" fullWidth>
            Continue with Apple
          </Button>
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          New to Choosepure?{' '}
          <button onClick={() => navigate('signup')} className="font-semibold text-green-800">
            Create account
          </button>
        </p>
      </div>
    </PhoneFrame>
  );
}
