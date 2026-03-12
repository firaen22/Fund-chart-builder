import { useEffect, useCallback } from 'react';

export interface ShortcutAction {
  key: string;           // The key to listen for (e.g., 'n', 'r', '?')
  ctrl?: boolean;        // Requires Ctrl/Cmd
  shift?: boolean;       // Requires Shift
  description: string;   // English description
  descriptionCn: string; // Chinese description
  category: 'navigation' | 'view' | 'action';
  handler: () => void;
}

/**
 * Hook that registers global keyboard shortcuts.
 * Shortcuts are ignored when the user is typing in an input/textarea.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      // Also skip contenteditable
      if ((e.target as HTMLElement)?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? (e.ctrlKey || e.metaKey)
          : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch
        ) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
