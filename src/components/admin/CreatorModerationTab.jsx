import React, { useState, useMemo } from 'react';
import { api } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight,
    MessageSquare, Users, Clock, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { specialLabels } from '../constants';

export default function CreatorModerationTab() {
    const [expandedRound, setExpandedRound] = useState(null);
    const queryClient = useQueryClient();

    const { data: moderationRounds = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-moderation-rounds'],
        queryFn: async () => {
            const pendingReview = await api.entities.ModerationRound.filter({
                status: 'pending_admin_review'
            }, '-created_date');

            const pendingCreators = await api.entities.ModerationRound.filter({
                status: 'pending_creator_answers'
            }, '-created_date');

            return [...pendingReview, ...pendingCreators];
        }
    });

    const { data: allAnswers = [] } = useQuery({
        queryKey: ['creatorAnswers'],
        queryFn: () => api.entities.CreatorAnswer.list('-created_date')
    });

    const applyMutation = useMutation({
        mutationFn: async ({ roundId, locationId, fieldName, value, tags }) => {
            const user = await api.auth.me();

            // Update location
            const updateData = {};
            if (fieldName === 'special_labels' && tags) {
                updateData.special_labels = tags;
            } else if (value) {
                updateData[fieldName] = value;
            }

            await api.asServiceRole.entities.Location.update(locationId, updateData);

            // Update round status
            await api.entities.ModerationRound.update(roundId, {
                status: 'applied',
                admin_id: user.id,
                admin_decision_date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-moderation-rounds']);
            queryClient.invalidateQueries(['admin-locations']);
            queryClient.invalidateQueries(['admin-pending-locations']);
            queryClient.invalidateQueries(['locations']);
            toast.success('Changes applied successfully');
        },
        onError: (error) => {
            console.error('Error applying changes:', error);
            toast.error('Failed to apply changes');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (roundId) => {
            const user = await api.auth.me();
            await api.entities.ModerationRound.update(roundId, {
                status: 'rejected',
                admin_id: user.id,
                admin_decision_date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-moderation-rounds']);
            toast.success('Moderation round rejected');
        },
        onError: (error) => {
            console.error('Error rejecting:', error);
            toast.error('Failed to reject');
        }
    });

    const groupedRounds = useMemo(() => {
        const grouped = {};
        moderationRounds.forEach(round => {
            if (!grouped[round.location_id]) {
                grouped[round.location_id] = {
                    location_id: round.location_id,
                    location_name: round.location_name,
                    rounds: []
                };
            }
            grouped[round.location_id].rounds.push(round);
        });
        return Object.values(grouped);
    }, [moderationRounds]);

    const getAnswersForRound = (roundId) => {
        // Find the question related to this round
        const round = moderationRounds.find(r => r.id === roundId);
        if (!round) return [];

        return allAnswers.filter(a => {
            // This is simplified - you might need better logic to link answers to rounds
            return true; // For now, return all
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (groupedRounds.length === 0) {
        return (
            <Card className="shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                    <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">All caught up!</h3>
                    <p className="text-neutral-900 dark:text-neutral-400">No pending moderation rounds from creators.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Creator Moderation</h2>
                <Badge className="bg-blue-600 text-white">
                    {moderationRounds.length} pending
                </Badge>
            </div>

            {groupedRounds.map(group => (
                <Card key={group.location_id} className="overflow-hidden shadow-sm border-0 dark:bg-neutral-800 dark:border dark:border-neutral-700">
                    <CardHeader className="bg-neutral-50 dark:bg-neutral-900 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-950 transition-colors"
                        onClick={() => setExpandedRound(expandedRound === group.location_id ? null : group.location_id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg text-neutral-900 dark:text-neutral-100">{group.location_name}</CardTitle>
                                <p className="text-sm text-neutral-700 dark:text-neutral-400 mt-1">
                                    {group.rounds.length} moderation round{group.rounds.length > 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {group.rounds.some(r => r.status === 'pending_admin_review') ? (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-0 dark:border dark:border-green-900">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Готов к проверке
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-0 dark:border dark:border-amber-900">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Ждёт ответов
                                    </Badge>
                                )}
                                {expandedRound === group.location_id ? (
                                    <ChevronDown className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <AnimatePresence>
                        {expandedRound === group.location_id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CardContent className="pt-6 space-y-6">
                                    {group.rounds.map((round, idx) => (
                                        <div key={round.id} className="shadow-sm border-0 dark:border dark:border-neutral-700 rounded-lg p-4 space-y-4">
                                            {/* Round Header */}
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <Badge variant="outline" className="mb-2 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700">
                                                        {round.field_name}
                                                    </Badge>
                                                    <div className="flex items-center gap-4 text-sm text-neutral-700 dark:text-neutral-400">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {format(new Date(round.created_at), 'MMM d, HH:mm')}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {(round.yes_count || 0) + (round.no_count || 0)} creators
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Proposed Value */}
                                            {round.proposed_value && (
                                                <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 dark:border-blue-600 p-3 rounded-r-lg">
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-blue-300">Proposed text:</p>
                                                    <p className="text-sm text-neutral-900 dark:text-blue-100 mt-1">"{round.proposed_value}"</p>
                                                </div>
                                            )}

                                            {/* Proposed Tags */}
                                            {round.field_name === 'special_labels' && round.proposed_tags && (
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2">Proposed labels:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {round.proposed_tags.map(tagId => {
                                                            const label = specialLabels.find(l => l.id === tagId);
                                                            return label ? (
                                                                <Badge key={tagId} variant="outline" className="dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700">
                                                                    {label.emoji} {label.label}
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Voting Results */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Yes</span>
                                                        <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                                                            {round.yes_count || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-red-700 dark:text-red-300">No</span>
                                                        <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                                                            {round.no_count || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Answers */}
                                            {round.custom_answers && round.custom_answers.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2">
                                                        Custom answers from creators:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {round.custom_answers.map((ans, i) => (
                                                            <div key={i} className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border-0 shadow-sm dark:border dark:border-neutral-700">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <MessageSquare className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                                                                        {ans.creator}
                                                                    </span>
                                                                    <span className="text-xs text-neutral-500 dark:text-neutral-500">
                                                                        {format(new Date(ans.date), 'MMM d, HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-neutral-900 dark:text-neutral-300 pl-6">{ans.answer}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Admin Actions */}
                                            <div className="flex gap-3 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => rejectMutation.mutate(round.id)}
                                                    disabled={rejectMutation.isPending || round.status === 'pending_creator_answers'}
                                                    className="flex-1"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    onClick={() => applyMutation.mutate({
                                                        roundId: round.id,
                                                        locationId: round.location_id,
                                                        fieldName: round.field_name,
                                                        value: round.proposed_value,
                                                        tags: round.proposed_tags
                                                    })}
                                                    disabled={applyMutation.isPending || round.status === 'pending_creator_answers'}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    {applyMutation.isPending ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    )}
                                                    {round.status === 'pending_creator_answers' ? 'Ждёт ответов' : 'Apply to Location'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            ))}
        </div>
    );
}