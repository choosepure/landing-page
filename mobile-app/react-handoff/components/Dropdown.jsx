import React, { useState } from 'react';
import Icon from './Icon';

/**
 * Generic dropdown for option lists.
 * <Dropdown
 *   label="Filter by grade"
 *   value={grade}
 *   options={[{ value:'A', label:'Grade A · Excellent', meta:'342 products', accent:'#1E8449' }, ...]}
 *   onChange={setGrade}
 *   renderTrigger={(opt) => <span>{opt.label}</span>}  // optional override
 * />
 */
export default function Dropdown({ label, value, options, onChange, renderOption, renderTriggerLeft }) {
  const [open, setOpen] = useState(false);
  const active = options.find(o => o.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full cp-card flex items-center gap-3 p-3 cursor-pointer"
      >
        {renderTriggerLeft?.(active)}
        <div className="flex-1 text-left min-w-0">
          {label && <div className="cp-label !mb-0.5">{label}</div>}
          <div className="text-base font-bold text-ink truncate">
            {active.label}{' '}
            {active.meta && <span className="text-ink-muted font-medium">({active.meta})</span>}
          </div>
        </div>
        <Icon name="chevron-down" className={`w-5 h-5 text-ink-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-10 mt-1.5 bg-white rounded-lg border border-line shadow-pop overflow-hidden animate-fade-up"
          role="listbox"
        >
          {options.map(opt => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 p-2.5 px-3.5 border-b border-line-soft last:border-0 ${
                  isSel ? 'bg-green-50' : 'bg-white hover:bg-green-50'
                }`}
                role="option"
                aria-selected={isSel}
              >
                {renderOption?.(opt)}
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-ink">{opt.label}</div>
                  {opt.meta && <div className="text-xs text-ink-muted">{opt.meta}</div>}
                </div>
                {isSel && <Icon name="check" className="w-4 h-4 text-green-700" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
