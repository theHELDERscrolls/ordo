import type { ImportMode } from '@ordo/shared';
import { Paperclip } from 'lucide-react';
import { useDeferredValue, useMemo, useState, type ChangeEvent } from 'react';

import { useImportProducts } from './useProductCsv';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { buttonClasses } from '@/shared/ui/button-styles';

/**
 * The refusals that are about the file as a whole, in the language the rest of the app
 * speaks. The row-level messages are not translated: they name the column that failed
 * and come straight from the contract, which is what makes them fixable in the
 * spreadsheet.
 */
const messages: Record<string, string> = {
  'Send the file as text/csv': 'El archivo no es un CSV.',
  'The CSV needs a header with sku and name, and at least one row':
    'El archivo necesita una cabecera con sku y name, y al menos una fila.',
  'Request failed (413)': 'El archivo supera el límite de 1 MB.',
};

const modes: { value: ImportMode; label: string; hint: string }[] = [
  {
    value: 'set',
    label: 'Reemplazar',
    hint: 'La columna stock pasa a ser el stock del producto.',
  },
  {
    value: 'add',
    label: 'Sumar',
    hint: 'La columna stock se suma al stock que ya tiene.',
  },
];

type ImportDialogProps = { open: boolean; onClose: () => void };

/**
 * Loads the catalogue from a spreadsheet, `admin` only. Picking a file reads it with
 * the native `file.text()` and asks the API what it would do with it; changing the
 * mode asks again. Nothing is written until "Importar", which is the same request
 * without the dry run.
 */
export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [mode, setMode] = useState<ImportMode>('set');
  const run = useImportProducts();

  // The report is rendered from the deferred copy, so a file with a long error list
  // paints in the background instead of freezing the mode buttons while it lands.
  const report = useDeferredValue(run.data);
  const stale = report !== run.data;

  // Recomputed only when the report itself changes, not on every keystroke of the
  // dialog's own state.
  const summary = useMemo(
    () =>
      report && [
        { label: 'Nuevos', value: report.created },
        { label: 'Actualizados', value: report.updated },
        { label: 'Omitidos', value: report.skipped },
      ],
    [report],
  );

  const applicable = report ? report.total - report.skipped : 0;
  const done = report !== undefined && !report.dryRun;
  const error = run.error as Error | null;

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    // Cleared so that picking the same file again — corrected in the spreadsheet
    // between two attempts — still fires a change and is analysed afresh.
    e.target.value = '';
    if (!picked) return;
    const text = await picked.text();
    setFile({ name: picked.name, text });
    run.mutate({ text, mode, dryRun: true });
  }

  function changeMode(next: ImportMode) {
    setMode(next);
    if (file) run.mutate({ text: file.text, mode: next, dryRun: true });
  }

  function close() {
    setFile(null);
    setMode('set');
    run.reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={close} labelledBy="import-dialog-title" className="sm:max-w-lg">
      <h2 id="import-dialog-title" className="font-display text-xl font-semibold tracking-tight">
        Importar CSV
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        Se comprueba el archivo entero antes de escribir nada. Los productos se
        reconocen por su SKU: los que ya existan se actualizan y el resto se crean.
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`${buttonClasses('secondary')} cursor-pointer focus-within:border-fg`}
          >
            <Paperclip size={16} strokeWidth={2} />
            {file ? 'Cambiar archivo' : 'Elegir archivo'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={run.isPending}
              onChange={(e) => void pick(e)}
            />
          </label>
          {file && (
            <span className="min-w-0 truncate text-sm text-fg-muted" title={file.name}>
              {file.name}
            </span>
          )}
        </div>

        <fieldset disabled={run.isPending}>
          <legend className="text-sm font-medium">Qué hacer con la columna stock</legend>
          <div className="mt-1.5 flex gap-2">
            {modes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeMode(option.value)}
                aria-pressed={mode === option.value}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  mode === option.value
                    ? 'border-fg bg-surface-2'
                    : 'border-border hover:border-fg'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-fg-muted">
            {modes.find((option) => option.value === mode)?.hint}
          </p>
        </fieldset>

        {run.isPending && (
          <p className="text-sm text-fg-muted">
            {run.variables?.dryRun ? 'Comprobando el archivo…' : 'Importando…'}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {messages[error.message] ?? error.message}
          </p>
        )}

        {report && summary && (
          <div className={stale ? 'opacity-60' : undefined} aria-busy={stale}>
            <p className="text-sm font-medium">
              {done
                ? 'Importación terminada.'
                : `${report.total} ${report.total === 1 ? 'fila leída' : 'filas leídas'}.`}
            </p>
            <dl className="mt-2 grid grid-cols-3 gap-2">
              {summary.map((card) => (
                <div key={card.label} className="rounded-md border border-border bg-surface p-3">
                  <dt className="text-xs text-fg-muted">{card.label}</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{card.value}</dd>
                </div>
              ))}
            </dl>

            {report.errors.length > 0 && (
              <div className="scrollbar-slim mt-3 max-h-56 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface text-xs tracking-wide text-fg-muted uppercase">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 font-medium">Línea</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.errors.map((row) => (
                      <tr key={row.row} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 tabular-nums">{row.row}</td>
                        <td className="px-3 py-2 tabular-nums">{row.sku ?? '—'}</td>
                        <td className="px-3 py-2 text-fg-muted">{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-6">
        {done ? (
          <Button type="button" onClick={close}>
            Cerrar
          </Button>
        ) : (
          <>
            <button type="button" onClick={close} className={buttonClasses('secondary')}>
              Cancelar
            </button>
            <Button
              type="button"
              disabled={run.isPending || applicable === 0}
              onClick={() => file && run.mutate({ text: file.text, mode, dryRun: false })}
            >
              {applicable > 0 ? `Importar ${applicable}` : 'Importar'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
