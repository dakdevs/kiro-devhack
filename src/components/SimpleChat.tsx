"use client";

import React, { useState, useEffect, useRef, FC, FormEvent } from 'react';
import VoiceInputButton, { VoiceInputState } from './VoiceInputButton';
import VoiceDebugInfo from './VoiceDebugInfo';
import ChatDebugTest from './ChatDebugTest';
import BraveCompatibilityFix from './BraveCompatibilityFix';
import MicrophoneTest from './MicrophoneTest';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getBrowserCompatibility, logCompatibilityInfo } from '../utils/browserCompatibility';

// --- TYPES & INTERFACES ---
interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface IconProps {
    className?: string;
}

// This is the expected shape of the data from our API
type ApiResponseData = {
    reply?: string;
    message?: string; // Used for errors
};


// --- SVG ICONS ---
const SendIcon: FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const BotIcon: FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" /><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 12v-2a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" /><path d="M12 20v-4" /><path d="M8 20v-4" />
    </svg>
);


// --- UI SUB-COMPONENTS ---

// Component for a single message bubble
const MessageBubble: FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-gray-500" /></div>}
            <div
                className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${isUser
                    ? 'bg-blue-500 text-white rounded-br-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'
                    }`}
            >
                <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};


// --- MAIN CHAT COMPONENT ---
const SimpleChat: FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Congratulations, you are about to build a better profile! Let's get started- tell me about a recent project you worked on." }
    ]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice input functionality
    const {
        isListening,
        transcript,
        interimTranscript,
        error: speechError,
        isSupported: isSpeechSupported,
        canRetry,
        permissionState,
        isProcessing,
        hasCompletedTranscription,
        startListening,
        stopListening,
        resetTranscript,
        retryListening,
    } = useSpeechRecognition();

    // Track the base message (user typed text) separately from speech transcript
    const [baseMessage, setBaseMessage] = useState<string>('');
    const [speechTranscript, setSpeechTranscript] = useState<string>('');
    
    // Browser compatibility information (initialize on client side only)
    const [browserInfo, setBrowserInfo] = useState(() => ({
        name: 'Unknown',
        version: 'unknown',
        isSupported: false,
        supportLevel: 'none' as const,
        recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
        limitations: [],
        guidance: ''
    }));

    // Update speech transcript when final results come in
    useEffect(() => {
        if (transcript) {
            setSpeechTranscript(prev => prev + (prev ? ' ' : '') + transcript);
            resetTranscript(); // Clear the transcript after adding to speech transcript
        }
    }, [transcript, resetTranscript]);

    // Combine base message with speech transcript for display
    useEffect(() => {
        const combinedMessage = baseMessage + (speechTranscript ? (baseMessage ? ' ' : '') + speechTranscript : '');
        setNewMessage(combinedMessage);
    }, [baseMessage, speechTranscript]);

    // Determine voice button state
    const getVoiceButtonState = (): VoiceInputState => {
        if (speechError) return 'error';
        if (hasCompletedTranscription) return 'completed';
        if (isProcessing) return 'processing';
        if (isListening) return 'listening';
        return 'idle';
    };

    // Handle voice button click
    const handleVoiceButtonClick = () => {
        if (isListening) {
            stopListening();
        } else {
            // Reset speech transcript when starting new recording
            setSpeechTranscript('');
            startListening();
        }
    };

    // Handle retry functionality
    const handleVoiceRetry = () => {
        setSpeechTranscript('');
        retryListening();
    };

    // Function to scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize browser compatibility information on client side
    useEffect(() => {
        // Only run on client side
        if (typeof window !== 'undefined') {
            setBrowserInfo(getBrowserCompatibility());
            
            if (process.env.NODE_ENV === 'development') {
                logCompatibilityInfo();
            }
        }
    }, []);

    // Function to handle form submission
    const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const userMessage = newMessage.trim();
        if (userMessage === '' || isLoading) return;
    
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setNewMessage('');
        setBaseMessage('');
        setSpeechTranscript('');
        setIsLoading(true);
    
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...messages.map(msg => ({
                            role: msg.sender === 'user' ? 'user' : 'assistant',
                            content: msg.text,
                        })),
                        { role: 'user', content: userMessage }
                    ]
                }),
            });
    
            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
    
            const data: ApiResponseData = await response.json();
            console.log("API response:", data);
            console.log("API reply:", data.reply);
    
            if (data.reply) {
                //debuggging
                console.log('API data:', data);
                console.log('API reply:', data.reply);

                setMessages(prev => [...prev, { sender: 'ai', text: data.reply as string }]);
            } else {
                throw new Error('Invalid response from server');
            }
    
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900 font-sans">
            <BraveCompatibilityFix />
            <VoiceDebugInfo />
            <ChatDebugTest />
            <MicrophoneTest />
            <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <BotIcon className="w-6 h-6 text-blue-500" />
                <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
            </header>

            <main className="flex-1 p-6 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-800">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-gray-500" /></div>
                        <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                            <div className="flex items-center justify-center space-x-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewMessage(value);
                                    // Update base message by removing any speech transcript
                                    if (speechTranscript) {
                                        const speechPart = (baseMessage ? ' ' : '') + speechTranscript;
                                        if (value.endsWith(speechPart)) {
                                            setBaseMessage(value.slice(0, -speechPart.length));
                                        } else {
                                            // User is editing, reset speech transcript
                                            setSpeechTranscript('');
                                            setBaseMessage(value);
                                        }
                                    } else {
                                        setBaseMessage(value);
                                    }
                                }}
                                placeholder="Type a message to the AI..."
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full px-6 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                                disabled={isLoading}
                            />
                            {/* Interim transcript overlay for visual indication */}
                            {interimTranscript && (
                                <div className="absolute inset-0 px-6 py-3 pr-14 pointer-events-none flex items-center">
                                    <span className="invisible">{newMessage}</span>
                                    <span className="text-gray-400 dark:text-gray-500 italic">
                                        {newMessage ? ' ' : ''}{interimTranscript}
                                    </span>
                                </div>
                            )}
                            
                            {/* Processing indicator overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 px-6 py-3 pr-14 pointer-events-none flex items-center justify-end">
                                    <div className="flex items-center space-x-2 text-blue-500 text-sm">
                                        <div className="flex space-x-1">
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <span className="text-xs">Processing...</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Completion confirmation overlay */}
                            {hasCompletedTranscription && !isProcessing && (
                                <div className="absolute inset-0 px-6 py-3 pr-14 pointer-events-none flex items-center justify-end">
                                    <div className="flex items-center space-x-2 text-green-500 text-sm animate-fade-in">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-xs">Transcribed!</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Voice input button positioned inside the input field */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <VoiceInputButton
                                state={getVoiceButtonState()}
                                onClick={handleVoiceButtonClick}
                                onRetry={handleVoiceRetry}
                                disabled={isLoading || !browserInfo.isSupported}
                                error={speechError || undefined}
                                canRetry={canRetry}
                                permissionState={permissionState}
                                isSupported={browserInfo.isSupported}
                                browserInfo={browserInfo}
                                className="!p-2"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 flex-shrink-0 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        disabled={!newMessage.trim() || isLoading}
                    >
                        <SendIcon className="h-6 w-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default SimpleChat;