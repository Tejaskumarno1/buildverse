
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import StudentDashboardLayout from "@/components/layout/StudentDashboardLayout";
import TestCoordinator from '@/components/testing/TestCoordinator';
import { supabase } from "@/integrations/supabase/client";

const ApplicantTest = () => {
  const { applicationId, jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!applicationId || !jobId) {
      toast({
        title: "Missing Parameters",
        description: "Application ID or Job ID is missing from the URL.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const checkAuthorization = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access this page.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        // Check if the application belongs to the current user
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            candidates!inner(*),
            jobs!inner(*)
          `)
          .eq('id', applicationId)
          .eq('jobs.id', jobId)
          .single();

        if (error || !data) {
          console.error("Error fetching application:", error);
          setAuthorized(false);
          toast({
            title: "Access Denied",
            description: "You are not authorized to view this application.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Check if user is the candidate
        if (data.candidates?.user_profile_id !== user.id) {
          // Check if user is HR for company
          const { data: hrCheck, error: hrError } = await supabase
            .from('hr_members')
            .select('id')
            .eq('user_profile_id', user.id)
            .eq('company_id', data.jobs.company_id)
            .single();

          if (hrError || !hrCheck) {
            setAuthorized(false);
            toast({
              title: "Access Denied",
              description: "You are not authorized to view this application.",
              variant: "destructive"
            });
            navigate('/');
            return;
          }
        }

        setApplicationData(data);
        setAuthorized(true);
      } catch (error) {
        console.error("Error checking authorization:", error);
        toast({
          title: "Error",
          description: "An error occurred while checking access permissions.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [applicationId, jobId, navigate, toast]);

  const handleTestComplete = () => {
    navigate(`/applications/${applicationId}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2">Loading application test...</p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!authorized) {
    return (
      <StudentDashboardLayout>
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Access Denied</h2>
              <p>You are not authorized to view this application test.</p>
              <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Application Assessment</h1>
        </div>

        <TestCoordinator 
          applicationId={applicationId!} 
          jobId={jobId!}
          onComplete={handleTestComplete}
          onCancel={handleCancel}
        />
      </div>
    </StudentDashboardLayout>
  );
};

export default ApplicantTest;
