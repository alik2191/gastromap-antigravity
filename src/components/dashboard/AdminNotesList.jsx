import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function AdminNotesList({ locationId }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-location-notes', locationId],
    queryFn: async () => {
      const items = await api.entities.SavedLocation.filter({ location_id: locationId }, '-updated_date');
      return items;
    },
    enabled: !!locationId,
  });

  const notes = useMemo(() => {
    return (entries || []).filter((e) => typeof e.personal_note === 'string' && e.personal_note.trim().length > 0);
  }, [entries]);

  const [expanded, setExpanded] = useState(false);
  const visibleNotes = expanded ? notes : notes.slice(0, 5);

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-neutral-900">User Notes (Admin)</div>
        <Badge variant={notes.length ? 'default' : 'secondary'}>{notes.length}</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-neutral-500 text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-neutral-500 text-sm">No user notes for this location.</div>
      ) : (
        <>
          <ScrollArea className="max-h-64 pr-2">
            <div className="space-y-3">
              {visibleNotes.map((n) => (
                <div key={n.id} className="bg-white rounded-lg border border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-neutral-500 truncate">{n.user_email}</div>
                    <div className="flex items-center gap-2">
                      {n.list_type && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 capitalize">{n.list_type}</Badge>
                      )}
                      {n.updated_at && (
                        <span className="text-[10px] text-neutral-400">
                          {new Date(n.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-800 whitespace-pre-wrap">{n.personal_note}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
          {notes.length > 5 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700"
            >
              {expanded ? 'Show less' : `Show all (${notes.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}