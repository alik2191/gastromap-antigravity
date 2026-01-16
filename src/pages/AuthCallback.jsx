import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    useEffect(() => {
        const checkRole = async () => {
            try {
                const user = await base44.auth.me();
                if (user.role === 'admin') {
                    window.location.href = createPageUrl('Admin');
                } else {
                    window.location.href = createPageUrl('Dashboard');
                }
            } catch (error) {
                // If somehow not logged in, redirect to home
                window.location.href = createPageUrl('Home');
            }
        };
        
        checkRole();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    );
}