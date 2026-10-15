import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import Button from '../components/Button';
import Input from '../components/Input';
import Icon from '../components/Icon';

export default function SignupScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />
      <header className="px-6 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('onboarding')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Create Account</h1>
        <div className="w-9" />
      </header>

      <div className="cp-content px-5 pb-6">
        <div className="cp-card p-6 text-center mb-4">
          <img src="/choosepure-logo.png" alt="Choosepure" className="h-9 mx-auto mb-2" />
          <p className="text-sm text-ink-muted">Start your journey to natural living</p>
        </div>

        <div className="cp-card p-5 mb-5 space-y-4">
          <Input label="Full Name"     leftIcon="user" placeholder="Sarah Johnson" />
          <Input label="Email Address" type="email" leftIcon="mail" placeholder="sarah@example.com" />
          <Input label="Mobile Number" type="tel"   leftIcon="phone" placeholder="+1 555 0123" />
          <Input label="Password"      type="password" leftIcon="lock" rightIcon="eye" placeholder="At least 8 characters" />
        </div>

        <p className="text-xs text-ink-muted text-center mb-4 px-4">
          By creating an account, you agree to our{' '}
          <span className="text-green-800 font-semibold">Terms</span> and{' '}
          <span className="text-green-800 font-semibold">Privacy Policy</span>.
        </p>

        <Button fullWidth size="lg" onClick={() => navigate('otp')}>
          Create Account
        </Button>

        <p className="text-center text-sm text-ink-muted mt-5">
          Already have an account?{' '}
          <button onClick={() => navigate('login')} className="font-semibold text-green-800">
            Sign in
          </button>
        </p>
      </div>
    </PhoneFrame>
  );
}
