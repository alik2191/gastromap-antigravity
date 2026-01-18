import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { api } from '@/api/client';
import { Loader2, Trash2, Send, Save, CheckSquare, Square, X, SlidersHorizontal, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const FIELDS = [
  { key: 'name', label: 'Название', type: 'text', width: 220 },
  { key: 'type', label: 'Тип', type: 'select', width: 120, options: ['cafe', 'bar', 'restaurant', 'market', 'shop', 'bakery', 'winery'] },
  { key: 'country', label: 'Страна', type: 'text', width: 140 },
  { key: 'city', label: 'Город', type: 'text', width: 140 },
  { key: 'address', label: 'Адрес', type: 'text', width: 220 },
  { key: 'description', label: 'Описание', type: 'textarea', width: 260 },
  { key: 'price_range', label: 'Цена', type: 'select', width: 90, options: ['$', '$$', '$$$', '$$$$'] },
  { key: 'website', label: 'Сайт', type: 'text', width: 180 },
  { key: 'image_url', label: 'Изображение', type: 'text', width: 200 },
  { key: 'latitude', label: 'Широта', type: 'number', width: 110 },
  { key: 'longitude', label: 'Долгота', type: 'number', width: 110 },
  { key: 'is_hidden_gem', label: 'Hidden Gem', type: 'boolean', width: 110 },
  { key: 'is_featured', label: 'На главной', type: 'boolean', width: 110 },
  { key: 'status', label: 'Статус', type: 'select', width: 130, options: ['draft', 'pending', 'published'] },
  { key: 'insider_tip', label: 'Совет', type: 'text', width: 220 },
  { key: 'must_try', label: 'Must Try', type: 'text', width: 220 },
];

function pickEditable(location) {
  const result = { id: location.id };
  FIELDS.forEach(f => { result[f.key] = location[f.key] ?? (f.type === 'boolean' ? false : ''); });
  return result;
}

export default function BulkEditor({ isOpen, onOpenChange, rows = [], onSaved }) {
  const [data, setData] = useState([]); // editable rows
  const [original, setOriginal] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState(new Set(FIELDS.map(f => f.key)));
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedRows, setDeletedRows] = useState(new Set()); // IDs помеченных на удаление

  useEffect(() => {
    if (isOpen) {
      const ed = rows.map(r => pickEditable(r));
      setData(ed);
      setOriginal(ed);
      setSelected(new Set());
      setVisibleFields(new Set(FIELDS.map(f => f.key)));
      setSearchQuery('');
      setDeletedRows(new Set());
    }
  }, [isOpen, rows]);

  const toggleField = (key) => {
    const next = new Set(visibleFields);
    if (next.has(key)) next.delete(key); else next.add(key);
    setVisibleFields(next);
  };

  const filteredFields = FIELDS.filter(f => visibleFields.has(f.key));

  const filteredData = useMemo(() => {
    // Сначала фильтруем удаленные
    const activeData = data.filter(row => !deletedRows.has(row.id));

    if (!searchQuery.trim()) return activeData;
    const query = searchQuery.toLowerCase();
    return activeData.filter(row => {
      const searchableText = [
        row.name,
        row.type,
        row.country,
        row.city,
        row.address,
        row.description
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  }, [data, searchQuery, deletedRows]);

  const allSelected = useMemo(() => filteredData.length > 0 && selected.size === filteredData.length, [filteredData, selected]);
  const modifiedRows = useMemo(() => {
    const mods = [];
    for (let i = 0; i < data.length; i++) {
      const cur = data[i];
      const prev = original[i] || {};
      const diff = {};
      FIELDS.forEach(f => {
        if ((cur[f.key] ?? '') !== (prev[f.key] ?? '')) diff[f.key] = cur[f.key];
      });
      if (Object.keys(diff).length) mods.push({ id: cur.id, changes: diff });
    }
    return mods;
  }, [data, original]);

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredData.map(r => r.id)));
  };

  const toggleRow = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const updateCell = (rowIndex, key, value) => {
    setData(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    });
  };

  const handleSaveAll = async () => {
    if (modifiedRows.length === 0 && deletedRows.size === 0) {
      toast.info('Нет изменений для сохранения');
      return;
    }
    setSaving(true);
    try {
      const operations = [];

      // Обновляем измененные строки
      modifiedRows.forEach(m => {
        const payload = { ...m.changes };
        if (typeof payload.latitude === 'string' && payload.latitude !== '') payload.latitude = parseFloat(payload.latitude);
        if (typeof payload.longitude === 'string' && payload.longitude !== '') payload.longitude = parseFloat(payload.longitude);
        operations.push(api.entities.Location.update(m.id, payload));
      });

      // Удаляем помеченные строки
      deletedRows.forEach(id => {
        operations.push(api.entities.Location.delete(id));
      });

      await Promise.all(operations);

      const summary = [];
      if (modifiedRows.length > 0) summary.push(`изменено: ${modifiedRows.length}`);
      if (deletedRows.size > 0) summary.push(`удалено: ${deletedRows.size}`);

      toast.success(`Сохранено: ${summary.join(', ')}`);
      onSaved && onSaved();
    } catch (e) {
      console.error(e);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) {
      toast.info('Не выбраны строки');
      return;
    }
    if (!confirm(`Пометить выбранные локации на удаление (${selected.size})? Удаление произойдет после нажатия "Сохранить".`)) return;

    // Помечаем строки на удаление локально
    setDeletedRows(prev => new Set([...prev, ...selected]));
    setSelected(new Set()); // Снимаем выделение
    toast.success(`Помечено на удаление: ${selected.size}. Нажмите "Сохранить" для применения.`);
  };

  const handleSendToModeration = async () => {
    if (selected.size === 0) {
      toast.info('Не выбраны строки');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(Array.from(selected).map(id => api.entities.Location.update(id, { status: 'pending' })));
      toast.success(`Отправлено на модерацию: ${selected.size}`);
      onSaved && onSaved();
    } catch (e) {
      console.error(e);
      toast.error('Ошибка изменения статуса');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
        <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b shrink-0 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base md:text-lg text-neutral-900 dark:text-neutral-100">Массовое редактирование</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-neutral-700 dark:text-neutral-400 mt-1">
            Строк: {data.length - deletedRows.size} {searchQuery && `• Найдено: ${filteredData.length}`} • Выбрано: {selected.size} • Изменено: {modifiedRows.length} {deletedRows.size > 0 && `• К удалению: ${deletedRows.size}`}
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-4 md:px-6 py-3 border-b shrink-0 bg-white dark:bg-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <Input
              placeholder="Поиск по названию, городу, стране, адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="md:hidden px-4 py-2 border-b bg-neutral-50 dark:bg-neutral-900 flex gap-2 overflow-x-auto shrink-0">
          <Button size="sm" variant="outline" onClick={toggleSelectAll} className="text-xs shrink-0">
            {allSelected ? <CheckSquare className="w-3 h-3 mr-1" /> : <Square className="w-3 h-3 mr-1" />}
            {allSelected ? 'Снять' : 'Все'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleSendToModeration} disabled={saving} className="text-xs shrink-0">
            <Send className="w-3 h-3 mr-1" /> Модерация
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteSelected} disabled={saving || selected.size === 0} className="text-xs shrink-0">
            <Trash2 className="w-3 h-3 mr-1" /> Удалить
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving} className="text-xs shrink-0">
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Сохранить
          </Button>
        </div>

        {/* Desktop Action Buttons */}
        <div className="px-6 py-3 border-b bg-neutral-50 dark:bg-neutral-900 items-center justify-between gap-2 shrink-0 hidden md:flex">
          <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="w-4 h-4 mr-2" /> Поля ({visibleFields.size}/{FIELDS.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start" onInteractOutside={(e) => e.preventDefault()}>
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Выберите поля для отображения</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVisibleFields(new Set(FIELDS.map(f => f.key)))}
                    className="text-xs h-7"
                  >
                    Все
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {FIELDS.map(field => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 p-1 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={visibleFields.has(field.key)}
                        onCheckedChange={() => toggleField(field.key)}
                      />
                      <span className="text-xs text-neutral-900 dark:text-neutral-100">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleSelectAll}>
              {allSelected ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              {allSelected ? 'Снять выделение' : 'Выбрать все'}
            </Button>
            <Button variant="outline" onClick={handleSendToModeration} disabled={saving}>
              <Send className="w-4 h-4 mr-2" /> На модерацию
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={saving || selected.size === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить выбранные
            </Button>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить все
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <div className="min-w-max">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="w-[42px] px-2 py-2 text-left border-b border-neutral-200 dark:border-neutral-700">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-neutral-900 dark:text-neutral-400 w-[90px] border-b border-neutral-200 dark:border-neutral-700">ID</th>
                  {filteredFields.map(col => (
                    <th key={col.key} style={{ minWidth: col.width }} className="px-2 py-2 text-left text-xs font-medium text-neutral-900 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800">
                {filteredData.map((row) => {
                  const rowIndex = data.findIndex(d => d.id === row.id);
                  return (
                    <tr key={row.id} className="align-top hover:bg-neutral-50 dark:hover:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700">
                      <td className="px-2 py-2">
                        <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} />
                      </td>
                      <td className="px-2 py-2 text-xs text-neutral-900 dark:text-neutral-400 font-mono">{row.id?.slice(0, 8)}…</td>
                      {filteredFields.map(col => (
                        <td key={col.key} className="px-2 py-2">
                          {col.type === 'text' && (
                            <Input value={row[col.key] ?? ''} onChange={e => updateCell(rowIndex, col.key, e.target.value)} className="h-8 text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500" />
                          )}
                          {col.type === 'textarea' && (
                            <Textarea value={row[col.key] ?? ''} onChange={e => updateCell(rowIndex, col.key, e.target.value)} rows={2} className="min-h-[60px] text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500" />
                          )}
                          {col.type === 'number' && (
                            <Input type="number" step="any" value={row[col.key] ?? ''} onChange={e => updateCell(rowIndex, col.key, e.target.value)} className="h-8 font-mono text-xs text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500" />
                          )}
                          {col.type === 'boolean' && (
                            <div className="flex items-center h-8">
                              <Switch checked={!!row[col.key]} onCheckedChange={v => updateCell(rowIndex, col.key, v)} />
                            </div>
                          )}
                          {col.type === 'select' && (
                            <Select value={(row[col.key] ?? '') + ''} onValueChange={v => updateCell(rowIndex, col.key, v)}>
                              <SelectTrigger className="h-8 text-xs text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {col.options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={filteredFields.length + 2} className="h-24 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                      {searchQuery ? 'Ничего не найдено' : 'Нет данных'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-4 md:px-6 py-3 border-t dark:border-neutral-700 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-neutral-800">
          <div className="text-xs text-neutral-700 dark:text-neutral-400 hidden md:block">
            {(modifiedRows.length > 0 || deletedRows.size > 0) && (
              <>
                {modifiedRows.length > 0 && `${modifiedRows.length} изменений`}
                {modifiedRows.length > 0 && deletedRows.size > 0 && ' • '}
                {deletedRows.size > 0 && `${deletedRows.size} к удалению`}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none">
              Закрыть
            </Button>
            <Button onClick={handleSaveAll} disabled={saving || (modifiedRows.length === 0 && deletedRows.size === 0)} className="flex-1 md:flex-none">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить {(modifiedRows.length > 0 || deletedRows.size > 0) && `(${modifiedRows.length + deletedRows.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}