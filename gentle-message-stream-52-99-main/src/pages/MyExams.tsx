
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, Target, Brain, ClipboardCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ExamApplication {
  id: string;
  job_id: string;
  status: string;
  application_date: string;
  ai_score: number;
  job: {
    id: string;
    title: string;
    company_name: string;
    typing_test_enabled: boolean;
    minimum_wpm: number;
    minimum_accuracy: number;
    total_interview_questions: number;
    ats_minimum_score: number;
  };
  typing_test_results?: {
    id: string;
    passed: boolean;
    wpm: number;
    accuracy: number;
    created_at: string;
  }[];
  interview_results?: {
    id: string;
    passed: boolean;
    percentage_score: number;
    created_at: string;
  }[];
}

const MyExams: React.FC = () => {
  const [applications, setApplications] = useState<ExamApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExamApplications();
  }, [user]);

  const fetchExamApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get candidate ID first
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_profile_id', user.id)
        .single();

      if (candidateError || !candidateData) {
        console.error('No candidate profile found');
        return;
      }

      // Fetch applications that are accepted/qualified for exams
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          application_date,
          ai_score,
          jobs!inner (
            id,
            title,
            company_name,
            typing_test_enabled,
            minimum_wpm,
            minimum_accuracy,
            total_interview_questions,
            ats_minimum_score
          ),
          typing_test_results (
            id,
            passed,
            wpm,
            accuracy,
            created_at
          ),
          interview_results (
            id,
            passed,
            percentage_score,
            created_at
          )
        `)
        .eq('candidate_id', candidateData.id)
        .in('status', ['Under Review', 'Shortlisted', 'Assessment Sent', 'Received'])
        .order('application_date', { ascending: false });

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
        toast({
          title: "Error",
          description: "Failed to load exam applications",
          variant: "destructive"
        });
        return;
      }

      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error fetching exam applications:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatus = (application: ExamApplication) => {
    const hasTypingTest = application.job.typing_test_enabled;
    const typingResult = application.typing_test_results?.[0];
    const interviewResult = application.interview_results?.[0];

    // Check ATS qualification
    if (application.ai_score < application.job.ats_minimum_score) {
      return {
        status: 'Not Qualified',
        description: 'ATS score below minimum requirement',
        variant: 'destructive' as const,
        canTakeExam: false
      };
    }

    // If typing test is required
    if (hasTypingTest) {
      if (!typingResult) {
        return {
          status: 'Typing Test Pending',
          description: 'Complete typing speed test to proceed',
          variant: 'default' as const,
          canTakeExam: true
        };
      } else if (!typingResult.passed) {
        return {
          status: 'Typing Test Failed',
          description: 'Did not meet typing requirements',
          variant: 'destructive' as const,
          canTakeExam: false
        };
      }
    }

    // Check interview status
    if (!interviewResult) {
      return {
        status: 'Interview Pending',
        description: 'Complete AI technical interview',
        variant: 'default' as const,
        canTakeExam: true
      };
    } else if (!interviewResult.passed) {
      return {
        status: 'Interview Failed',
        description: 'Did not meet interview requirements',
        variant: 'destructive' as const,
        canTakeExam: false
      };
    }

    return {
      status: 'Completed',
      description: 'All assessments completed successfully',
      variant: 'default' as const,
      canTakeExam: false
    };
  };

  const handleStartExam = (application: ExamApplication) => {
    navigate(`/test/${application.id}/${application.job_id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p className="text-gray-600">Loading your exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Exams & Tests</h1>
        <p className="text-gray-600">Track your assessment progress and take available exams</p>
      </div>

      {applications.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No exams available</strong>
            <p className="mt-1">
              You don't have any applications that are qualified for exams yet. 
              Keep applying to jobs and check back once your applications are reviewed.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => {
            const statusInfo = getApplicationStatus(application);
            
            return (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{application.job.title}</CardTitle>
                      <p className="text-gray-600 mb-3">{application.job.company_name}</p>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Applied: {new Date(application.application_date).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          ATS Score: {application.ai_score}/{application.job.ats_minimum_score}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{statusInfo.description}</p>
                    
                    {/* Test Requirements */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Assessment Requirements
                      </h4>
                      
                      <div className="space-y-2">
                        {application.job.typing_test_enabled && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">
                              Typing Test ({application.job.minimum_wpm} WPM, {application.job.minimum_accuracy}% accuracy)
                            </span>
                            {application.typing_test_results?.[0] ? (
                              <Badge variant={application.typing_test_results[0].passed ? "default" : "destructive"}>
                                {application.typing_test_results[0].passed ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Passed ({application.typing_test_results[0].wpm} WPM)
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </>
                                )}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            AI Technical Interview ({application.job.total_interview_questions} questions)
                          </span>
                          {application.interview_results?.[0] ? (
                            <Badge variant={application.interview_results[0].passed ? "default" : "destructive"}>
                              {application.interview_results[0].passed ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Passed ({application.interview_results[0].percentage_score}%)
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {statusInfo.canTakeExam && (
                      <Button 
                        onClick={() => handleStartExam(application)}
                        className="w-full"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Start Assessment
                      </Button>
                    )}
                    
                    {statusInfo.status === 'Completed' && (
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/my-applications')}
                        className="w-full"
                      >
                        View Application Status
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyExams;
