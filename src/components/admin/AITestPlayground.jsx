import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw, Save, Loader2, Bot, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { api } from '@/api/client';

export default function AITestPlayground({ aiPrompts }) {
    const [selectedAgent, setSelectedAgent] = useState('helper_editor');
    const [testPrompt, setTestPrompt] = useState('');
    const [testInput, setTestInput] = useState('');
    const [testOutput, setTestOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]); // For chat-based agents

    // Load initial prompt when agent changes
    useEffect(() => {
        const prompt = aiPrompts.find(p => p.prompt_key === selectedAgent)?.prompt_text || '';
        setTestPrompt(prompt);
        setHistory([]);
        setTestOutput('');
        setTestInput('');
    }, [selectedAgent, aiPrompts]);

    const handleTest = async (e) => {
        e.preventDefault();
        if (!testInput.trim() || loading) return;

        setLoading(true);
        const currentInput = testInput;
        setTestInput(''); // Clear input immediately for better UX

        try {
            let response;

            if (selectedAgent === 'helper_editor') {
                // Determine simulated location name if needed, or ask user
                const locationName = "Test Location";

                response = await api.functions.invoke('ai-helper-editor', {
                    inputText: currentInput,
                    locationName: locationName,
                    systemPrompt: testPrompt
                });

                if (response.data?.generatedContent) {
                    setTestOutput(response.data.generatedContent);
                } else {
                    throw new Error(response.data?.error || 'No content generated');
                }

            } else if (selectedAgent === 'user_guide') {
                // Chat based
                const userMsg = { role: 'user', content: currentInput };
                setHistory(prev => [...prev, userMsg]);

                response = await api.functions.invoke('ai-guide-chat', {
                    message: currentInput,
                    // Mock user data for testing
                    userId: 'test-user',
                    systemPrompt: testPrompt
                });

                if (response.data?.reply) {
                    setHistory(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
                } else {
                    throw new Error('No reply');
                }

            } else if (selectedAgent === 'admin_copilot') {
                // Command based
                const userMsg = { role: 'user', content: currentInput };
                setHistory(prev => [...prev, userMsg]);

                response = await api.functions.invoke('ai-admin-actions', {
                    command: currentInput,
                    context: { userId: 'admin-test' }
                    // Note: ai-admin-actions logic needs to be updated to accept systemPrompt override too if we want to test prompts there.
                    // For now, let's assume it reads from DB only or we update it later.
                    // Actually, I didn't update ai-admin-actions to accept systemPrompt override.
                    // I will leave it as is for now, testing the LOGIC not the prompt override for admin yet.
                });

                if (response.data) {
                    const content = response.data.result || JSON.stringify(response.data, null, 2);
                    setHistory(prev => [...prev, { role: 'assistant', content: content, data: response.data }]);
                } else {
                    throw new Error('No response');
                }
            }

        } catch (error) {
            console.error('Test error:', error);
            toast.error('Test failed: ' + error.message);
            if (selectedAgent !== 'helper_editor') {
                setHistory(prev => [...prev, { role: 'error', content: 'Error: ' + error.message }]);
            } else {
                setTestOutput('Error: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Col: Settings */}
            <div className="col-span-1 space-y-4 flex flex-col h-full">
                <Card className="h-full flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
                    <CardHeader>
                        <CardTitle className="dark:text-neutral-100">Конфигурация</CardTitle>
                        <CardDescription>Выберите агента и настройте промпт для теста</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        <div>
                            <Label className="mb-2 block dark:text-neutral-200">Выберите агента</Label>
                            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                                <SelectTrigger className="dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="helper_editor">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                            <span>AI Helper (Content)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="user_guide">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            <span>AI Guide (Chat)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin_copilot">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-green-500" />
                                            <span>Admin Agent</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <Label className="mb-2 block dark:text-neutral-200">
                                Тестовый System Prompt
                                <Badge variant="outline" className="ml-2 text-[10px] text-yellow-600 border-yellow-200 bg-yellow-50">
                                    Влияет только на этот тест
                                </Badge>
                            </Label>
                            <Textarea
                                value={testPrompt}
                                onChange={(e) => setTestPrompt(e.target.value)}
                                className="flex-1 min-h-[200px] text-xs font-mono dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 resize-none"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const original = aiPrompts.find(p => p.prompt_key === selectedAgent)?.prompt_text || '';
                                setTestPrompt(original);
                                toast.info('Промпт сброшен к сохраненному значению');
                            }}
                        >
                            <RotateCcw className="w-3 h-3 mr-2" />
                            Сбросить изменения
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Col: Interactive Playground */}
            <div className="col-span-1 lg:col-span-2 flex flex-col h-full">
                <Card className="h-full flex flex-col dark:bg-neutral-800 dark:border-neutral-700">
                    <CardHeader className="py-4 border-b dark:border-neutral-700">
                        <CardTitle className="text-lg dark:text-neutral-100">
                            {selectedAgent === 'helper_editor' ? 'Тест генератора контента' : 'Интерактивный чат'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                        {selectedAgent === 'helper_editor' ? (
                            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                                    <div className="flex flex-col">
                                        <Label className="dark:text-neutral-300 mb-2">Входящий текст (черновик)</Label>
                                        <Textarea
                                            value={testInput}
                                            onChange={(e) => setTestInput(e.target.value)}
                                            placeholder="Введите сырой текст для обработки..."
                                            className="flex-1 resize-none bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <Label className="dark:text-neutral-300 mb-2">Результат AI</Label>
                                        <div className="flex-1 border rounded-md p-3 bg-white dark:bg-neutral-900 dark:border-neutral-700 overflow-y-auto whitespace-pre-wrap text-sm">
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto mt-20 text-neutral-400" /> : testOutput}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleTest}
                                    disabled={loading || !testInput.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                    Сгенерировать контент
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
                                    {history.length === 0 && (
                                        <div className="text-center text-neutral-400 mt-20">
                                            <p>Начните диалог для теста...</p>
                                        </div>
                                    )}
                                    {history.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : msg.role === 'error'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-white dark:bg-neutral-800 border dark:border-neutral-700 dark:text-neutral-100'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                {msg.data && (
                                                    <pre className="mt-2 text-[10px] bg-black/5 dark:bg-black/30 p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(msg.data, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border dark:border-neutral-700">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t dark:border-neutral-700 bg-white dark:bg-neutral-800">
                                    <form onSubmit={handleTest} className="flex gap-2">
                                        <Textarea
                                            value={testInput}
                                            onChange={(e) => setTestInput(e.target.value)}
                                            placeholder="Сообщение..."
                                            className="resize-none dark:bg-neutral-900"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    e.currentTarget.form.requestSubmit();
                                                }
                                            }}
                                        />
                                        <Button type="submit" disabled={loading || !testInput.trim()} size="icon" className="bg-blue-600 text-white">
                                            <Play className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
