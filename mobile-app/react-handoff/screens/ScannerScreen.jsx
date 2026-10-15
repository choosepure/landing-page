import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';

export default function ScannerScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame className="!bg-black">
      <StatusBar dark />

      <header className="px-6 py-3 flex items-center justify-between bg-[#0d0d0d]">
        <h1 className="text-lg font-semibold text-green-400">Scan Product</h1>
        <button onClick={() => navigate('home')}>
          <Icon name="close" className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Viewfinder */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(40,30,20,0.85) 0%, rgba(20,15,10,0.95) 100%), repeating-linear-gradient(90deg, #2a2419 0 8%, #4a3920 8% 9%, #2a2419 9% 17%, #5a4520 17% 18%, #2a2419 18% 25%)',
        }}
      >
        <div className="absolute top-5 left-5 right-5 flex justify-between z-10">
          <button className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center">
            <Icon name="flash" className="w-5 h-5 text-ink" />
          </button>
          <button className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center">
            <Icon name="image" className="w-[18px] h-[18px] text-ink" />
          </button>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-52">
          <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-md" />
          <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-md" />
          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-md" />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400 rounded-br-md" />
          <span
            className="absolute left-1 right-1 h-0.5 animate-scanline"
            style={{
              background: 'linear-gradient(90deg, transparent, #5DA47B, transparent)',
              boxShadow: '0 0 12px #5DA47B',
            }}
          />
        </div>

        <p className="absolute bottom-6 inset-x-0 text-center text-base text-white font-medium">
          Position barcode within frame
        </p>
      </div>

      <div className="bg-white px-5 pt-4">
        <p className="text-sm text-ink-muted mb-2.5">Recent Scans</p>
        <div className="flex gap-2.5 mb-4">
          {['#F4D03F', '#E8DCC4', '#D14E36', '#E5D5BE'].map((c, i) => (
            <button
              key={i}
              onClick={() => navigate('product-detail')}
              className="w-12 h-12 rounded-md"
              style={{ background: `radial-gradient(circle at 30% 30%, ${c}, ${c}99)` }}
            />
          ))}
        </div>
        <button
          onClick={() => navigate('lab-report')}
          className="w-full py-3 flex justify-between items-center border-t border-line text-base font-semibold text-green-800"
        >
          Can't scan? Enter barcode manually
          <Icon name="chevron-right" className="w-[18px] h-[18px]" />
        </button>
      </div>

      <TabBar
        active="scan"
        items={TAB_PRESETS.v3}
        onTab={id => {
          if (id === 'home')    navigate('home');
          if (id === 'profile') navigate('profile');
        }}
      />
    </PhoneFrame>
  );
}
