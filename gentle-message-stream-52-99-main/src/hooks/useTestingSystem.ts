
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface TestingConfig {
  jobId: string;
  applicationId: string;
}

export interface TestingHookReturn {
  loading: boolean;
  error: string | null;
  jobConfig: any | null;
  applicationData: any | null;
  typingResults: any | null;
  interviewResults: any | null;
  fetchTestConfig: () => Promise<void>;
  saveTypingTestResults: (results: any) => Promise<boolean>;
  saveInterviewResults: (data: any) => Promise<boolean>;
}

export const useTestingSystem = (config: TestingConfig): TestingHookReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [jobConfig, setJobConfig] = useState<any | null>(null);
  const [applicationData, setApplicationData] = useState<any | null>(null);
  const [typingResults, setTypingResults] = useState<any | null>(null);
  const [interviewResults, setInterviewResults] = useState<any | null>(null);

  const fetchTestConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to use the Edge Function
      const response = await fetch(
        `https://ihtqcwysnusiiacmiubw.supabase.co/functions/v1/testing-handler/job-config?job_id=${config.jobId}&application_id=${config.applicationId}`,
        {
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodHFjd3lzbnVzaWlhY21pdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTEyMzAsImV4cCI6MjA2MzEyNzIzMH0.2ceA_H9oL8xttcBrQR4xn1WyH96LtARQf0rmqkdbwvM`,
          },
        }
      );

      if (!response.ok) {
        // Fallback to direct database access if edge function fails
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", config.jobId)
          .single();

        if (jobError) throw new Error(jobError.message);

        const { data: applicationData, error: appError } = await supabase
          .from("applications")
          .select(`*, candidates (*)`)
          .eq("id", config.applicationId)
          .single();

        if (appError) throw new Error(appError.message);

        const { data: typingData } = await supabase
          .from("typing_test_results")
          .select("*")
          .eq("application_id", config.applicationId)
          .eq("job_id", config.jobId)
          .order("created_at", { ascending: false })
          .limit(1);

        const { data: interviewData } = await supabase
          .from("interview_results")
          .select("*")
          .eq("application_id", config.applicationId)
          .eq("job_id", config.jobId)
          .order("created_at", { ascending: false })
          .limit(1);

        setJobConfig(jobData);
        setApplicationData(applicationData);
        setTypingResults(typingData?.[0] || null);
        setInterviewResults(interviewData?.[0] || null);
      } else {
        // Process edge function response
        const data = await response.json();
        setJobConfig(data.job_config);
        setApplicationData(data.application);
        setTypingResults(data.typing_results);
        setInterviewResults(data.interview_results);
      }
    } catch (err: any) {
      console.error('Error fetching test configuration:', err);
      setError(err.message || 'Failed to load test configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveTypingTestResults = async (results: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // First try edge function
      const response = await fetch(
        `https://ihtqcwysnusiiacmiubw.supabase.co/functions/v1/testing-handler/typing-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodHFjd3lzbnVzaWlhY21pdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTEyMzAsImV4cCI6MjA2MzEyNzIzMH0.2ceA_H9oL8xttcBrQR4xn1WyH96LtARQf0rmqkdbwvM`,
          },
          body: JSON.stringify({
            typing_result: results,
            application_id: config.applicationId,
            job_id: config.jobId
          })
        }
      );

      if (!response.ok) {
        // Fallback to direct database insert
        const { error: insertError } = await supabase
          .from("typing_test_results")
          .insert({
            application_id: config.applicationId,
            job_id: config.jobId,
            wpm: results.wpm,
            accuracy: results.accuracy,
            characters_typed: results.charactersTyped,
            errors_made: results.errorsMade,
            corrections_made: results.correctionsCount,
            time_spent: results.timeSpent,
            test_duration: results.testDuration,
            paragraph_used: results.paragraphUsed,
            minimum_wpm_required: results.minimumWpm,
            minimum_accuracy_required: results.minimumAccuracy,
            keystroke_data: results.keystrokeData,
            fraud_score: results.fraudScore,
            fraud_indicators: results.fraudIndicators,
            suspicious_patterns: results.suspiciousPatterns,
            passed: results.passed,
            auto_submitted: results.autoSubmitted,
            user_agent: navigator.userAgent,
            browser_focus_lost_count: results.focusLostCount
          });

        if (insertError) throw new Error(insertError.message);

        if (!results.passed) {
          // Update application status if test failed
          await supabase
            .from("applications")
            .update({
              status: "Rejected",
            })
            .eq("id", config.applicationId);
        }
      }

      // Refresh typing results
      const { data } = await supabase
        .from("typing_test_results")
        .select("*")
        .eq("application_id", config.applicationId)
        .eq("job_id", config.jobId)
        .order("created_at", { ascending: false })
        .limit(1);

      setTypingResults(data?.[0] || null);
      return true;
    } catch (err: any) {
      console.error('Error saving typing test results:', err);
      setError(err.message || 'Failed to save typing test results');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveInterviewResults = async (data: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Try edge function first
      const response = await fetch(
        `https://ihtqcwysnusiiacmiubw.supabase.co/functions/v1/testing-handler/interview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodHFjd3lzbnVzaWlhY21pdWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTEyMzAsImV4cCI6MjA2MzEyNzIzMH0.2ceA_H9oL8xttcBrQR4xn1WyH96LtARQf0rmqkdbwvM`,
          },
          body: JSON.stringify({
            interview_data: data,
            application_id: config.applicationId,
            job_id: config.jobId
          })
        }
      );

      if (!response.ok) {
        // Fallback to direct database operations
        // This would be complex with multiple inserts, so we'll just log the error
        console.error('Edge function failed, direct database fallback would be needed');
        throw new Error('Failed to save interview results. Server returned: ' + await response.text());
      }

      // Refresh interview results
      const { data: refreshedData } = await supabase
        .from("interview_results")
        .select("*")
        .eq("application_id", config.applicationId)
        .eq("job_id", config.jobId)
        .order("created_at", { ascending: false })
        .limit(1);

      setInterviewResults(refreshedData?.[0] || null);
      return true;
    } catch (err: any) {
      console.error('Error saving interview results:', err);
      setError(err.message || 'Failed to save interview results');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    jobConfig,
    applicationData,
    typingResults,
    interviewResults,
    fetchTestConfig,
    saveTypingTestResults,
    saveInterviewResults
  };
};

export default useTestingSystem;
