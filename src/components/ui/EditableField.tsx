'use client';

import { useEffect, useRef, useState } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

export default function EditableField({
  value,
  onChange,
  label,
  multiline,
  placeholder,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const viewRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    if (multiline) {
      const el = textareaRef.current;
      if (el) {
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

  if (editing) {
    const sharedClass =
      'rounded-lg bg-[#0a0a0a] border border-neutral-600 px-4 py-3 text-sm text-neutral-300 focus:outline-none w-full';

    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            if (e.key === 'Tab') { e.preventDefault(); save(); }
          }}
          onBlur={save}
          aria-label={label}
          aria-multiline="true"
          placeholder={placeholder}
          className={sharedClass}
        />
      );
    }

    return (
      <input
        ref={inputRef}
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
        placeholder={placeholder}
        className={sharedClass}
      />
    );
  }

  return (
    <span
      ref={viewRef as React.RefObject<HTMLSpanElement>}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={enter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
      }}
      className="text-sm text-neutral-300 cursor-pointer hover:text-white transition-colors"
    >
      {value || <span className="text-neutral-500">{placeholder}</span>}
    </span>
  );
}
