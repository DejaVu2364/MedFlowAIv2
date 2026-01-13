// Feedback Buttons Component
// Allows doctors to rate Jarvis responses for learning (Phase 5)

import React, { useState } from 'react';

interface FeedbackButtonsProps {
    episodeId: string;
    onFeedback: (outcome: 'accepted' | 'rejected') => void;
    size?: 'sm' | 'md';
}

/**
 * Thumbs up/down buttons for Jarvis response feedback
 * Captures doctor satisfaction for procedural memory learning
 */
export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
    episodeId,
    onFeedback,
    size = 'sm'
}) => {
    const [given, setGiven] = useState(false);
    const [feedback, setFeedback] = useState<'accepted' | 'rejected' | null>(null);

    const handleFeedback = (outcome: 'accepted' | 'rejected') => {
        setFeedback(outcome);
        setGiven(true);
        onFeedback(outcome);
    };

    if (given) {
        return (
            <span className={`text-${size === 'sm' ? 'xs' : 'sm'} text-gray-400`}>
                {feedback === 'accepted' ? '✓ Thanks!' : 'Noted'}
            </span>
        );
    }

    const buttonClass = size === 'sm'
        ? 'text-xs px-2 py-0.5'
        : 'text-sm px-3 py-1';

    return (
        <div className="flex gap-2 mt-1" data-episode-id={episodeId}>
            <button
                onClick={() => handleFeedback('accepted')}
                className={`${buttonClass} text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors`}
                aria-label="Mark as helpful"
            >
                👍 Helpful
            </button>
            <button
                onClick={() => handleFeedback('rejected')}
                className={`${buttonClass} text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors`}
                aria-label="Mark as not helpful"
            >
                👎
            </button>
        </div>
    );
};

/**
 * Inline feedback for chat messages
 */
interface InlineFeedbackProps {
    episodeId?: string;
    onFeedback?: (outcome: 'accepted' | 'rejected') => void;
}

export const InlineFeedback: React.FC<InlineFeedbackProps> = ({
    episodeId,
    onFeedback
}) => {
    if (!episodeId || !onFeedback) return null;

    return (
        <FeedbackButtons
            episodeId={episodeId}
            onFeedback={onFeedback}
            size="sm"
        />
    );
};

export default FeedbackButtons;
