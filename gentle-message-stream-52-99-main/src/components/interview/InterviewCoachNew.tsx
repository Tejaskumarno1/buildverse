import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Mic, Video, FileText, Loader2, MicOff, Download, BarChart } from "lucide-react";
import InterviewReport from './InterviewReport';

// Mock interview questions based on role and difficulty
const getInterviewQuestions = (role: string, company: string, difficulty: string) => {
  const questions = {
    easy: [
      `Tell me about your experience that's relevant to this ${role} position at ${company}.`,
      `Why are you interested in working at ${company}?`,
      `What skills do you think are most important for a ${role} role?`,
      `Describe a project you're proud of in your previous work.`,
      `How do you handle tight deadlines?`
    ],
    moderate: [
      `Describe a challenging situation you faced as a ${role} and how you resolved it.`,
      `How would you improve our current product/service at ${company}?`,
      `Give an example of how you've used data to drive decisions in your work.`,
      `How do you prioritize tasks when everything seems important?`,
      `What's your approach to working with cross-functional teams?`
    ],
    hard: [
      `Describe a time when you had to navigate significant ambiguity in a ${role} position.`,
      `How would you scale our operations at ${company} while maintaining quality?`,
      `Tell me about a time you failed in your role and what you learned from it.`,
      `How would you implement a major change in process against resistance?`,
      `Walk me through how you would solve [specific technical/complex problem relevant to ${role}].`
    ]
  };
  
  // @ts-ignore - We know these keys exist
  return questions[difficulty] || questions.moderate;
};

// Mock feedback analysis model
const analyzeFeedback = (videoTime: number) => {
  // In a real implementation, this would use computer vision and AI to analyze expression, 
  // voice tone, etc. Here we're using randomized mock data
  const randomScore = (base: number) => Math.min(100, Math.max(0, base + (Math.random() * 20 - 10)));
  
  const baseFeedback = {
    confidence: 65,
    eyeContact: 70,
    voiceClarity: 75,
    tonePacing: 80
  };
  
  // Add some variation over time to simulate real-time analysis
  const timeFactor = Math.sin(videoTime * 0.2) * 10;
  
  return {
    confidence: randomScore(baseFeedback.confidence + timeFactor),
    eyeContact: randomScore(baseFeedback.eyeContact + timeFactor),
    voiceClarity: randomScore(baseFeedback.voiceClarity + timeFactor),
    tonePacing: randomScore(baseFeedback.tonePacing + timeFactor),
    feedback: getFeedbackMessage(videoTime)
  };
};

// Get contextual feedback based on time
const getFeedbackMessage = (time: number) => {
  const messages = [
    "Try to maintain more eye contact with the camera",
    "Good confident posture, keep it up!",
    "Speak a bit louder and more clearly",
    "Great use of examples in your answer",
    "Consider using more specific examples",
    "Try to vary your tone to emphasize key points",
    "Remember to smile occasionally",
    "Good pace, not too fast or too slow",
    "Try to use fewer filler words like 'um' and 'uh'",
    "Excellent structured response"
  ];
  
  // Return a message based on the current time to simulate changing feedback
  return messages[Math.floor(time / 5) % messages.length];
};

type InterviewStep = 'setup' | 'briefing' | 'interview' | 'report';

const InterviewCoachNew: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<InterviewStep>('setup');
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [interviewTime, setInterviewTime] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [videoFeedbackVisible, setVideoFeedbackVisible] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [interviewComplete, setInterviewComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  
  // Handle form submission to start interview preparation
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobRole || !company || !difficulty) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to proceed",
        variant: "destructive"
      });
      return;
    }
    
    const interviewQuestions = getInterviewQuestions(jobRole, company, difficulty);
    setQuestions(interviewQuestions);
    setAnswers(new Array(interviewQuestions.length).fill(''));
    setStep('briefing');
  };
  
  // Start the mock interview
  const startInterview = async () => {
    try {
      // Request user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setStep('interview');
      
      // Start time tracking for the interview
      timerRef.current = window.setInterval(() => {
        setInterviewTime(prevTime => prevTime + 1);
      }, 1000);
      
      // Periodically show feedback popup
      feedbackTimerRef.current = window.setInterval(() => {
        const newFeedback = analyzeFeedback(interviewTime);
        setFeedback(newFeedback);
        setVideoFeedbackVisible(true);
        
        // Hide feedback after 3 seconds
        setTimeout(() => {
          setVideoFeedbackVisible(false);
        }, 3000);
      }, 10000); // Show feedback every 10 seconds
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Camera access failed",
        description: "Please ensure you've granted permission to use your camera and microphone",
        variant: "destructive"
      });
    }
  };
  
  // Toggle camera on/off
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraOn(!cameraOn);
    }
  };
  
  // Toggle microphone on/off
  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicOn(!micOn);
    }
  };
  
  // Start/stop recording the current answer
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      
      // Mock saving the answer
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestionIndex] = "Answer recorded but not transcribed in this demo";
      setAnswers(updatedAnswers);
      
      toast({
        title: "Answer recorded",
        description: "Your response has been saved"
      });
    } else {
      // Start recording
      if (streamRef.current) {
        const mediaRecorder = new MediaRecorder(streamRef.current);
        const chunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          // In a real implementation, we would save this blob or send it to a server for processing
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('Recording stopped, blob created:', blob);
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      }
    }
  };
  
  // Move to the next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of interview
      completeInterview();
    }
  };
  
  // Complete the interview and generate report
  const completeInterview = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
    }
    
    // Stop all media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Generate mock report data
    const mockReportData = {
      jobRole,
      company,
      difficulty,
      duration: interviewTime,
      questions,
      answers,
      scores: {
        confidence: Math.floor(60 + Math.random() * 25),
        eyeContact: Math.floor(55 + Math.random() * 30),
        voiceClarity: Math.floor(65 + Math.random() * 20),
        tonePacing: Math.floor(70 + Math.random() * 20),
        overall: Math.floor(65 + Math.random() * 20)
      },
      improvements: [
        "Maintain more consistent eye contact with the interviewer",
        "Use more specific examples from your past experience",
        "Limit filler words like 'um' and 'uh'",
        "Structure your answers using the STAR method (Situation, Task, Action, Result)",
        "Practice more concise answers for common questions"
      ],
      strengths: [
        "Good overall confidence",
        "Clear articulation of technical concepts",
        "Positive body language",
        "Well-structured responses",
        "Engaging tone of voice"
      ]
    };
    
    setReportData(mockReportData);
    setInterviewComplete(true);
    setStep('report');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (feedbackTimerRef.current) {
        clearInterval(feedbackTimerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Format seconds to minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Interview Coach</h1>
        <p className="text-blue-100">
          Practice and master your interview skills with AI-powered feedback
        </p>
      </div>
      
      {/* Interview Setup */}
      {step === 'setup' && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="text-xl">Interview Setup</CardTitle>
            <CardDescription className="text-blue-100">
              Configure your mock interview settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-role">Job Role</Label>
                <Input 
                  id="job-role"
                  placeholder="Software Engineer, Product Manager, UX Designer..."
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company"
                  placeholder="Google, Amazon, Netflix..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select 
                  value={difficulty} 
                  onValueChange={setDifficulty}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic questions</SelectItem>
                    <SelectItem value="moderate">Moderate - Standard interview</SelectItem>
                    <SelectItem value="hard">Hard - Challenging questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSetupSubmit} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Prepare Interview
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Interview Briefing */}
      {step === 'briefing' && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="text-xl">{jobRole} Interview at {company}</CardTitle>
            <CardDescription className="text-blue-100">
              {difficulty === 'easy' ? 'Introductory' : difficulty === 'hard' ? 'Advanced' : 'Standard'} level interview
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Interview Overview</h3>
              <p className="text-gray-600">
                This mock interview will simulate a real {jobRole} interview at {company}. 
                You'll be asked {questions.length} questions typical for this position.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">What to Expect</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>The video will record your responses for later review</li>
                <li>You'll receive real-time AI feedback on your performance</li>
                <li>A detailed report will be generated after the interview</li>
                <li>Your eye contact, confidence, and voice tone will be analyzed</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800">Tips for Success</h3>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>Ensure your face is well-lit and visible</li>
                <li>Speak clearly and at a moderate pace</li>
                <li>Maintain eye contact with the camera</li>
                <li>Use the STAR method for behavioral questions</li>
                <li>Take a deep breath before answering difficult questions</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-800">Camera and Microphone Access</h3>
              <p className="text-purple-700 text-sm">
                You'll need to allow camera and microphone access when prompted.
                These are used only for the interview simulation and analysis.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('setup')}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Back to Setup
            </Button>
            <Button 
              onClick={startInterview}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Active Interview */}
      {step === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-lg border-0">
              <CardHeader className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{jobRole} Interview</CardTitle>
                    <CardDescription className="text-blue-100">{company} • Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isRecording ? "destructive" : "outline"} className="flex items-center bg-white text-gray-800">
                      {isRecording ? (
                        <>
                          <span className="animate-pulse mr-1 text-red-500">●</span> Recording
                        </>
                      ) : (
                        'Not Recording'
                      )}
                    </Badge>
                    <Badge variant="outline" className="bg-white text-gray-800">{formatTime(interviewTime)}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <div className="relative">
                {/* Video Preview */}
                <video 
                  ref={videoRef}
                  className="w-full h-[400px] bg-black object-cover"
                  muted={!micOn}
                  autoPlay
                  playsInline
                ></video>
                
                {/* Feedback popup */}
                {videoFeedbackVisible && feedback && (
                  <div className="absolute top-4 right-4 bg-white/95 p-3 rounded-lg shadow-lg border border-blue-200 animate-fade-in">
                    <p className="font-medium text-sm mb-2 text-blue-800">Real-time Feedback</p>
                    <div className="space-y-2 w-[250px]">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence</span>
                          <span>{Math.round(feedback.confidence)}%</span>
                        </div>
                        <Progress value={feedback.confidence} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Eye Contact</span>
                          <span>{Math.round(feedback.eyeContact)}%</span>
                        </div>
                        <Progress value={feedback.eyeContact} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Voice Clarity</span>
                          <span>{Math.round(feedback.voiceClarity)}%</span>
                        </div>
                        <Progress value={feedback.voiceClarity} className="h-1" />
                      </div>
                    </div>
                    <p className="text-xs mt-2 text-gray-600">{feedback.feedback}</p>
                  </div>
                )}
                
                {/* Question overlay */}
                <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <p className="text-lg font-medium mb-1">Question {currentQuestionIndex + 1}:</p>
                  <p>{questions[currentQuestionIndex]}</p>
                </div>
                
                {/* Video controls */}
                <div className="absolute top-4 left-4 flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="bg-black/30 hover:bg-black/50 text-white border-0"
                          onClick={toggleCamera}
                        >
                          {cameraOn ? <Camera size={16} /> : <Camera size={16} className="opacity-50" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {cameraOn ? 'Turn camera off' : 'Turn camera on'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="bg-black/30 hover:bg-black/50 text-white border-0"
                          onClick={toggleMicrophone}
                        >
                          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {micOn ? 'Mute microphone' : 'Unmute microphone'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <CardFooter className="p-4 flex justify-between bg-gray-50">
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className={!isRecording ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" : ""}
                >
                  {isRecording ? (
                    <>
                      <span className="mr-2">■</span> Stop Recording
                    </>
                  ) : (
                    <>
                      <span className="mr-2">●</span> Record Answer
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={nextQuestion}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Interview Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Questions</span>
                        <span className="text-sm font-medium text-gray-900">{currentQuestionIndex + 1}/{questions.length}</span>
                      </div>
                      <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="h-2" />
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2 text-gray-900">All Questions:</h4>
                      <ul className="space-y-2">
                        {questions.map((q, index) => (
                          <li 
                            key={index} 
                            className={`text-sm p-2 rounded-md ${index === currentQuestionIndex 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                              : index < currentQuestionIndex 
                                ? 'bg-blue-50 line-through opacity-50 text-gray-500' 
                                : 'text-gray-700'
                            }`}
                          >
                            {index + 1}. {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Live Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {feedback ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Confidence</span>
                          <span className="font-medium text-gray-900">{Math.round(feedback.confidence)}%</span>
                        </div>
                        <Progress value={feedback.confidence} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Eye Contact</span>
                          <span className="font-medium text-gray-900">{Math.round(feedback.eyeContact)}%</span>
                        </div>
                        <Progress value={feedback.eyeContact} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Voice Clarity</span>
                          <span className="font-medium text-gray-900">{Math.round(feedback.voiceClarity)}%</span>
                        </div>
                        <Progress value={feedback.voiceClarity} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Tone & Pacing</span>
                          <span className="font-medium text-gray-900">{Math.round(feedback.tonePacing)}%</span>
                        </div>
                        <Progress value={feedback.tonePacing} className="h-2" />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      Waiting for data...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* Interview Report */}
      {step === 'report' && reportData && (
        <InterviewReport data={reportData} />
      )}
    </div>
  );
};

export default InterviewCoachNew;
