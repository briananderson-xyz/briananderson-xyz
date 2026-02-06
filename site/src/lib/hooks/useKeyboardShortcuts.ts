import { onMount, onDestroy } from 'svelte';

export type ShortcutHandler = () => void;

export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
	alt?: boolean;
	handler: ShortcutHandler;
	description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	let handleKeyDown: (e: KeyboardEvent) => void;

	onMount(() => {
		handleKeyDown = (e: KeyboardEvent) => {
			for (const shortcut of shortcuts) {
				const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
				const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
				const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
				const altMatch = shortcut.alt ? e.altKey : !e.altKey;
				const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

				// On Mac, Cmd is meta; on Windows/Linux, Ctrl is ctrl
				const modifierMatch = (shortcut.ctrl || shortcut.meta) 
					? (e.ctrlKey || e.metaKey) 
					: true;

				if (keyMatch && modifierMatch && shiftMatch && altMatch) {
					e.preventDefault();
					shortcut.handler();
					break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		if (handleKeyDown) {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});
}

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
	const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
	const parts: string[] = [];

	if (shortcut.ctrl || shortcut.meta) {
		parts.push(isMac ? '⌘' : 'Ctrl');
	}
	if (shortcut.shift) {
		parts.push(isMac ? '⇧' : 'Shift');
	}
	if (shortcut.alt) {
		parts.push(isMac ? '⌥' : 'Alt');
	}
	parts.push(shortcut.key.toUpperCase());

	return parts.join(isMac ? '' : '+');
}
