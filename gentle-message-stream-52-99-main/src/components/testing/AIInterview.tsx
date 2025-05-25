
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Brain, Code, Database, User, Trophy, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AIInterviewProps {
  jobId: string;
  applicationId: string;
  config: {
    totalQuestions: number;
    questionDistribution: {
      coding: number;
      dsa: number;
      education: number;
      achievements: number;
      problem_solving: number;
    };
    aiModel: string;
    difficultyLevel: string;
    minimumPassingScore: number;
    evaluationStrictness: string;
    dynamicQuestionsEnabled: boolean;
  };
  candidateInfo: {
    resume: string;
    jobTitle: string;
    experience: string;
  };
  onComplete: (results: InterviewResults) => void;
  onCancel: () => void;
}

interface Question {
  id: string;
  text: string;
  category: 'coding' | 'dsa' | 'education' | 'achievements' | 'problem_solving';
  difficulty: string;
  timeLimit: number;
  expectedAnswer?: string;
  maxScore: number;
}

interface Answer {
  questionId: string;
  answer: string;
  timeSpent: number;
  autoSubmitted: boolean;
  timestamp: Date;
}

interface QuestionEvaluation {
  questionId: string;
  aiScore: number;
  technicalAccuracy: number;
  problemSolving: number;
  communication: number;
  timeManagement: number;
  creativity: number;
  feedback: string;
  improvementSuggestions: string[];
}

interface InterviewResults {
  totalScore: number;
  percentageScore: number;
  questionsAttempted: number;
  questionsCompleted: number;
  categoryBreakdown: {
    coding: number;
    dsa: number;
    education: number;
    achievements: number;
    problem_solving: number;
  };
  timeAnalysis: {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    questionsAutoSubmitted: number;
  };
  passed: boolean;
  recommendation: string;
  nextSteps: string;
  evaluations: QuestionEvaluation[];
}

const CATEGORY_ICONS = {
  coding: Code,
  dsa: Database,
  education: User,
  achievements: Trophy,
  problem_solving: Lightbulb
};

const CATEGORY_COLORS = {
  coding: 'bg-blue-100 text-blue-800',
  dsa: 'bg-green-100 text-green-800',
  education: 'bg-purple-100 text-purple-800',
  achievements: 'bg-yellow-100 text-yellow-800',
  problem_solving: 'bg-red-100 text-red-800'
};

const AIInterview: React.FC<AIInterviewProps> = ({
  jobId,
  applicationId,
  config,
  candidateInfo,
  onComplete,
  onCancel
}) => {
  const [interviewState, setInterviewState] = useState<'loading' | 'ready' | 'active' | 'completed'>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Generate questions on component mount
  useEffect(() => {
    generateQuestions();
  }, []);

  // Timer for current question
  useEffect(() => {
    if (interviewState === 'active' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && interviewState === 'active') {
      handleAutoSubmit();
    }
  }, [interviewState, timeRemaining]);

  // Auto-save functionality
  useEffect(() => {
    if (interviewState === 'active' && currentAnswer) {
      const autoSaveTimer = setTimeout(() => {
        // Auto-save logic here
        console.log('Auto-saving answer:', currentAnswer);
      }, 30000);
      return () => clearTimeout(autoSaveTimer);
    }
  }, [currentAnswer, interviewState]);

  const generateQuestions = async () => {
    try {
      const generatedQuestions = await generateInterviewQuestions();
      setQuestions(generatedQuestions);
      setInterviewState('ready');
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate interview questions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateInterviewQuestions = async (): Promise<Question[]> => {
    // Mock question generation - in real implementation, this would call AI service
    const mockQuestions: Question[] = [];
    
    const categories = Object.keys(config.questionDistribution) as Array<keyof typeof config.questionDistribution>;
    
    for (const category of categories) {
      const percentage = config.questionDistribution[category];
      const questionCount = Math.round((percentage / 100) * config.totalQuestions);
      
      for (let i = 0; i < questionCount; i++) {
        mockQuestions.push({
          id: `${category}_${i}_${Date.now()}`,
          text: generateMockQuestion(category, config.difficultyLevel),
          category: category as any,
          difficulty: config.difficultyLevel,
          timeLimit: getTimeLimit(category),
          maxScore: 100
        });
      }
    }
    
    return mockQuestions.sort(() => Math.random() - 0.5); // Shuffle questions
  };

  const generateMockQuestion = (category: string, difficulty: string): string => {
    const questionBank = {
      coding: {
        easy: [
          "Write a function to reverse a string without using built-in reverse methods.",
          "Implement a function to check if a number is prime.",
          "Create a function that finds the maximum element in an array."
        ],
        medium: [
          "Implement a function to find the longest palindromic substring in a given string.",
          "Write a program to solve the Two Sum problem efficiently.",
          "Design a simple LRU (Least Recently Used) cache implementation."
        ],
        hard: [
          "Implement a thread-safe singleton pattern with lazy initialization.",
          "Design and implement a distributed rate limiting system.",
          "Write an algorithm to solve the N-Queens problem with optimizations."
        ]
      },
      dsa: {
        easy: [
          "Explain the difference between a stack and a queue with examples.",
          "What is the time complexity of searching in a binary search tree?",
          "Describe how a hash table works and its advantages."
        ],
        medium: [
          "Compare and contrast different sorting algorithms and their use cases.",
          "Explain the concept of dynamic programming with a practical example.",
          "Describe the differences between depth-first and breadth-first search."
        ],
        hard: [
          "Analyze the space-time tradeoffs in various graph algorithms.",
          "Explain advanced tree data structures like Red-Black trees or AVL trees.",
          "Discuss the computational complexity of NP-complete problems."
        ]
      },
      education: {
        easy: [
          "Tell me about your educational background and how it relates to this position.",
          "What was your favorite subject in college and why?",
          "Describe a challenging academic project you completed."
        ],
        medium: [
          "How has your formal education prepared you for real-world software development?",
          "Discuss a concept from your studies that you've applied in practical projects.",
          "What additional learning have you pursued beyond your formal education?"
        ],
        hard: [
          "How do you stay current with evolving technologies beyond formal education?",
          "Critique a limitation in traditional computer science education.",
          "Describe how you would design a curriculum for emerging technologies."
        ]
      },
      achievements: {
        easy: [
          "Tell me about a project you're particularly proud of.",
          "Describe an achievement that demonstrates your technical skills.",
          "What's the most complex problem you've solved in your career?"
        ],
        medium: [
          "Walk me through a project where you had to learn new technologies quickly.",
          "Describe a time when you improved a system's performance significantly.",
          "Tell me about a leadership role you took in a technical project."
        ],
        hard: [
          "Describe the most innovative solution you've architected and implemented.",
          "Tell me about a time you had to make a critical technical decision under pressure.",
          "Discuss a project where you had to balance competing technical constraints."
        ]
      },
      problem_solving: {
        easy: [
          "How do you approach debugging a program that isn't working as expected?",
          "Describe your process for breaking down a complex problem.",
          "What steps do you take when you encounter an unfamiliar technology?"
        ],
        medium: [
          "A critical system is down and customers are affected. Walk me through your response.",
          "How would you handle conflicting requirements from different stakeholders?",
          "Describe how you would optimize a slow-performing database query."
        ],
        hard: [
          "Design a system to handle 1 million concurrent users with minimal latency.",
          "How would you migrate a legacy monolithic application to microservices?",
          "Describe your approach to building a fault-tolerant distributed system."
        ]
      }
    };

    const categoryQuestions = questionBank[category as keyof typeof questionBank];
    const difficultyQuestions = categoryQuestions[difficulty as keyof typeof categoryQuestions] || categoryQuestions.medium;
    return difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];
  };

  const getTimeLimit = (category: string): number => {
    const timeLimits = {
      coding: 900, // 15 minutes
      dsa: 600,    // 10 minutes
      education: 300, // 5 minutes
      achievements: 420, // 7 minutes
      problem_solving: 720 // 12 minutes
    };
    return timeLimits[category as keyof typeof timeLimits] || 600;
  };

  const startInterview = () => {
    setInterviewState('active');
    startQuestion(0);
  };

  const startQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setCurrentAnswer('');
    setQuestionStartTime(Date.now());
    setTimeRemaining(questions[index].timeLimit);
    textareaRef.current?.focus();
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(e.target.value);
  };

  const handleSubmitAnswer = async () => {
    setIsSubmitting(true);
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const answer: Answer = {
      questionId: questions[currentQuestionIndex].id,
      answer: currentAnswer,
      timeSpent,
      autoSubmitted: false,
      timestamp: new Date()
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Move to next question or complete interview
    if (currentQuestionIndex < questions.length - 1) {
      startQuestion(currentQuestionIndex + 1);
    } else {
      await completeInterview([...answers, answer]);
    }
    
    setIsSubmitting(false);
  };

  const handleAutoSubmit = async () => {
    const timeSpent = questions[currentQuestionIndex].timeLimit;
    const answer: Answer = {
      questionId: questions[currentQuestionIndex].id,
      answer: currentAnswer,
      timeSpent,
      autoSubmitted: true,
      timestamp: new Date()
    };
    
    setAnswers(prev => [...prev, answer]);
    
    if (currentQuestionIndex < questions.length - 1) {
      startQuestion(currentQuestionIndex + 1);
    } else {
      await completeInterview([...answers, answer]);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer without submitting
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      const tempAnswer = {
        questionId: questions[currentQuestionIndex].id,
        answer: currentAnswer,
        timeSpent,
        autoSubmitted: false,
        timestamp: new Date()
      };
      
      // Update existing answer or add new one
      setAnswers(prev => {
        const existing = prev.findIndex(a => a.questionId === tempAnswer.questionId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = tempAnswer;
          return updated;
        }
        return [...prev, tempAnswer];
      });
      
      startQuestion(currentQuestionIndex - 1);
      
      // Load previous answer if exists
      const prevAnswer = answers.find(a => a.questionId === questions[currentQuestionIndex - 1].id);
      if (prevAnswer) {
        setCurrentAnswer(prevAnswer.answer);
      }
    }
  };

  const completeInterview = async (finalAnswers: Answer[]) => {
    setInterviewState('completed');
    
    try {
      // Process all answers using AI
      const processedResults = await processAnswers(finalAnswers);
      
      // Calculate results
      const results = calculateResults(finalAnswers, processedResults);
      
      // Save to database
      await saveInterviewResults(results);
      
      onComplete(results);
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: "Failed to process interview results. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const processAnswers = async (answers: Answer[]): Promise<QuestionEvaluation[]> => {
    // Mock AI processing - in real implementation, this would call AI service
    return answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId)!;
      
      // Mock scoring based on answer length and question difficulty
      const baseScore = Math.min(90, Math.max(30, answer.answer.length / 10));
      const timeBonus = answer.timeSpent < question.timeLimit * 0.5 ? 10 : 0;
      const aiScore = Math.min(100, baseScore + timeBonus);
      
      return {
        questionId: answer.questionId,
        aiScore,
        technicalAccuracy: aiScore * 0.9,
        problemSolving: aiScore * 0.8,
        communication: aiScore * 0.85,
        timeManagement: answer.timeSpent < question.timeLimit ? 90 : 60,
        creativity: Math.random() * 40 + 60, // Random for demo
        feedback: generateMockFeedback(question, answer, aiScore),
        improvementSuggestions: generateMockSuggestions(question.category)
      };
    });
  };

  const generateMockFeedback = (question: Question, answer: Answer, score: number): string => {
    if (score >= 80) {
      return "Excellent response! You demonstrated strong understanding and provided a comprehensive answer with good technical depth.";
    } else if (score >= 60) {
      return "Good response with room for improvement. Consider providing more specific examples and diving deeper into technical details.";
    } else {
      return "Your response shows basic understanding but lacks detail. Try to elaborate more on your thought process and provide concrete examples.";
    }
  };

  const generateMockSuggestions = (category: string): string[] => {
    const suggestions = {
      coding: [
        "Practice explaining your code step-by-step",
        "Consider edge cases and error handling",
        "Discuss time and space complexity"
      ],
      dsa: [
        "Review fundamental data structures",
        "Practice algorithm analysis",
        "Study common optimization techniques"
      ],
      education: [
        "Connect academic concepts to practical applications",
        "Highlight relevant coursework",
        "Discuss continuous learning initiatives"
      ],
      achievements: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Quantify your impact with specific metrics",
        "Highlight leadership and collaboration skills"
      ],
      problem_solving: [
        "Break down complex problems systematically",
        "Consider multiple solution approaches",
        "Discuss trade-offs and decision criteria"
      ]
    };
    
    return suggestions[category as keyof typeof suggestions] || suggestions.problem_solving;
  };

  const calculateResults = (answers: Answer[], processedResults: QuestionEvaluation[]): InterviewResults => {
    const totalScore = processedResults.reduce((sum, result) => sum + result.aiScore, 0);
    const averageScore = totalScore / processedResults.length;
    const percentageScore = Math.round(averageScore);
    
    const categoryBreakdown = {
      coding: 0,
      dsa: 0,
      education: 0,
      achievements: 0,
      problem_solving: 0
    };
    
    // Calculate category averages
    Object.keys(categoryBreakdown).forEach(category => {
      const categoryResults = processedResults.filter(result => {
        const question = questions.find(q => q.id === result.questionId);
        return question?.category === category;
      });
      
      if (categoryResults.length > 0) {
        const categoryAverage = categoryResults.reduce((sum, result) => sum + result.aiScore, 0) / categoryResults.length;
        categoryBreakdown[category as keyof typeof categoryBreakdown] = Math.round(categoryAverage);
      }
    });
    
    const totalTimeSpent = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
    const questionsAutoSubmitted = answers.filter(answer => answer.autoSubmitted).length;
    
    const passed = percentageScore >= config.minimumPassingScore;
    
    return {
      totalScore: Math.round(totalScore),
      percentageScore,
      questionsAttempted: answers.length,
      questionsCompleted: answers.filter(a => a.answer.trim().length > 0).length,
      categoryBreakdown,
      timeAnalysis: {
        totalTimeSpent,
        averageTimePerQuestion: Math.round(totalTimeSpent / answers.length),
        questionsAutoSubmitted
      },
      passed,
      recommendation: passed ? 
        "Candidate demonstrates strong technical capabilities and problem-solving skills. Recommended for next interview round." :
        "Candidate shows potential but may need additional preparation. Consider providing feedback and scheduling a follow-up assessment.",
      nextSteps: passed ?
        "Schedule technical panel interview with senior team members." :
        "Provide detailed feedback and offer study resources for improvement areas.",
      evaluations: processedResults
    };
  };

  const saveInterviewResults = async (results: InterviewResults) => {
    // Implementation to save results to database
    console.log('Saving interview results:', {
      applicationId,
      jobId,
      results
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (interviewState === 'loading') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Generating Interview Questions</h3>
            <p className="text-gray-600">Our AI is creating personalized questions based on your profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (interviewState === 'ready') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Technical Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{config.totalQuestions}</div>
              <div className="text-sm text-blue-700">Total Questions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{config.minimumPassingScore}%</div>
              <div className="text-sm text-green-700">Passing Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{config.difficultyLevel}</div>
              <div className="text-sm text-purple-700">Difficulty Level</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Question Distribution:</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(config.questionDistribution).map(([category, percentage]) => {
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                return (
                  <Badge key={category} variant="outline" className={`p-2 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`}>
                    <Icon className="h-4 w-4 mr-1" />
                    {category}: {percentage}%
                  </Badge>
                );
              })}
            </div>
          </div>

          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>Interview Guidelines:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Answer questions thoroughly with specific examples</li>
                <li>• You can navigate between questions during the interview</li>
                <li>• Each question has a time limit - manage your time wisely</li>
                <li>• Your responses will be processed by AI for technical accuracy and communication</li>
                <li>• Take your time to provide thoughtful, detailed answers</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={startInterview} size="lg" className="px-8">
              <Brain className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  const CategoryIcon = CATEGORY_ICONS[currentQuestion.category];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span>AI Technical Interview</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[currentQuestion.category]}>
              <CategoryIcon className="h-4 w-4 mr-1" />
              {currentQuestion.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            <Badge variant="outline">{formatTime(currentQuestion.timeLimit)} limit</Badge>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
          </div>
        </div>

        {/* Answer input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Your Answer:
          </label>
          <Textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={handleAnswerChange}
            placeholder="Type your detailed answer here..."
            className="min-h-[200px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{currentAnswer.length} characters</span>
            <span>Auto-save every 30 seconds</span>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              End Interview
            </Button>
          </div>

          <div className="flex gap-2">
            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Next Question'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Complete Interview'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="grid grid-cols-5 gap-1">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded ${
                index < currentQuestionIndex ? 'bg-green-500' :
                index === currentQuestionIndex ? 'bg-blue-500' :
                'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInterview;
