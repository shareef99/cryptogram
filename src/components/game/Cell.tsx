/**
 * Renders the correct view for a puzzle cell (letter or symbol). Memoized on the
 * static `cell` prop; per-cell store subscriptions live in the child views.
 */

import { memo } from 'react';

import type { Cell as PuzzleCell } from '@/types';

import { LetterCellView } from './LetterCellView';
import { SymbolCellView } from './SymbolCellView';

function CellInner({ cell }: { cell: PuzzleCell }) {
  if (cell.kind === 'symbol') return <SymbolCellView char={cell.char} />;
  return <LetterCellView cell={cell} />;
}

export const Cell = memo(CellInner);
