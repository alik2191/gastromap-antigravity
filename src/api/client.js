import { mockBase44 } from './mockBase44Client';
import { base44 as supabaseBase44 } from './supabaseAdapter';

// Default to true if not specified, for safety
// But in production this should be set to 'false'
const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';

// Export the selected client
export const base44 = isDemo ? mockBase44 : supabaseBase44;
