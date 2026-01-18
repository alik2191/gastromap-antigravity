import { supabase } from '@/lib/supabase';

// Helper to map Supabase response to expected format or throw error
const handleResponse = async (promise) => {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
};

class SupabaseEntity {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async list(sortField) {
        let query = supabase.from(this.tableName).select('*');
        if (sortField) {
            const ascending = !sortField.startsWith('-');
            const column = ascending ? sortField : sortField.substring(1);
            query = query.order(column, { ascending });
        }
        const data = await handleResponse(query);
        // Map role to custom_role for UI compatibility if this is the profiles/users table
        if (this.tableName === 'profiles') {
            return data.map(u => ({ ...u, custom_role: u.role }));
        }
        return data;
    }

    async filter(criteria) {
        let actualCriteria = { ...criteria };
        if (this.tableName === 'profiles' && actualCriteria.custom_role) {
            actualCriteria.role = actualCriteria.custom_role;
            delete actualCriteria.custom_role;
        }
        const data = await handleResponse(supabase.from(this.tableName).select('*').match(actualCriteria));
        if (this.tableName === 'profiles') {
            return data.map(u => ({ ...u, custom_role: u.role }));
        }
        return data;
    }

    async create(data) {
        let actualData = { ...data };
        if (this.tableName === 'profiles' && actualData.custom_role) {
            actualData.role = actualData.custom_role;
            delete actualData.custom_role;
        }
        const result = await handleResponse(supabase.from(this.tableName).insert(actualData).select().single());
        if (this.tableName === 'profiles') {
            return { ...result, custom_role: result.role };
        }
        return result;
    }

    async update(id, data) {
        let actualData = { ...data };
        if (this.tableName === 'profiles' && actualData.custom_role) {
            actualData.role = actualData.custom_role;
            // Don't delete it yet, we might need it for state, but SQL only wants role
        }
        const dbData = { ...actualData };
        if (this.tableName === 'profiles' && dbData.custom_role) {
            dbData.role = dbData.custom_role;
            delete dbData.custom_role;
        }

        const result = await handleResponse(supabase.from(this.tableName).update(dbData).eq('id', id).select().single());
        if (this.tableName === 'profiles') {
            return { ...result, custom_role: result.role };
        }
        return result;
    }

    async delete(id) {
        const { error } = await supabase.from(this.tableName).delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    }

    async get(id) {
        const data = await handleResponse(supabase.from(this.tableName).select('*').eq('id', id).single());
        if (this.tableName === 'profiles' && data) {
            return { ...data, custom_role: data.role };
        }
        return data;
    }
}

// Export as generic adapter
export const adapter = {
    auth: {
        me: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                console.log('[Auth] No user found via getUser:', error);
                return null;
            }

            console.log('[Auth] User found:', user.email, user.id);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('[Auth] Error fetching profile:', profileError);
            } else {
                console.log('[Auth] Profile fetched:', profile);
            }

            const finalRole = profile?.role || user.user_metadata?.role || 'user';

            console.log('[Auth] Final Role Determination:', {
                profileRole: profile?.role,
                metadataRole: user.user_metadata?.role,
                calculated: finalRole
            });

            return {
                ...user.user_metadata,
                ...profile,
                id: user.id,
                email: user.email,
                name: profile?.full_name || user.user_metadata?.full_name || user.email,
                role: finalRole,
                custom_role: finalRole
            };
        },
        redirectToLogin: (redirectUrl) => {
            // Use Supabase Auth UI or redirect to login page
            // For now, redirect to /Login (matches PAGES key)
            window.location.href = `/Login?redirect=${encodeURIComponent(redirectUrl)}`;
        },
        logout: async (redirectUrl) => {
            await supabase.auth.signOut();
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        },
        updateMe: async (data) => {
            let dbData = { ...data };
            if (dbData.custom_role) {
                dbData.role = dbData.custom_role;
                delete dbData.custom_role;
            }

            const { data: { user }, error } = await supabase.auth.updateUser({
                data: data
            });
            if (error) throw error;

            // Also update profiles table if needed
            // Filter out fields that might not be in the profiles table to prevent errors
            // ideally we should fix the schema, but filtering is safer for now
            const validColumns = ['full_name', 'avatar_url', 'role', 'points', 'bio', 'notification_settings'];
            const profileData = {};
            Object.keys(dbData).forEach(key => {
                if (validColumns.includes(key)) {
                    profileData[key] = dbData[key];
                }
            });

            if (Object.keys(profileData).length > 0) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .update(profileData)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (profileError) {
                    console.error('[Auth] Error updating profile:', profileError);
                }
            } else {
                console.warn('[Auth] No valid columns to update in profiles table', dbData);
            }

            // Re-fetch profile to get the absolute latest state
            const { data: latestProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const profile = latestProfile; // use latest matches


            const finalRole = profile?.role || user.user_metadata?.role || 'user';
            return {
                ...user.user_metadata,
                ...profile,
                id: user.id,
                email: user.email,
                name: profile?.full_name || user.user_metadata?.full_name || user.email,
                role: finalRole,
                custom_role: finalRole
            };
        }
    },
    entities: {
        Location: new SupabaseEntity('locations'),
        SavedLocation: new SupabaseEntity('saved_locations'),
        RegionStatus: new SupabaseEntity('region_statuses'),
        Subscription: new SupabaseEntity('subscriptions'),
        Feedback: new SupabaseEntity('feedback'),
        ModerationRound: new SupabaseEntity('moderation_rounds'),
        CreatorAnswer: new SupabaseEntity('creator_answers'),
        User: new SupabaseEntity('profiles'), // 'users' is reserved in Supabase auth, usually 'profiles' table is used
        Review: new SupabaseEntity('reviews'),
        LocationBranch: new SupabaseEntity('location_branches'),
        LocationView: new SupabaseEntity('location_views'),
        ChatMessage: new SupabaseEntity('chat_messages'),
        // Add Query proxy for compatibility with old sdk usage
        Query: {
            // This is a minimal mock for the Query object if used directly
            filter: async () => [],
            list: async () => []
        }
    },
    appLogs: {
        logUserInApp: async (pageName) => {
            console.log(`[Supabase] Navigation log: ${pageName}`);
            return { success: true };
        },
        logEvent: async (name, data) => {
            console.log(`[Supabase] Event log: ${name}`, data);
            return { success: true };
        }
    },
    functions: {
        invoke: async (functionName, params) => {
            const { data, error } = await supabase.functions.invoke(functionName, {
                body: params
            });
            if (error) throw error;
            return { data }; // Ensure wrapper returns { data } as expected
        }
    },
    // storage is not in entities but usually handled separately, 
    // but the mock has integrations.Core.UploadFile
    integrations: {
        Core: {

            UploadFile: async ({ file }) => {
                // Upload to Supabase Storage 'uploads' bucket
                const fileName = `${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file);

                if (error) {
                    console.error('Upload error:', error);
                    return { success: false, error };
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);

                return {
                    success: true,
                    url: publicUrl,
                    file_url: publicUrl // Added for compatibility with Profile.jsx
                };
            },
            InvokeLLM: async ({ prompt, response_json_schema }) => {
                // Mock AI response to prevent crash since Edge Function is missing
                console.warn('AI Edge Function missing. Returning mock response.');

                // Return a valid JSON structure if schema is provided, otherwise text
                if (response_json_schema) {
                    return {
                        description: "AI generation is currently unavailable. Please write the description manually.",
                        tags: ["manual", "pending"],
                        category: "cafe"
                    };
                }

                return "AI generation is currently unavailable. Please write the description manually.";
            },
            SendEmail: async () => ({ success: true }),
            SendSMS: async () => ({ success: true }),
            GenerateImage: async () => ({ success: true }),
            ExtractDataFromUploadedFile: async () => ({ success: true })
        }
    },
    agents: {
        listConversations: async () => [],
        getWhatsAppConnectURL: () => '#',
        invoke: async () => ({ success: true })
    },
    storage: {
        upload: async (path, file) => {
            const { data, error } = await supabase.storage.from('uploads').upload(path, file);
            if (error) throw error;
            return data;
        },
        getPublicUrl: (path) => {
            const { data } = supabase.storage.from('uploads').getPublicUrl(path);
            return data.publicUrl;
        }
    }
};
