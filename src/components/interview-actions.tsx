"use client"

import { useState } from 'react';
import { InterviewSession } from '~/types/interview-management';
import { 
  Check, 
  X, 
  Calendar, 
  Trash2, 
  Edit, 
  MoreHorizontal,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface InterviewActionsProps {
  interview: InterviewSession;
  userType: 'candidate' | 'recruiter';
  onConfirm?: (confirmed: boolean, notes?: string) => Promise<void>;
  onReschedule?: () => void;
  onCancel?: (reason?: string) => Promise<void>;
  onEdit?: () => void;
  loading?: string | null;
  compact?: boolean;
}

export function InterviewActions({
  interview,
  userType,
  onConfirm,
  onReschedule,
  onCancel,
  onEdit,
  loading,
  compact = false
}: InterviewActionsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const isUpcoming = () => {
    return new Date(interview.scheduledStart) > new Date() && 
           ['scheduled', 'confirmed', 'rescheduled'].includes(interview.status);
  };

  const needsConfirmation = () => {
    if (interview.status !== 'scheduled') return false;
    
    return userType === 'candidate' 
      ? !interview.candidateConfirmed
      : !interview.recruiterConfirmed;
  };

  const canReschedule = () => {
    return isUpcoming() && ['scheduled', 'confirmed'].includes(interview.status);
  };

  const canCancel = () => {
    return isUpcoming();
  };

  const canEdit = () => {
    return userType === 'recruiter' && isUpcoming();
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!onConfirm) return;
    
    try {
      await onConfirm(confirmed, confirmNotes || undefined);
      setShowConfirmModal(false);
      setConfirmNotes('');
    } catch (error) {
      console.error('Failed to confirm interview:', error);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    
    try {
      await onCancel(cancelReason || undefined);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel interview:', error);
    }
  };

  const joinMeeting = () => {
    if (interview.meetingLink) {
      window.open(interview.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-150"
          disabled={loading !== null}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              <div className="py-1">
                {needsConfirmation() && onConfirm && (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleConfirm(true);
                      }}
                      disabled={loading === 'confirm'}
                      className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleConfirm(false);
                      }}
                      disabled={loading === 'confirm'}
                      className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Decline
                      </div>
                    </button>
                  </>
                )}
                
                {interview.meetingLink && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      joinMeeting();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-apple-blue hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Join Meeting
                    </div>
                  </button>
                )}
                
                {canReschedule() && onReschedule && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onReschedule();
                    }}
                    disabled={loading === 'reschedule'}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Reschedule
                    </div>
                  </button>
                )}
                
                {canEdit() && onEdit && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onEdit();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </div>
                  </button>
                )}
                
                {canCancel() && onCancel && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowCancelModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                  Cancel Interview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to cancel this interview? This action cannot be undone.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation (optional)"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
                  >
                    Keep Interview
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading === 'cancel'}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 disabled:opacity-50"
                  >
                    {loading === 'cancel' ? 'Cancelling...' : 'Cancel Interview'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Meeting Link */}
      {interview.meetingLink && (
        <button
          onClick={joinMeeting}
          className="inline-flex items-center gap-2 px-3 py-2 bg-apple-blue text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-150"
        >
          <ExternalLink className="w-4 h-4" />
          Join Meeting
        </button>
      )}

      {/* Confirmation Actions */}
      {needsConfirmation() && onConfirm && (
        <>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading === 'confirm'}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={loading === 'confirm'}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-150 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </>
      )}
      
      {/* Reschedule */}
      {canReschedule() && onReschedule && (
        <button
          onClick={onReschedule}
          disabled={loading === 'reschedule'}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
          Reschedule
        </button>
      )}
      
      {/* Edit */}
      {canEdit() && onEdit && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-150"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
      
      {/* Cancel */}
      {canCancel() && onCancel && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-150"
        >
          <Trash2 className="w-4 h-4" />
          Cancel
        </button>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                Confirm Interview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please confirm your attendance for this interview.
              </p>
              <textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Add any notes or questions (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  disabled={loading === 'confirm'}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50"
                >
                  {loading === 'confirm' ? 'Confirming...' : 'Confirm Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                Cancel Interview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to cancel this interview? This action cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150"
                >
                  Keep Interview
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading === 'cancel'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 disabled:opacity-50"
                >
                  {loading === 'cancel' ? 'Cancelling...' : 'Cancel Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}