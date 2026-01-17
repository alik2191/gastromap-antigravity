import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '../LanguageContext';

export default function ReviewSection({ locationId, user }) {
    const { language, t } = useLanguage();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [showForm, setShowForm] = useState(false);
    
    const queryClient = useQueryClient();

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['reviews', locationId],
        queryFn: async () => {
            const allReviews = await base44.entities.Review.filter({ location_id: locationId }, '-created_date');
            // Filter out hidden reviews for regular users
            return allReviews.filter(r => !r.is_hidden);
        }
    });

    const submitReviewMutation = useMutation({
        mutationFn: async (reviewData) => {
            // Save review as-is without modifications
            const finalData = { ...reviewData };

            // Check if user already reviewed
            const existing = reviews.find(r => r.user_email === user.email);
            if (existing) {
                return base44.entities.Review.update(existing.id, finalData);
            }
            return base44.entities.Review.create(finalData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['reviews', locationId]);
            setRating(0);
            setComment('');
            setShowForm(false);
            toast.success('Review submitted!');
        }
    });

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        
        submitReviewMutation.mutate({
            user_email: user.email,
            user_name: user.full_name,
            location_id: locationId,
            rating,
            comment: comment.trim()
        });
    };

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const userReview = reviews.find(r => r.user_email === user?.email);

    // Get localized comment
    const getLocalizedComment = (review) => {
        if (!review.comment) return '';
        if (language === 'ru') return review.comment;
        const localizedField = `comment_${language}`;
        return review[localizedField] || review.comment;
    };

    return (
        <div className="space-y-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4 pb-6 border-b">
                <div className="text-center">
                    <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{averageRating}</div>
                    <div className="flex gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{reviews.length} reviews</div>
                </div>
                
                <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-neutral-700 dark:text-neutral-400 w-8">{stars}★</span>
                                <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-400 transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-neutral-700 dark:text-neutral-400 w-8">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Write Review Button */}
            {!showForm && !userReview && (
                <Button 
                    onClick={() => setShowForm(true)}
                    className="w-full rounded-full h-11 bg-neutral-900 hover:bg-neutral-800"
                >
                    Write a Review
                </Button>
            )}

            {/* Review Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-5 space-y-4"
                    >
                        <div>
                            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">
                                Your Rating
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star 
                                            className={`w-8 h-8 ${
                                                star <= (hoverRating || rating) 
                                                    ? 'fill-amber-400 text-amber-400' 
                                                    : 'text-neutral-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-2 block">
                                Your Review (Optional)
                            </label>
                            <Textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                                className="min-h-[100px] resize-none text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder:text-neutral-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                onClick={handleSubmit}
                                disabled={submitReviewMutation.isPending || rating === 0}
                                className="flex-1 rounded-full h-11 bg-neutral-900 hover:bg-neutral-800"
                            >
                                {submitReviewMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Review
                                    </>
                                )}
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowForm(false);
                                    setRating(0);
                                    setComment('');
                                }}
                                variant="outline"
                                className="rounded-full h-11"
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User's Existing Review */}
            {userReview && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Your Review</span>
                        <Button 
                            onClick={() => {
                                setRating(userReview.rating);
                                setComment(userReview.comment || '');
                                setShowForm(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Edit
                        </Button>
                    </div>
                    <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < userReview.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                            />
                        ))}
                    </div>
                    {userReview.comment && (
                        <p className="text-sm text-neutral-900 dark:text-blue-200">{getLocalizedComment(userReview)}</p>
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-neutral-700 dark:text-neutral-400">
                        No reviews yet. Be the first!
                    </div>
                ) : (
                    reviews
                        .filter(r => r.user_email !== user?.email)
                        .map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar with Initials */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
                                        {review.user_name 
                                            ? review.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                            : 'A'}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        {/* Header: Name, Date, Rating */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
                                                    {review.user_name || 'Anonymous User'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-neutral-400 dark:text-neutral-600">•</span>
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {new Date(review.created_date).toLocaleDateString(
                                                            language === 'ru' ? 'ru-RU' : 
                                                            language === 'uk' ? 'uk-UA' : 
                                                            language === 'es' ? 'es-ES' : 'en-US', 
                                                            { 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Review Comment */}
                                        {review.comment && (
                                            <p className="text-sm text-neutral-900 dark:text-neutral-200 leading-relaxed mb-4">
                                                {getLocalizedComment(review)}
                                            </p>
                                        )}
                                        
                                        {/* Helpful Button */}
                                        <button className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            <span>{t('helpful')} {review.helpful_count > 0 && `(${review.helpful_count})`}</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                )}
            </div>
        </div>
    );
}