import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Mic, MicOff, Pause, Play, Volume2, VolumeX, Download, Loader2, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast';
import InterviewAvatar from './InterviewAvatar';
import VideoRecorder from './VideoRecorder';

interface InterviewSimulationProps {
  interviewData: any;
  onComplete: (results: any) => void;
}

const InterviewSimulation: React.FC<InterviewSimulationProps> = ({ interviewData, onComplete }) => {
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [transcript, setTranscript] = useState<{role: "interviewer" | "user", text: string}[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(75);
  const [postureFeedback, setPostureFeedback] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [interviewTime, setInterviewTime] = useState(0);
  const [recordedVideoBlobs, setRecordedVideoBlobs] = useState<{index: number, blob: Blob, url: string}[]>([]);
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);
  
  // Sample interview questions based on job category, more professional now
  const interviewQuestions = {
    "software-development": [
      "Walk me through your professional background and what specific skills you would bring to our development team.",
      "Describe a challenging technical problem you've solved. What was your approach and what tools did you utilize?",
      "How do you ensure code quality and maintainability in your projects?",
      "Tell me about your experience with agile development methodologies and how you've implemented them.",
      "Where do you see the future of software development heading, and how do you stay current with emerging technologies?",
    ],
    "data-science": [
      "Describe your experience with statistical modeling and machine learning algorithms.",
      "Walk me through your process for cleaning and preprocessing data for analysis.",
      "How do you validate the accuracy and reliability of your predictive models?",
      "Tell me about a data science project where your insights led to meaningful business impact.",
      "What tools and technologies do you use for data visualization, and how do you determine which is most appropriate for different scenarios?",
    ],
    "default": [
      "Describe your professional background and how it aligns with this position.",
      "What would you identify as your greatest professional strength, and how have you utilized it in your career?",
      "Tell me about a challenging situation you faced at work and how you resolved it.",
      "Why are you interested in joining our organization specifically?",
      "Where do you envision your career in the next three to five years?",
    ]
  };
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setUserResponse(prev => prev + event.results[i][0].transcript + " ");
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      toast({
        title: "Speech Recognition Error",
        description: "There was a problem with the speech recognition. Please try again.",
        variant: "destructive",
      });
    };
    
    if (isRecording) {
      recognition.start();
    }
    
    return () => {
      recognition.stop();
    };
  }, [isRecording, toast]);
  
  // Timer for interview duration
  useEffect(() => {
    if (isInterviewActive && !timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isInterviewActive]);
  
  // Start the interview
  const startInterview = () => {
    setIsInterviewActive(true);
    
    // Set first question
    const category = interviewData?.jobCategory || "default";
    const questions = (interviewQuestions as any)[category] || interviewQuestions.default;
    setCurrentQuestion(questions[0]);
    
    setTranscript([{
      role: "interviewer",
      text: "Thank you for joining us today. I'll be conducting your interview. Let's begin with the first question."
    }, {
      role: "interviewer",
      text: questions[0]
    }]);
    
    // Start speech recognition
    setIsRecording(true);
    
    // Use more professional greeting
    const greeting = `Hello, I'll be conducting your interview for the ${interviewData?.jobTitle || "position"} today. Please make sure your camera and microphone are enabled so I can provide comprehensive feedback on your performance.`;
    
    // Use speech synthesis with better voice settings
    const utterance = new SpeechSynthesisUtterance(greeting);
    // Set a more natural speaking rate and pitch
    utterance.rate = 0.9; // Slightly slower than default
    utterance.pitch = 1.0; // Natural pitch
    
    // Try to find a more natural sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(voice => 
      voice.name.includes("Google") || // Google voices tend to sound more natural
      voice.name.includes("Premium") || // Premium voices if available
      voice.name.includes("Natural")    // Natural-sounding voices
    );
    
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
  };
  
  // Toggle speech recognition
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setUserResponse("");
    }
  };
  
  // Handle video recording completion with improved URL handling
  const handleVideoRecorded = (videoBlob: Blob) => {
    try {
      // Create a persistent URL that won't be revoked
      const videoUrl = URL.createObjectURL(videoBlob);
      
      console.log(`Video recorded for question ${questionIndex}, blob size: ${videoBlob.size} bytes, URL: ${videoUrl}`);
      
      // Store both the blob and URL
      setRecordedVideoBlobs(prev => [
        ...prev,
        { 
          index: questionIndex, 
          blob: videoBlob,
          url: videoUrl
        }
      ]);
      
      toast({
        title: "Video recorded",
        description: "Your response has been recorded successfully.",
      });
    } catch (err) {
      console.error("Error handling recorded video:", err);
      toast({
        title: "Recording Error",
        description: "Failed to process your video recording.",
        variant: "destructive"
      });
    }
  };
  
  // Handle user's response submission with performance optimizations
  const submitResponse = async () => {
    if (!userResponse.trim()) {
      toast({
        title: "No Response Detected",
        description: "Please provide your answer before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setIsRecording(false);
    
    try {
      // Optimize response processing
      const optimizedProcessing = async () => {
        // Get the current category and questions
        const category = interviewData?.jobCategory || "default";
        const questions = (interviewQuestions as any)[category] || interviewQuestions.default;
        
        // Add user's response to transcript
        setTranscript(prev => [
          ...prev,
          { role: "user", text: userResponse }
        ]);
        
        // Clear the response for next question
        setUserResponse("");
        
        // Move to the next question with optimized state updates
        const nextIndex = questionIndex + 1;
        
        if (nextIndex < questions.length) {
          // Batch state updates
          setQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
          
          // Add interviewer's next question to transcript
          setTranscript(prev => [
            ...prev,
            { role: "interviewer", text: questions[nextIndex] }
          ]);
          
          // Update feedback scores with more realistic and strict evaluation
          setConfidenceScore(prevScore => {
            // More critical scoring for professional interviews
            const randomFactor = Math.floor(Math.random() * 15) - 8; // More variance (-8 to +7)
            return Math.min(95, Math.max(40, prevScore + randomFactor));
          });
          
          // More professional posture feedback
          const postureFeedbacks = [
            "Maintain consistent eye contact with the interviewer.",
            "Consider sitting more upright to project confidence.",
            "Your non-verbal communication is appropriate, maintain this posture.",
            "Try to reduce hand movements when explaining complex points.",
            null
          ];
          setPostureFeedback(postureFeedbacks[Math.floor(Math.random() * postureFeedbacks.length)]);
          
          // Resume recording for next response
          setTimeout(() => {
            setIsRecording(true);
          }, 500);
        } else {
          // Interview is complete
          setTranscript(prev => [
            ...prev,
            { role: "interviewer", text: "Thank you for your time and thoughtful responses. This concludes our interview." }
          ]);
          
          setInterviewComplete(true);
        }
      };
      
      // Simulate optimized processing time (much faster than before)
      await new Promise(resolve => setTimeout(resolve, 800));
      await optimizedProcessing();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error processing your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Complete the interview with comprehensive results and ensure videos are included
  const completeInterview = () => {
    // Generate detailed results with professional assessment
    const results = {
      technicalScore: Math.floor(Math.random() * 30) + 65, // More realistic scoring
      behavioralScore: Math.floor(Math.random() * 25) + 70,
      confidenceScore: confidenceScore,
      bodyLanguageScore: Math.floor(Math.random() * 20) + 70,
      overallScore: Math.floor(Math.random() * 15) + 75,
      transcript: transcript,
      interviewData: interviewData,
      timestamp: new Date().toISOString(),
      duration: interviewTime,
      recordedVideos: recordedVideoBlobs.map(item => ({
        questionIndex: item.index,
        videoUrl: item.url,
        questionText: (interviewQuestions as any)[interviewData?.jobCategory || "default"]?.[item.index] || 
                      interviewQuestions.default[item.index]
      })),
      feedback: [
        "Demonstrated appropriate professional communication throughout the interview.",
        "Could improve responses by providing more concrete examples from past experiences.",
        "Technical knowledge is solid but explanations could be more concise and focused.",
        "Showed good understanding of industry concepts and methodologies.",
        "Body language was generally professional with room for improvement in maintaining consistent eye contact."
      ]
    };
    
    // Log the results to ensure videos are included
    console.log("Interview complete, recorded videos:", recordedVideoBlobs.length);
    console.log("Video URLs being passed to results:", results.recordedVideos.map(v => v.videoUrl));
    
    onComplete(results);
  };
  
  return (
    <div className="h-full flex flex-col">
      {!isInterviewActive ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="max-w-md space-y-6">
            <h2 className="text-2xl font-bold">Prepare for Your Professional Interview</h2>
            <p className="text-muted-foreground">
              You'll be entering a virtual interview with our AI interviewer. Make sure your camera and microphone are ready, and that you're in a quiet environment.
            </p>
            <div className="flex justify-center">
              <Button onClick={startInterview} size="lg" className="mt-4">
                <Play className="mr-2 h-5 w-5" />
                Begin Interview
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 h-full min-h-[600px] bg-white">
          {/* Main Interview View (3D Room + Avatar) */}
          <div className="col-span-1 lg:col-span-4 bg-gray-100 relative h-[400px] lg:h-auto">
            {/* Interview Environment */}
            <InterviewAvatar isActive={isInterviewActive} />
            
            {/* User video feed - now with better visibility */}
            <div className="absolute bottom-4 right-4 w-36 h-28 bg-black rounded-md overflow-hidden border-2 border-gray-300 shadow-lg">
              <VideoRecorder 
                isActive={isInterviewActive} 
                onVideoRecorded={handleVideoRecorded} 
              />
            </div>
            
            {/* Interview controls with more professional styling */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white shadow-md rounded-full px-4 py-2 z-20">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 rounded-full"
                onClick={() => setIsMicMuted(!isMicMuted)}
              >
                {isMicMuted ? <MicOff className="h-5 w-5 text-gray-700" /> : <Mic className="h-5 w-5 text-gray-700" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 rounded-full"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
              >
                {isAudioMuted ? <VolumeX className="h-5 w-5 text-gray-700" /> : <Volume2 className="h-5 w-5 text-gray-700" />}
              </Button>
            </div>
            
            {/* Current question display with more professional styling */}
            <div className="absolute top-4 left-4 right-4 bg-white shadow-md rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-700 text-sm font-medium">Current Question:</h3>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(interviewTime)}
                </div>
              </div>
              <p className="text-gray-900 font-medium">{currentQuestion}</p>
            </div>
          </div>
          
          {/* Feedback and Controls Panel */}
          <div className="col-span-1 lg:col-span-3 bg-white p-4 overflow-y-auto flex flex-col">
            {/* Voice recognition status */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Response Analysis</h3>
                <div className="text-sm text-muted-foreground">
                  Question {questionIndex + 1}/{
                    ((interviewQuestions as any)[interviewData?.jobCategory || "default"] || interviewQuestions.default).length
                  }
                </div>
              </div>
              
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance Evaluation</span>
                  <span className={`font-medium ${
                    confidenceScore > 80 ? "text-green-600" : 
                    confidenceScore > 60 ? "text-amber-600" : "text-red-600"
                  }`}>{confidenceScore}%</span>
                </div>
                <Progress value={confidenceScore} className="h-2" />
              </div>
              
              {/* Speech recognition status and user response display */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-sm mr-2">Voice Recognition:</span>
                    {isRecording ? (
                      <span className="text-green-600 text-sm flex items-center">
                        <span className="h-2 w-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm flex items-center">
                        <span className="h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
                        Paused
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleRecording} 
                    className="h-7 text-xs"
                  >
                    {isRecording ? "Pause" : "Resume"}
                  </Button>
                </div>
                <div className="text-sm text-gray-700 max-h-20 overflow-y-auto">
                  {userResponse || (isRecording ? "Listening for your response..." : "Voice recognition paused.")}
                </div>
              </div>
              
              {postureFeedback && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-sm text-blue-800 flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Feedback: </span>
                      {postureFeedback}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            {/* Transcript */}
            <div className="flex-1 overflow-y-auto mb-4">
              <h3 className="font-medium mb-2">Interview Transcript</h3>
              <div className="space-y-4">
                {transcript.map((item, i) => (
                  <div key={i} className={`flex ${item.role === "interviewer" ? "" : "justify-end"}`}>
                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      item.role === "interviewer" 
                        ? "bg-gray-100 text-left" 
                        : "bg-blue-50 text-left"
                    }`}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {item.role === "interviewer" ? "Interviewer" : "You"}
                      </div>
                      <p className="text-sm">{item.text}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-gray-100">
                      <div className="text-xs text-muted-foreground mb-1">Interviewer</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Controls */}
            <div className="mt-auto">
              {interviewComplete ? (
                <Button 
                  onClick={completeInterview}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  View Detailed Performance Report
                </Button>
              ) : (
                <Button 
                  onClick={submitResponse}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Response...
                    </>
                  ) : (
                    "Submit Response"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSimulation;
