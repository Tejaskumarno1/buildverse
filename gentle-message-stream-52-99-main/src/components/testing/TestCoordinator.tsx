
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Target, Brain, Trophy, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import TypingTest from './TypingTest';
import AIInterview from './AIInterview';
import { supabase } from "@/integrations/supabase/client";

interface TestCoordinatorProps {
  applicationId: string;
  jobId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface JobConfig {
  // Typing test config
  typingTestEnabled: boolean;
  minimumWpm: number;
  minimumAccuracy: number;
  typingTestDuration: number;
  fraudDetectionEnabled: boolean;
  fraudSensitivity: string;
  
  // AI interview config
  totalInterviewQuestions: number;
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
  
  // Job details
  jobTitle: string;
  company: string;
  atsMinimumScore: number;
}

interface CandidateInfo {
  resume: string;
  jobTitle: string;
  experience: string;
  atsScore: number;
}

interface TestPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  required: boolean;
  results?: any;
}

const TestCoordinator: React.FC<TestCoordinatorProps> = ({
  applicationId,
  jobId,
  onComplete,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [jobConfig, setJobConfig] = useState<JobConfig | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('overview');
  const [testPhases, setTestPhases] = useState<TestPhase[]>([]);
  const [overallResults, setOverallResults] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    initializeTest();
  }, [applicationId, jobId]);

  const initializeTest = async () => {
    try {
      // Fetch job configuration
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch application and candidate info
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          candidates (*)
        `)
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Check ATS score requirement
      const candidateAtsScore = applicationData.ai_score || 0;
      if (candidateAtsScore < jobData.ats_minimum_score) {
        toast({
          title: "ATS Score Requirement Not Met",
          description: `Minimum ATS score of ${jobData.ats_minimum_score} required. Current score: ${candidateAtsScore}`,
          variant: "destructive"
        });
        return;
      }

      // Parse question distribution from JSON
      let questionDistribution = {
        coding: 30,
        dsa: 25,
        education: 15,
        achievements: 15,
        problem_solving: 15
      };

      if (jobData.question_distribution) {
        try {
          if (typeof jobData.question_distribution === 'string') {
            questionDistribution = JSON.parse(jobData.question_distribution);
          } else if (typeof jobData.question_distribution === 'object') {
            questionDistribution = jobData.question_distribution as any;
          }
        } catch (e) {
          console.warn('Failed to parse question_distribution, using defaults');
        }
      }

      const config: JobConfig = {
        typingTestEnabled: jobData.typing_test_enabled,
        minimumWpm: jobData.minimum_wpm,
        minimumAccuracy: jobData.minimum_accuracy,
        typingTestDuration: jobData.typing_test_duration,
        fraudDetectionEnabled: jobData.fraud_detection_enabled,
        fraudSensitivity: jobData.fraud_sensitivity,
        totalInterviewQuestions: jobData.total_interview_questions,
        questionDistribution,
        aiModel: jobData.ai_model,
        difficultyLevel: jobData.difficulty_level,
        minimumPassingScore: jobData.minimum_passing_score,
        evaluationStrictness: jobData.evaluation_strictness,
        dynamicQuestionsEnabled: jobData.dynamic_questions_enabled,
        jobTitle: jobData.title,
        company: jobData.company_name || 'Company',
        atsMinimumScore: jobData.ats_minimum_score
      };

      const candidateData: CandidateInfo = {
        resume: applicationData.candidates?.resume_url || '',
        jobTitle: config.jobTitle,
        experience: applicationData.candidates?.experience_years?.toString() || '0',
        atsScore: candidateAtsScore
      };

      setJobConfig(config);
      setCandidateInfo(candidateData);

      // Initialize test phases
      const phases: TestPhase[] = [
        {
          id: 'ats-check',
          name: 'ATS Screening',
          description: 'Resume screening through ATS system',
          status: candidateAtsScore >= config.atsMinimumScore ? 'completed' : 'failed',
          required: true,
          results: { score: candidateAtsScore, required: config.atsMinimumScore }
        }
      ];

      if (config.typingTestEnabled) {
        phases.push({
          id: 'typing-test',
          name: 'Typing Speed Test',
          description: `${config.minimumWpm} WPM at ${config.minimumAccuracy}% accuracy required`,
          status: 'pending',
          required: true
        });
      }

      phases.push({
        id: 'ai-interview',
        name: 'AI Technical Interview',
        description: `${config.totalInterviewQuestions} questions across multiple categories`,
        status: 'pending',
        required: true
      });

      setTestPhases(phases);
      setLoading(false);

    } catch (error) {
      console.error('Error initializing test:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to load test configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startNextPhase = () => {
    const nextPhase = testPhases.find(phase => phase.status === 'pending');
    if (nextPhase) {
      setCurrentPhase(nextPhase.id);
    }
  };

  const handleTypingTestComplete = async (results: any) => {
    // Update phase status
    setTestPhases(prev => prev.map(phase => 
      phase.id === 'typing-test' 
        ? { ...phase, status: results.passed ? 'completed' : 'failed', results }
        : phase
    ));

    if (results.passed) {
      // Move to AI interview if typing test passed
      const nextPhase = testPhases.find(phase => phase.id === 'ai-interview');
      if (nextPhase) {
        setCurrentPhase('overview');
        setTimeout(() => {
          setCurrentPhase(nextPhase.id);
        }, 1000);
      }
    } else {
      // Failed typing test
      setCurrentPhase('overview');
    }
  };

  const handleInterviewComplete = async (results: any) => {
    // Update phase status
    setTestPhases(prev => prev.map(phase => 
      phase.id === 'ai-interview' 
        ? { ...phase, status: results.passed ? 'completed' : 'failed', results }
        : phase
    ));

    setOverallResults({
      applicationId,
      jobId,
      typingTestResults: testPhases.find(p => p.id === 'typing-test')?.results,
      interviewResults: results,
      overallPassed: results.passed
    });

    // Return to overview with complete results
    setCurrentPhase('overview');

    // Update application status
    try {
      const newStatus = results.passed ? 'Under Review' : 'Rejected';
      await supabase
        .from('applications')
        .update({
          status: newStatus,
          ai_score: results.passed ? results.percentageScore : null
        })
        .eq('id', applicationId);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  if (loading || !jobConfig || !candidateInfo) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 animate-pulse text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Loading Test Configuration</h3>
            <p className="text-gray-600">Please wait while we prepare your assessment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentPhase === 'typing-test' && jobConfig.typingTestEnabled) {
    return (
      <TypingTest
        jobId={jobId}
        applicationId={applicationId}
        config={{
          duration: jobConfig.typingTestDuration,
          minimumWpm: jobConfig.minimumWpm,
          minimumAccuracy: jobConfig.minimumAccuracy,
          fraudDetectionEnabled: jobConfig.fraudDetectionEnabled,
          fraudSensitivity: jobConfig.fraudSensitivity
        }}
        onComplete={handleTypingTestComplete}
        onCancel={() => setCurrentPhase('overview')}
      />
    );
  }

  if (currentPhase === 'ai-interview') {
    return (
      <AIInterview
        jobId={jobId}
        applicationId={applicationId}
        config={{
          totalQuestions: jobConfig.totalInterviewQuestions,
          questionDistribution: jobConfig.questionDistribution,
          aiModel: jobConfig.aiModel,
          difficultyLevel: jobConfig.difficultyLevel,
          minimumPassingScore: jobConfig.minimumPassingScore,
          evaluationStrictness: jobConfig.evaluationStrictness,
          dynamicQuestionsEnabled: jobConfig.dynamicQuestionsEnabled
        }}
        candidateInfo={candidateInfo}
        onComplete={handleInterviewComplete}
        onCancel={() => setCurrentPhase('overview')}
      />
    );
  }

  // Default overview
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {overallResults?.overallPassed ? (
            <>
              <Trophy className="h-5 w-5 text-green-600" />
              <span>Assessment Completed Successfully</span>
            </>
          ) : (
            <>
              <Trophy className="h-5 w-5" />
              <span>Application Assessment</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job details */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{jobConfig.jobTitle}</h3>
            <p className="text-gray-600">{jobConfig.company}</p>
          </div>
          <Badge variant={candidateInfo.atsScore >= jobConfig.atsMinimumScore ? 'default' : 'destructive'}>
            ATS Score: {candidateInfo.atsScore}/{jobConfig.atsMinimumScore}
          </Badge>
        </div>

        {candidateInfo.atsScore < jobConfig.atsMinimumScore && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATS Screening Failed</strong>
              <p className="mt-1">
                Your resume did not meet the minimum ATS score requirement for this position.
                Please review your resume and ensure it aligns with the job requirements.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Test phases */}
        <div className="space-y-4">
          <h4 className="font-semibold">Assessment Phases</h4>
          
          <div className="space-y-3">
            {testPhases.map(phase => (
              <div key={phase.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {phase.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />}
                {phase.status === 'failed' && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
                {phase.status === 'pending' && <Clock className="h-5 w-5 text-blue-600 shrink-0" />}
                {phase.status === 'active' && <Clock className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />}
                {phase.status === 'skipped' && <Clock className="h-5 w-5 text-gray-400 shrink-0" />}
                
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <span className="font-medium">{phase.name}</span>
                    <Badge variant={
                      phase.status === 'completed' ? 'default' : 
                      phase.status === 'failed' ? 'destructive' :
                      phase.status === 'active' ? 'default' :
                      phase.status === 'skipped' ? 'outline' : 
                      'secondary'
                    }>
                      {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{phase.description}</p>
                  
                  {/* Results summary */}
                  {phase.results && (
                    <div className="mt-2 text-sm">
                      {phase.id === 'ats-check' && (
                        <span className={phase.results.score >= phase.results.required ? 'text-green-600' : 'text-red-600'}>
                          Score: {phase.results.score}/{phase.results.required} required
                        </span>
                      )}
                      
                      {phase.id === 'typing-test' && (
                        <div className="flex gap-4">
                          <span className={phase.results.wpm >= jobConfig.minimumWpm ? 'text-green-600' : 'text-red-600'}>
                            Speed: {phase.results.wpm} WPM
                          </span>
                          <span className={phase.results.accuracy >= jobConfig.minimumAccuracy ? 'text-green-600' : 'text-red-600'}>
                            Accuracy: {phase.results.accuracy}%
                          </span>
                        </div>
                      )}
                      
                      {phase.id === 'ai-interview' && (
                        <div className="flex gap-4">
                          <span className={phase.results.percentageScore >= jobConfig.minimumPassingScore ? 'text-green-600' : 'text-red-600'}>
                            Score: {phase.results.percentageScore}%
                          </span>
                          <span>
                            Questions: {phase.results.questionsCompleted}/{phase.results.questionsAttempted}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Exit Assessment
          </Button>
          
          {!overallResults && candidateInfo.atsScore >= jobConfig.atsMinimumScore && (
            <Button 
              onClick={startNextPhase}
              disabled={testPhases.every(phase => 
                phase.status !== 'pending' || 
                (phase.id === 'typing-test' && !jobConfig.typingTestEnabled)
              )}
            >
              Start Next Phase
            </Button>
          )}
          
          {overallResults && (
            <Button onClick={onComplete}>
              {overallResults.overallPassed ? 'View Complete Results' : 'Return to Applications'}
            </Button>
          )}
        </div>

        {/* Final results message */}
        {overallResults && (
          <Alert variant={overallResults.overallPassed ? 'default' : 'destructive'}>
            {overallResults.overallPassed ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Assessment Passed!</strong>
                  <p className="mt-1">
                    Congratulations! You have successfully completed all assessment phases.
                    Your application will now proceed to the next stage of the hiring process.
                  </p>
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Assessment Not Passed</strong>
                  <p className="mt-1">
                    Unfortunately, you did not meet the minimum requirements for this position.
                    Please review the feedback provided and consider applying for positions that
                    better match your current skill set.
                  </p>
                </AlertDescription>
              </>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCoordinator;
