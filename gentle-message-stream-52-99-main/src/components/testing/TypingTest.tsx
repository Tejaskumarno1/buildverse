
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Target, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface TypingTestProps {
  jobId: string;
  applicationId: string;
  config: {
    duration: number;
    minimumWpm: number;
    minimumAccuracy: number;
    fraudDetectionEnabled: boolean;
    fraudSensitivity: string;
  };
  onComplete: (results: TypingTestResult) => void;
  onCancel: () => void;
}

interface TypingTestResult {
  wpm: number;
  accuracy: number;
  charactersTyped: number;
  errorsMade: number;
  correctionsMade: number;
  timeSpent: number;
  passed: boolean;
  fraudScore: number;
  fraudIndicators: string[];
}

interface KeystrokeData {
  key: string;
  timestamp: number;
  timeBetweenKeystrokes: number;
  isCorrection: boolean;
}

const TEST_PARAGRAPHS = {
  technical: [
    "Software development is a complex process that requires careful planning, systematic approach, and continuous testing. Modern applications must be scalable, maintainable, and secure. Developers use various programming languages, frameworks, and tools to create robust solutions that meet business requirements and user expectations.",
    "Database optimization involves indexing strategies, query performance tuning, and proper schema design. Efficient data structures and algorithms are essential for handling large datasets. Memory management and caching mechanisms significantly impact application performance and user experience in production environments.",
    "Cloud computing platforms provide scalable infrastructure solutions for modern applications. Containerization technologies like Docker and Kubernetes enable efficient deployment and orchestration. Microservices architecture promotes modularity and allows teams to develop and deploy services independently."
  ],
  general: [
    "Professional communication in the workplace requires clarity, conciseness, and appropriate tone. Effective meetings involve clear agendas, active participation, and actionable outcomes. Time management skills help prioritize tasks and meet deadlines while maintaining work-life balance.",
    "Project management methodologies like Agile and Scrum facilitate collaborative development and iterative improvement. Regular feedback loops and stakeholder engagement ensure projects align with business objectives and deliver value to end users.",
    "Customer service excellence involves understanding client needs, providing timely responses, and following up on commitments. Building strong relationships with customers and colleagues creates a positive work environment and drives business success."
  ],
  creative: [
    "Creative writing requires imagination, storytelling skills, and attention to language nuances. Writers must understand their audience, develop compelling characters, and create engaging narratives that resonate with readers across different demographics and cultural backgrounds.",
    "Marketing campaigns combine creative messaging with data-driven insights to reach target audiences effectively. Brand positioning, visual design, and content strategy work together to create memorable experiences that drive customer engagement and loyalty.",
    "Design thinking processes involve empathy, ideation, and prototyping to solve complex problems. User experience research informs design decisions and ensures products meet real user needs while maintaining aesthetic appeal and functional usability."
  ]
};

const TypingTest: React.FC<TypingTestProps> = ({ 
  jobId, 
  applicationId, 
  config, 
  onComplete, 
  onCancel 
}) => {
  const [testState, setTestState] = useState<'ready' | 'active' | 'completed'>('ready');
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(config.duration);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeData[]>([]);
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState({
    wpm: 0,
    accuracy: 100,
    charactersTyped: 0,
    errorsCount: 0,
    correctionsCount: 0
  });
  const [fraudAlerts, setFraudAlerts] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastKeystrokeRef = useRef<number>(0);
  const { toast } = useToast();

  // Initialize test paragraph
  useEffect(() => {
    const category = 'technical'; // Could be determined by job type
    const paragraphs = TEST_PARAGRAPHS[category];
    const randomParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    setCurrentText(randomParagraph);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (testState === 'active' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && testState === 'active') {
      handleTestComplete(true);
    }
  }, [testState, timeRemaining]);

  // Focus detection
  useEffect(() => {
    const handleFocusLoss = () => {
      if (testState === 'active') {
        setFocusLostCount(prev => prev + 1);
        if (config.fraudDetectionEnabled) {
          setFraudAlerts(prev => [...prev, 'Browser focus lost during test']);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && testState === 'active') {
        handleFocusLoss();
      }
    };

    window.addEventListener('blur', handleFocusLoss);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testState, config.fraudDetectionEnabled]);

  // Calculate real-time statistics
  const calculateStats = useCallback((input: string, text: string) => {
    const currentTime = Date.now();
    const timeElapsed = startTime ? (currentTime - startTime) / 1000 / 60 : 0; // minutes
    
    let correctChars = 0;
    let errors = 0;
    
    for (let i = 0; i < Math.min(input.length, text.length); i++) {
      if (input[i] === text[i]) {
        correctChars++;
      } else {
        errors++;
      }
    }
    
    const wpm = timeElapsed > 0 ? Math.round((correctChars / 5) / timeElapsed) : 0;
    const accuracy = input.length > 0 ? Math.round((correctChars / input.length) * 100) : 100;
    
    return {
      wpm,
      accuracy,
      charactersTyped: input.length,
      errorsCount: errors,
      correctionsCount: keystrokeData.filter(k => k.isCorrection).length
    };
  }, [startTime, keystrokeData]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    const currentTime = Date.now();
    
    if (testState === 'ready') {
      startTest();
    }
    
    // Record keystroke data for fraud detection
    if (config.fraudDetectionEnabled) {
      const timeBetweenKeystrokes = lastKeystrokeRef.current ? currentTime - lastKeystrokeRef.current : 0;
      const isCorrection = newInput.length < userInput.length;
      
      // Detect suspicious patterns
      if (timeBetweenKeystrokes < 10 && newInput.length > userInput.length + 5) {
        setFraudAlerts(prev => [...prev, 'Suspicious rapid typing detected']);
      }
      
      setKeystrokeData(prev => [...prev, {
        key: newInput[newInput.length - 1] || 'backspace',
        timestamp: currentTime,
        timeBetweenKeystrokes,
        isCorrection
      }]);
      
      lastKeystrokeRef.current = currentTime;
    }
    
    setUserInput(newInput);
    
    // Update real-time stats
    const stats = calculateStats(newInput, currentText);
    setRealTimeStats(stats);
    
    // Check if test is complete (user typed entire text)
    if (newInput.length >= currentText.length) {
      handleTestComplete(false);
    }
  };

  const startTest = () => {
    setTestState('active');
    setStartTime(Date.now());
    inputRef.current?.focus();
  };

  const handleTestComplete = async (autoSubmitted: boolean) => {
    setTestState('completed');
    
    const finalStats = calculateStats(userInput, currentText);
    const timeSpent = config.duration - timeRemaining;
    
    // Calculate fraud score
    let fraudScore = 0;
    const fraudIndicators: string[] = [];
    
    if (config.fraudDetectionEnabled) {
      // Analyze keystroke patterns
      const avgTimeBetweenKeystrokes = keystrokeData.length > 1 
        ? keystrokeData.slice(1).reduce((sum, k) => sum + k.timeBetweenKeystrokes, 0) / (keystrokeData.length - 1)
        : 0;
      
      if (avgTimeBetweenKeystrokes < 50) {
        fraudScore += 0.3;
        fraudIndicators.push('Unusually fast typing detected');
      }
      
      if (focusLostCount > 2) {
        fraudScore += 0.2;
        fraudIndicators.push('Multiple focus losses during test');
      }
      
      if (fraudAlerts.length > 0) {
        fraudScore += 0.2;
        fraudIndicators.push(...fraudAlerts);
      }
    }
    
    const passed = finalStats.wpm >= config.minimumWpm && 
                   finalStats.accuracy >= config.minimumAccuracy &&
                   fraudScore < 0.7;

    const results: TypingTestResult = {
      wpm: finalStats.wpm,
      accuracy: finalStats.accuracy,
      charactersTyped: finalStats.charactersTyped,
      errorsMade: finalStats.errorsCount,
      correctionsMade: finalStats.correctionsCount,
      timeSpent,
      passed,
      fraudScore: Math.round(fraudScore * 100) / 100,
      fraudIndicators
    };

    // Save results to database
    try {
      await saveTypingTestResults(results, autoSubmitted);
      onComplete(results);
    } catch (error) {
      console.error('Error saving typing test results:', error);
      toast({
        title: "Error",
        description: "Failed to save test results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveTypingTestResults = async (results: TypingTestResult, autoSubmitted: boolean) => {
    // This would be implemented to save to the database
    console.log('Saving typing test results:', {
      applicationId,
      jobId,
      ...results,
      autoSubmitted,
      testDuration: config.duration,
      paragraphUsed: currentText,
      minimumWpmRequired: config.minimumWpm,
      minimumAccuracyRequired: config.minimumAccuracy,
      keystrokeData,
      userAgent: navigator.userAgent,
      browserFocusLostCount: focusLostCount
    });
  };

  const getCharacterStatus = (index: number): 'correct' | 'incorrect' | 'pending' => {
    if (index >= userInput.length) return 'pending';
    return userInput[index] === currentText[index] ? 'correct' : 'incorrect';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (userInput.length / currentText.length) * 100;

  if (testState === 'ready') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Typing Speed Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{config.minimumWpm}</div>
              <div className="text-sm text-blue-700">Minimum WPM Required</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{config.minimumAccuracy}%</div>
              <div className="text-sm text-green-700">Minimum Accuracy Required</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{config.duration}s</div>
              <div className="text-sm text-purple-700">Test Duration</div>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Type the text exactly as shown, including punctuation and capitalization</li>
                <li>• The test will begin as soon as you start typing</li>
                <li>• You can use backspace to correct mistakes</li>
                <li>• Stay focused on this browser tab during the test</li>
                {config.fraudDetectionEnabled && (
                  <li>• Your typing patterns will be monitored for authenticity</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={startTest} size="lg" className="px-8">
              <Zap className="h-4 w-4 mr-2" />
              Start Typing Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Typing Speed Test
          </span>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{realTimeStats.wpm}</div>
            <div className="text-xs text-blue-700">WPM</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{realTimeStats.accuracy}%</div>
            <div className="text-xs text-green-700">Accuracy</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{realTimeStats.charactersTyped}</div>
            <div className="text-xs text-purple-700">Characters</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">{realTimeStats.errorsCount}</div>
            <div className="text-xs text-orange-700">Errors</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Text display */}
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="font-mono text-lg leading-relaxed select-none">
            {currentText.split('').map((char, index) => {
              const status = getCharacterStatus(index);
              return (
                <span
                  key={index}
                  className={`${
                    status === 'correct' ? 'bg-green-200 text-green-800' :
                    status === 'incorrect' ? 'bg-red-200 text-red-800' :
                    index === userInput.length ? 'bg-blue-200 text-blue-800 animate-pulse' :
                    'text-gray-600'
                  }`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Type the text above:
          </label>
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            disabled={testState === 'completed'}
            className="w-full h-32 p-3 border rounded-lg font-mono text-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Start typing here..."
            onContextMenu={(e) => e.preventDefault()} // Disable right-click
          />
        </div>

        {/* Fraud alerts */}
        {config.fraudDetectionEnabled && fraudAlerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Alerts:</strong>
              <ul className="mt-1">
                {fraudAlerts.map((alert, index) => (
                  <li key={index}>• {alert}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Control buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel Test
          </Button>
          
          {testState === 'active' && (
            <Button onClick={() => handleTestComplete(true)} variant="secondary">
              Submit Early
            </Button>
          )}
        </div>

        {/* Results display */}
        {testState === 'completed' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {realTimeStats.wpm >= config.minimumWpm && realTimeStats.accuracy >= config.minimumAccuracy ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                Test {realTimeStats.wpm >= config.minimumWpm && realTimeStats.accuracy >= config.minimumAccuracy ? 'Passed' : 'Failed'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Final WPM</div>
                <div className={realTimeStats.wpm >= config.minimumWpm ? 'text-green-600' : 'text-red-600'}>
                  {realTimeStats.wpm} / {config.minimumWpm} required
                </div>
              </div>
              <div>
                <div className="font-medium">Final Accuracy</div>
                <div className={realTimeStats.accuracy >= config.minimumAccuracy ? 'text-green-600' : 'text-red-600'}>
                  {realTimeStats.accuracy}% / {config.minimumAccuracy}% required
                </div>
              </div>
              <div>
                <div className="font-medium">Time Used</div>
                <div>{formatTime(config.duration - timeRemaining)} / {formatTime(config.duration)}</div>
              </div>
              <div>
                <div className="font-medium">Focus Lost</div>
                <div>{focusLostCount} times</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingTest;
