import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || createPageUrl('Dashboard');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0],
                        }
                    }
                });
                if (error) throw error;
                toast.success('Check your email for confirmation!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Logged in successfully!');
                navigate(redirectUrl);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        const demoEmail = 'demo@gastromap.app';
        const demoPassword = 'Password123!';

        try {
            // Try to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: demoEmail,
                password: demoPassword,
            });

            if (signInError) {
                // If sign in fails, try to sign up once (could be first time)
                const { error: signUpError } = await supabase.auth.signUp({
                    email: demoEmail,
                    password: demoPassword,
                    options: {
                        data: {
                            full_name: 'Demo Guest',
                        }
                    }
                });

                if (signUpError) {
                    // If still fails, maybe it already exists but wrong password or confirmed?
                    // But for demo, we'll just show the error
                    throw signUpError;
                }

                toast.success('Demo account created! Logging in...');
                // Signing up in Supabase usually auto-logs you in if email confirm is off.
                // If it's on, we might be stuck, but usually for demo we assume it works or we use a pre-confirmed one.
                navigate(redirectUrl);
            } else {
                toast.success('Logged in as Demo Guest!');
                navigate(redirectUrl);
            }
        } catch (error) {
            toast.error('Demo Login Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-neutral-900 px-4">
            <Card className="w-full max-w-md shadow-xl border-none dark:bg-neutral-800">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-100">GastroMap</CardTitle>
                    <CardDescription className="text-center text-neutral-500 dark:text-neutral-400">
                        {isSignUp ? 'Create your account' : 'Sign in to your account'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/20" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>

                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#F2F2F7] dark:bg-neutral-800 px-2 text-neutral-500">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-neutral-200 dark:border-neutral-700 dark:text-neutral-300"
                            onClick={handleDemoLogin}
                            disabled={loading}
                        >
                            Try Demo Access
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-neutral-500">
                                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
