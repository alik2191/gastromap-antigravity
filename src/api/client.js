// Direct Supabase Adapter export
import { adapter } from './supabaseAdapter';

// Export as 'api' to be generic
export const api = adapter;

// Deprecated alias for backward compatibility during refactor (will be removed)
export const base44 = adapter;
