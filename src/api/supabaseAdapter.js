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
        return handleResponse(query);
    }

    async filter(criteria) {
        // match() accepts an object of { column: value } which matches criteria perfectly
        return handleResponse(supabase.from(this.tableName).select('*').match(criteria));
    }

    async create(data) {
        return handleResponse(supabase.from(this.tableName).insert(data).select().single());
    }

    async update(id, data) {
        return handleResponse(supabase.from(this.tableName).update(data).eq('id', id).select().single());
    }

    async delete(id) {
        const { error } = await supabase.from(this.tableName).delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    }

    async get(id) {
        return handleResponse(supabase.from(this.tableName).select('*').eq('id', id).single());
    }
}

export const base44 = {
    auth: {
        me: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) return null;
            // Map Supabase user to App user format if needed, or just return user
            // The app expects { id, email, name, role... }
            // Supabase user has { id, email, user_metadata: { name, ... } }
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email,
                role: user.user_metadata?.role || 'user',
                ...user.user_metadata
            };
        },
        redirectToLogin: (redirectUrl) => {
            // Use Supabase Auth UI or redirect to login page
            // For now, redirect to /login
            window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
        },
        logout: async (redirectUrl) => {
            await supabase.auth.signOut();
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        },
        updateMe: async (data) => {
            const { data: { user }, error } = await supabase.auth.updateUser({
                data: data
            });
            if (error) throw error;
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email,
                role: user.user_metadata?.role || 'user',
                ...user.user_metadata
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
        LocationBranch: new SupabaseEntity('location_branches')
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
            UploadFile: async (file) => {
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
                    url: publicUrl
                };
            },
            InvokeLLM: async ({ prompt, response_json_schema }) => {
                // Call Supabase Edge Function 'invoke-llm'
                const { data, error } = await supabase.functions.invoke('invoke-llm', {
                    body: { prompt, response_json_schema }
                });
                if (error) throw error;
                return data; // invoke-llm function should return the result directly or in { results }
            }
        }
    }
};
