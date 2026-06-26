import { useState, useRef } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { exportTable, importTable } from '../../shared/api/importExportApi.js';

export function ImportExportPanel({ connectionId, tableName }) {
  const toast = useToast();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importFormat, setImportFormat] = useState('csv');
  const fileInputRef = useRef(null);

  async function handleExport(format) {
    setExporting(true);
    try {
      await exportTable(connectionId, tableName, format);
      toast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      toast('Please select a file to import', 'error');
      return;
    }
    setImporting(true);
    try {
      const result = await importTable(connectionId, tableName, selectedFile, importFormat);
      toast(`Imported ${result?.data?.inserted ?? ''} record(s)`, 'success');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink">
        Import / Export: <span className="text-brand">{tableName}</span>
      </h2>

      {/* Export Section */}
      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate mb-3">Export</h3>
        <p className="text-sm text-slate mb-4">
          Download the contents of <span className="font-medium text-ink">{tableName}</span> in your preferred format.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('csv')}
            loading={exporting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            CSV
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('json')}
            loading={exporting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            JSON
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleExport('sql')}
            loading={exporting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            SQL Dump
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate mb-3">Import</h3>
        <p className="text-sm text-slate mb-4">
          Upload a CSV or JSON file to import into <span className="font-medium text-ink">{tableName}</span>.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept={importFormat === 'csv' ? '.csv' : '.json'}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm text-slate file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand/90"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 rounded-lg bg-mist p-3">
              <svg className="h-5 w-5 shrink-0 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-ink">{selectedFile.name}</p>
                <p className="text-xs text-slate">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button size="sm" onClick={handleImport} loading={importing}>
                Import
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
