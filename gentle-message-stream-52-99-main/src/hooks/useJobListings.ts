
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface JobListing {
  id: string;
  title: string;
  company_name: string | null;
  description: string;
  location: string | null;
  salary_range: string | null;
  requirements: string | null;
  job_type: string | null;
  posted_date: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  // Typing test configuration
  typing_test_enabled?: boolean;
  minimum_wpm?: number;
  minimum_accuracy?: number;
  typing_test_duration?: number;
  fraud_detection_enabled?: boolean;
  fraud_sensitivity?: string;
  // AI interview configuration
  total_interview_questions?: number;
  question_distribution?: {
    coding: number;
    dsa: number;
    education: number;
    achievements: number;
    problem_solving: number;
  };
  ai_model?: string;
  difficulty_level?: string;
  minimum_passing_score?: number;
  evaluation_strictness?: string;
  dynamic_questions_enabled?: boolean;
  ats_minimum_score: number;
  company_id: string;
  skills_required?: string[];
  experience_level?: string;
  employment_type?: string;
  department?: string;
  application_deadline?: string;
}

export const useJobListings = () => {
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobListings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching job listings:', error);
        toast({
          title: 'Error fetching job listings',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Transform the data to handle question_distribution JSON parsing
      const transformedData = (data || []).map(job => ({
        ...job,
        question_distribution: typeof job.question_distribution === 'string' 
          ? JSON.parse(job.question_distribution)
          : job.question_distribution || {
              coding: 30,
              dsa: 25,
              education: 15,
              achievements: 15,
              problem_solving: 15
            }
      }));

      setJobListings(transformedData);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobListings();
  }, []);

  return { jobListings, loading, refetch: fetchJobListings };
};
