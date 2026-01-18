import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';

const EXPECTED_FIELDS = [
  { key: 'id', label: 'id (опционально)' },
  { key: 'name', label: 'name *' },
  { key: 'type', label: 'type *' },
  { key: 'country', label: 'country *' },
  { key: 'city', label: 'city *' },
  { key: 'address', label: 'address' },
  { key: 'description', label: 'description' },
  { key: 'price_range', label: 'price_range' },
  { key: 'website', label: 'website' },
  { key: 'image_url', label: 'image_url' },
  { key: 'latitude', label: 'latitude' },
  { key: 'longitude', label: 'longitude' },
  { key: 'is_hidden_gem', label: 'is_hidden_gem' },
  { key: 'is_featured', label: 'is_featured' },
  { key: 'insider_tip', label: 'insider_tip' },
  { key: 'must_try', label: 'must_try' },
];

const TYPE_ENUM = ['cafe', 'bar', 'restaurant', 'market', 'shop', 'bakery', 'winery'];
const PRICE_ENUM = ['$', '$$', '$$$', '$$$$'];

export default function ImportWizard({ isOpen, onClose, file, type, onImported }) {
  const [encoding, setEncoding] = useState('utf-8');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]); // array of plain objects keyed by header
  const [mapping, setMapping] = useState({}); // fieldKey -> headerName or ''
  const [validations, setValidations] = useState([]); // per row errors
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ created: 0, updated: 0, errors: 0 });
  const [editedData, setEditedData] = useState({}); // {rowIdx: {fieldKey: value}}

  // read file when opened / encoding changes
  useEffect(() => {
    if (!isOpen || !file) return;
    const read = async () => {
      setLoading(true);
      try {
        if (type === 'excel') {
          const ab = await file.arrayBuffer();
          const wb = XLSX.read(ab, { type: 'array' });
          const wsName = wb.SheetNames[0];
          const ws = wb.Sheets[wsName];
          const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const hdrs = json.length > 0 ? Object.keys(json[0]) : [];
          setHeaders(hdrs);
          setRows(json);
          setMapping(autoMap(hdrs));
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target.result;
            const { headers: hdrs, rows: csvRows } = parseCSV(text);
            setHeaders(hdrs);
            setRows(csvRows);
            setMapping(autoMap(hdrs));
          };
          reader.readAsText(file, encoding);
        }
      } finally {
        setLoading(false);
      }
    };
    read();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file, type, encoding]);

  // recompute validations when rows, mapping or edits change
  useEffect(() => {
    if (!rows.length) {
      setValidations([]);
      return;
    }
    const result = rows.map((row, idx) => {
      const mapped = applyMapping(row, mapping);
      const edited = editedData[idx] || {};
      return validateRow({ ...mapped, ...edited }, idx);
    });
    setValidations(result);
  }, [rows, mapping, editedData]);

  // Initialize selection to all rows by default whenever rows change
  useEffect(() => {
    const all = new Set(rows.map((_, idx) => idx));
    setSelectedRows(all);
  }, [rows]);

  const totalErrors = useMemo(() => validations.reduce((sum, v) => sum + v.errors.length, 0), [validations]);

  const selectedErrors = useMemo(() => {
    let count = 0;
    selectedRows.forEach((idx) => {
      count += (validations[idx]?.errors?.length || 0);
    });
    return count;
  }, [selectedRows, validations]);

  const canImport = rows.length > 0 && selectedRows.size > 0 && selectedErrors === 0;

  function autoMap(hdrs) {
    const map = {};
    const norm = (s) => String(s || '').trim().toLowerCase();
    hdrs = hdrs || [];
    for (const { key } of EXPECTED_FIELDS) {
      const found = hdrs.find(h => norm(h) === norm(key));
      map[key] = found || '';
    }
    return map;
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line) => {
      const out = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
        else { cur += ch; }
      }
      out.push(cur);
      return out.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };
    const hdrs = parseLine(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      const obj = {};
      hdrs.forEach((h, idx) => obj[h] = (vals[idx] ?? '').trim());
      rows.push(obj);
    }
    return { headers: hdrs, rows };
  }

  function applyMapping(row, map) {
    const obj = {};
    for (const { key } of EXPECTED_FIELDS) {
      const header = map[key];
      if (header) obj[key] = row[header];
    }
    return obj;
  }

  function parseTypes(mapped) {
    const out = { ...mapped };
    if (out.latitude === '' || out.latitude === undefined) out.latitude = null; else out.latitude = parseFloat(out.latitude);
    if (out.longitude === '' || out.longitude === undefined) out.longitude = null; else out.longitude = parseFloat(out.longitude);
    if (typeof out.is_hidden_gem === 'string') out.is_hidden_gem = ['true', '1', 'yes', 'y', 'да'].includes(out.is_hidden_gem.toLowerCase());
    if (typeof out.is_featured === 'string') out.is_featured = ['true', '1', 'yes', 'y', 'да'].includes(out.is_featured.toLowerCase());
    if (out.id !== undefined && out.id !== null) {
      const s = String(out.id).trim();
      if (s.length === 0) delete out.id; else out.id = s;
    }
    return out;
  }

  function validateRow(mapped, idx) {
    const errors = [];
    const fieldErrors = {};
    const addFieldErr = (field, msg) => {
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(msg);
      errors.push(msg);
    };
    const req = ['name', 'type', 'country', 'city'];
    req.forEach(f => { if (!mapped[f] || String(mapped[f]).trim().length === 0) addFieldErr(f, `Отсутствует обязательное поле: ${f}`); });
    if (mapped.type && !TYPE_ENUM.includes(String(mapped.type))) addFieldErr('type', `Недопустимый type: ${mapped.type}`);
    if (mapped.price_range && !PRICE_ENUM.includes(String(mapped.price_range))) addFieldErr('price_range', `Недопустимый price_range: ${mapped.price_range}`);
    if (mapped.latitude && isNaN(Number(mapped.latitude))) addFieldErr('latitude', 'latitude должно быть числом');
    if (mapped.longitude && isNaN(Number(mapped.longitude))) addFieldErr('longitude', 'longitude должно быть числом');
    return { rowIndex: idx, errors, fieldErrors };
  }

  const previewRows = useMemo(() => {
    const data = rows.map((r, i) => {
      const mapped = applyMapping(r, mapping);
      // Применяем ручные правки
      const edited = editedData[i] || {};
      return { i, m: { ...mapped, ...edited } };
    });
    return showOnlyErrors ? data.filter((_, idx) => validations[idx]?.errors?.length) : data;
  }, [rows, mapping, validations, showOnlyErrors, editedData]);

  const startImport = async () => {
    if (!canImport) return;
    setImporting(true);
    try {
      const selected = rows.map((r, idx) => ({ r, idx })).filter(({ idx }) => selectedRows.has(idx));
      const payload = selected.map(({ r, idx }) => {
        const mapped = applyMapping(r, mapping);
        const edited = editedData[idx] || {};
        const final = { ...mapped, ...edited };
        const parsed = parseTypes(final);
        return { ...parsed, sourceRow: idx + 2 };
      });

      const batchSize = 25; // размер пакета
      setTotalCount(payload.length);
      setProcessedCount(0);
      setUploadProgress(0);
      setSummary({ created: 0, updated: 0, errors: 0 });

      let created = 0, updated = 0, errors = 0;
      const allCreatedIds = [];
      const allUpdatedChanges = [];

      for (let i = 0; i < payload.length; i += batchSize) {
        const batch = payload.slice(i, i + batchSize);

        let batchCreated = 0;
        let batchUpdated = 0;
        let batchErrors = 0;

        // Process batch client-side since 'importLocations' function might not exist
        await Promise.all(batch.map(async (loc) => {
          try {
            // Remove sourceRow before sending to DB
            // eslint-disable-next-line no-unused-vars
            const { sourceRow, ...dbData } = loc;

            if (dbData.id) {
              const res = await api.entities.Location.update(dbData.id, dbData);
              batchUpdated++;
              if (res && res.id) allUpdatedChanges.push(res);
            } else {
              const res = await api.entities.Location.create(dbData);
              batchCreated++;
              if (res && res.id) allCreatedIds.push(res.id);
            }
          } catch (err) {
            console.error("Import row failed", err);
            batchErrors++;
          }
        }));

        created += batchCreated;
        updated += batchUpdated;
        errors += batchErrors;

        const processed = Math.min(i + batch.length, payload.length);
        setProcessedCount(processed);
        setUploadProgress(Math.round((processed / payload.length) * 100));
        setSummary({ created, updated, errors });

        // wait a bit to avoid rate limits
        await new Promise((r) => setTimeout(r, 200));
      }

      onImported?.({ created, updated, errors, createdIds: allCreatedIds, updatedChanges: allUpdatedChanges });
      onClose?.();
    } catch (e) {
      console.error('Import failed', e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-neutral-900 dark:text-neutral-100">Импорт {type === 'excel' ? 'Excel' : 'CSV'} — предпросмотр и маппинг</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-4 space-y-4 flex-1 overflow-auto">
          <div className="flex flex-wrap items-center gap-3">
            {type === 'csv' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-900 dark:text-neutral-300">Кодировка:</span>
                <Select value={encoding} onValueChange={setEncoding}>
                  <SelectTrigger className="w-[180px] text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf-8">UTF-8 (рекомендуется)</SelectItem>
                    <SelectItem value="windows-1251">Windows-1251</SelectItem>
                    <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge variant={rows.length ? 'default' : 'secondary'} className="text-white">Строк: {rows.length}</Badge>
            <Badge className={totalErrors ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}>Ошибок: {totalErrors}</Badge>
            {selectedRows.size > 0 && (
              <Badge variant="secondary">К импорту: {selectedRows.size}</Badge>
            )}
            <label className="flex items-center gap-2 text-sm ml-auto text-neutral-900 dark:text-neutral-100">
              <input type="checkbox" checked={showOnlyErrors} onChange={(e) => setShowOnlyErrors(e.target.checked)} />
              Показывать только строки с ошибками
            </label>
          </div>

          {showOnlyErrors && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-0 shadow-sm dark:border dark:border-amber-900 text-neutral-900 dark:text-amber-200 text-sm rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>
                Показаны только строки с ошибками. В каждой проблемной ячейке отмечена иконка — наведите для подсказки; также детали видны в колонке «Ошибки».
              </div>
            </div>
          )}

          {/* Mapping */}
          <div className="border-0 shadow-sm dark:border dark:border-neutral-700 rounded-xl p-4 bg-white dark:bg-neutral-900">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXPECTED_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs text-neutral-700 dark:text-neutral-400">{label}</div>
                  <Select value={mapping[key] || ''} onValueChange={(v) => setMapping(prev => ({ ...prev, [key]: v }))}>
                    <SelectTrigger className="text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700">
                      <SelectValue placeholder="Не использовать" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Не использовать</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview & validation */}
          <div className="border-0 shadow-sm dark:border dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900">
            <div className="overflow-auto max-h-[70vh]">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px] text-neutral-900 dark:text-neutral-300">
                      <Checkbox
                        checked={previewRows.length > 0 && previewRows.every(({ i }) => selectedRows.has(i))}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedRows);
                          if (checked) {
                            previewRows.forEach(({ i }) => next.add(i));
                          } else {
                            previewRows.forEach(({ i }) => next.delete(i));
                          }
                          setSelectedRows(next);
                        }}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[60px] text-neutral-900 dark:text-neutral-300">#</TableHead>
                    {EXPECTED_FIELDS.map(f => (
                      <TableHead key={f.key} className="text-neutral-900 dark:text-neutral-300">{f.key}</TableHead>
                    ))}
                    <TableHead className="text-neutral-900 dark:text-neutral-300">Ошибки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={EXPECTED_FIELDS.length + 3} className="text-center text-neutral-900 dark:text-neutral-300">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewRows.map(({ i, m }) => (
                      <TableRow key={i} className={validations[i]?.errors?.length ? 'bg-red-50/50 dark:bg-red-950/30' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(i)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedRows);
                              if (checked) next.add(i); else next.delete(i);
                              setSelectedRows(next);
                            }}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell className="text-neutral-900 dark:text-neutral-300">{i + 2}</TableCell>
                        {EXPECTED_FIELDS.map(f => {
                          const isLongField = ['description', 'insider_tip', 'must_try'].includes(f.key);
                          return (
                            <TableCell
                              key={f.key}
                              className={`${isLongField ? 'max-w-[220px]' : 'min-w-[120px]'} ${validations[i]?.fieldErrors?.[f.key]?.length ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'text-neutral-900 dark:text-neutral-100'}`}
                              title={validations[i]?.fieldErrors?.[f.key]?.join('; ') || String(m[f.key] ?? '')}
                            >
                              <div className="relative">
                                {f.key === 'type' ? (
                                  <Select
                                    value={m[f.key] ?? ''}
                                    onValueChange={(v) => {
                                      setEditedData(prev => ({
                                        ...prev,
                                        [i]: { ...(prev[i] || {}), [f.key]: v }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className={`h-7 text-xs ${validations[i]?.fieldErrors?.[f.key]?.length ? 'border-red-300' : ''}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TYPE_ENUM.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : f.key === 'price_range' ? (
                                  <Select
                                    value={m[f.key] ?? ''}
                                    onValueChange={(v) => {
                                      setEditedData(prev => ({
                                        ...prev,
                                        [i]: { ...(prev[i] || {}), [f.key]: v }
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className={`h-7 text-xs ${validations[i]?.fieldErrors?.[f.key]?.length ? 'border-red-300' : ''}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PRICE_ENUM.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={m[f.key] ?? ''}
                                    onChange={(e) => {
                                      setEditedData(prev => ({
                                        ...prev,
                                        [i]: { ...(prev[i] || {}), [f.key]: e.target.value }
                                      }));
                                    }}
                                    className={`h-7 text-xs px-2 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 ${validations[i]?.fieldErrors?.[f.key]?.length ? 'border-red-300 dark:border-red-700 pr-6' : ''}`}
                                  />
                                )}
                                {validations[i]?.fieldErrors?.[f.key]?.length > 0 && (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-600 absolute right-2 top-1.5 pointer-events-none" />
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-xs text-red-600 dark:text-red-400">
                          {validations[i]?.errors?.join('; ')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-700 dark:text-neutral-400">
              Обязательные поля: name, type, country, city. Типы: {TYPE_ENUM.join(', ')}. Цена: {PRICE_ENUM.join(', ')}.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={importing}>Отмена</Button>
              <Button onClick={startImport} disabled={!canImport || importing} className="bg-neutral-900 hover:bg-neutral-800">
                {importing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Импорт...</>) : 'Импортировать'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}