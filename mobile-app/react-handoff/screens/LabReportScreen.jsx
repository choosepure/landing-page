import React from 'react';
import PhoneFrame from '../components/PhoneFrame';
import StatusBar from '../components/StatusBar';
import TabBar, { TAB_PRESETS } from '../components/TabBar';
import Icon from '../components/Icon';

const PANELS = [
  {
    title: 'Heavy Metals Panel',
    items: [
      ['Lead (Pb)',     'Limit 0.1 ppm',  '< 0.01 ppm'],
      ['Cadmium (Cd)',  'Limit 0.05 ppm', '< 0.005 ppm'],
      ['Mercury (Hg)',  'Limit 0.1 ppm',  'Not detected'],
      ['Arsenic (As)',  'Limit 0.2 ppm',  '< 0.02 ppm'],
    ],
  },
  {
    title: 'Pesticide Screening',
    items: [
      ['Glyphosate',        'Limit 0.05 ppm',  'Not detected'],
      ['Organophosphates',  'Limit 0.01 ppm',  '< 0.001 ppm'],
      ['Pyrethroids',       'Limit 0.02 ppm',  'Not detected'],
    ],
  },
  {
    title: 'Microbiological Testing',
    items: [
      ['Total Plate Count', 'Limit 10,000 CFU/g', '180 CFU/g'],
      ['E. coli',           'Not detected',       'Not detected'],
      ['Salmonella',        'Not detected',       'Not detected'],
    ],
  },
];

export default function LabReportScreen({ navigate = () => {} }) {
  return (
    <PhoneFrame>
      <StatusBar />

      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <button onClick={() => navigate('product-detail')}>
          <Icon name="arrow-left" className="w-5 h-5 text-green-800" />
        </button>
        <h1 className="text-lg font-semibold text-green-800">Lab Report</h1>
        <button>
          <Icon name="share" className="w-5 h-5 text-green-800" />
        </button>
      </header>

      <div className="cp-content px-4 pb-5">
        {/* Product card */}
        <div className="cp-card flex gap-3 p-3.5 mb-3.5">
          <div className="w-[76px] h-[76px] rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8DCC4, #C9A87C)' }} />
          <div>
            <p className="text-base font-bold mb-1">Organic Almond Butter</p>
            <p className="text-sm text-ink-muted mb-1">NaturePath Farms</p>
            <p className="text-2xs text-ink-dim">LOT-AB-2024-0106 · Tested Jun 15, 2024</p>
          </div>
        </div>

        {/* Score banner */}
        <div className="rounded-xl p-5 text-white mb-4" style={{ background: 'linear-gradient(135deg, #2D7A52, #3D8862)' }}>
          <div className="flex justify-center mb-2.5">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
              <Icon name="check" className="w-7 h-7 text-green-700" strokeWidth={3} />
            </div>
          </div>
          <p className="text-center font-display text-2xl font-bold mb-1.5">Safety Score: 94/100</p>
          <p className="flex items-center justify-center gap-1.5 text-sm opacity-90">
            <Icon name="shield-check" className="w-3.5 h-3.5" /> No contaminants detected
          </p>
        </div>

        {PANELS.map((panel, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-t-md">
              <Icon name="flask" className="w-4 h-4 text-green-700" />
              <p className="font-semibold text-base">{panel.title}</p>
            </div>
            <div className="cp-card !rounded-t-none overflow-hidden">
              {panel.items.map(([name, limit, value], i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3.5 py-3 ${
                    i < panel.items.length - 1 ? 'border-b border-line-soft' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-2xs text-ink-dim">{limit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">{value}</p>
                    <p className="flex items-center gap-1 justify-end text-2xs text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-700" /> Pass
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Cert card */}
        <div className="cp-card p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-green-100 flex items-center justify-center">
            <Icon name="check-circle" className="w-5 h-5 text-green-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Certified Lab Partner</p>
            <p className="text-xs font-medium text-green-800">ISO 17025 Accredited</p>
            <p className="text-2xs text-ink-dim mt-0.5">PurityTest Laboratories · Test ID PT-2024-AB-0106</p>
          </div>
        </div>
      </div>

      <TabBar active="lab" items={TAB_PRESETS.v3} onTab={id => navigate(id)} />
    </PhoneFrame>
  );
}
