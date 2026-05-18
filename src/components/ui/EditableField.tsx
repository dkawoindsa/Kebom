'use client';

import { useEffect, useRef, useState } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  id?: string;
  'aria-describedby'?: string;
}

export default function EditableField({
  value,
  onChange,
  label,
  multiline,
  placeholder,
  id,
  'aria-describedby': ariaDescribedBy,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const viewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    if (multiline) {
      const el = textareaRef.current;
      if (el) {
        autoResize(el);
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    } else {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing, multiline]);

  function enter() {
    setDraft(value);
    setEditing(true);
  }

  function save() {
    onChange(draft);
    setEditing(false);
    viewRef.current?.focus();
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
    viewRef.current?.focus();
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  if (editing) {
    const sharedClass =
      'rounded-lg bg-[#0a0a0a] border border-neutral-600 px-4 py-3 text-sm text-neutral-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 w-full';

    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          id={id}
          rows={3}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); autoResize(e.target); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            if (e.key === 'Tab') { e.preventDefault(); save(); }
          }}
          onBlur={save}
          aria-label={label}
          aria-multiline="true"
          aria-describedby={ariaDescribedBy}
          placeholder={placeholder}
          className={`${sharedClass} resize-none overflow-hidden`}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          if (e.key === 'Tab') { e.preventDefault(); save(); }
        }}
        onBlur={save}
        aria-label={label}
        aria-describedby={ariaDescribedBy}
        placeholder={placeholder}
        className={sharedClass}
      />
    );
  }

  return (
    <div
      ref={viewRef}
      id={id}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-describedby={ariaDescribedBy}
      onClick={enter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
      }}
      className="flex items-start justify-between gap-2 cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
    >
      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
        {value || <span className="text-neutral-500">{placeholder}</span>}
      </span>
      <span
        className="material-symbols-outlined shrink-0 select-none text-neutral-600 group-hover:text-neutral-400 transition-colors"
        style={{ fontSize: '16px', lineHeight: '20px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
        aria-hidden="true"
      >
        stylus
      </span>
    </div>
  );
}
