
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client (with auth context from request)
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    const endpoint = path[1]; // 'testing-handler' is [0], endpoint is [1]

    if (endpoint === "typing-test") {
      return handleTypingTest(req, supabase);
    } else if (endpoint === "interview") {
      return handleInterview(req, supabase);
    } else if (endpoint === "job-config") {
      return handleJobConfig(req, supabase);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleTypingTest(req: Request, supabase) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { typing_result, application_id, job_id } = await req.json();

  // Create admin client for system operations
  const adminSupabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert typing test result
  const { data, error } = await adminSupabase
    .from("typing_test_results")
    .insert({
      application_id,
      job_id,
      wpm: typing_result.wpm,
      accuracy: typing_result.accuracy,
      characters_typed: typing_result.charactersTyped,
      errors_made: typing_result.errorsMade,
      corrections_made: typing_result.correctionsMade,
      time_spent: typing_result.timeSpent,
      test_duration: typing_result.testDuration,
      paragraph_used: typing_result.paragraphUsed,
      minimum_wpm_required: typing_result.minimumWpmRequired,
      minimum_accuracy_required: typing_result.minimumAccuracyRequired,
      keystroke_data: typing_result.keystrokeData,
      fraud_score: typing_result.fraudScore,
      fraud_indicators: typing_result.fraudIndicators,
      suspicious_patterns: typing_result.suspiciousPatterns,
      passed: typing_result.passed,
      auto_submitted: typing_result.autoSubmitted,
      user_agent: typing_result.userAgent,
      browser_focus_lost_count: typing_result.browserFocusLostCount
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error inserting typing test result:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update application status if test failed
  if (!typing_result.passed) {
    const { error: updateError } = await adminSupabase
      .from("applications")
      .update({
        status: "Failed Typing Test",
      })
      .eq("id", application_id);
    
    if (updateError) {
      console.error("Error updating application status:", updateError);
    }
  }

  return new Response(JSON.stringify({ success: true, result_id: data.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleInterview(req: Request, supabase) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { interview_data, application_id, job_id } = await req.json();
  const { questions, answers, evaluations, results } = interview_data;

  // Create admin client for system operations
  const adminSupabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  );

  // Begin transaction to insert questions and results
  try {
    // Insert question data
    const questionPromises = questions.map((question, index) => {
      const answer = answers.find(a => a.questionId === question.id);
      const evaluation = evaluations.find(e => e.questionId === question.id);
      
      return adminSupabase
        .from("interview_questions")
        .insert({
          application_id,
          job_id,
          question_text: question.text,
          question_category: question.category,
          difficulty_level: question.difficulty,
          expected_answer: question.expectedAnswer || null,
          time_limit: question.timeLimit,
          max_score: question.maxScore,
          question_order: index,
          candidate_answer: answer?.answer || null,
          time_spent: answer?.timeSpent || null,
          auto_submitted: answer?.autoSubmitted || false,
          answered_at: answer ? new Date(answer.timestamp).toISOString() : null,
          ai_score: evaluation?.aiScore || null,
          technical_accuracy_score: evaluation?.technicalAccuracy || null,
          problem_solving_score: evaluation?.problemSolving || null,
          communication_score: evaluation?.communication || null,
          time_management_score: evaluation?.timeManagement || null,
          creativity_score: evaluation?.creativity || null,
          ai_feedback: evaluation?.feedback || null,
          improvement_suggestions: evaluation?.improvementSuggestions || null
        });
    });

    await Promise.all(questionPromises);

    // Insert interview result
    const { data: resultData, error: resultError } = await adminSupabase
      .from("interview_results")
      .insert({
        application_id,
        job_id,
        total_score: results.totalScore,
        percentage_score: results.percentageScore,
        questions_attempted: results.questionsAttempted,
        questions_completed: results.questionsCompleted,
        coding_score: results.categoryBreakdown.coding,
        dsa_score: results.categoryBreakdown.dsa,
        education_score: results.categoryBreakdown.education,
        achievements_score: results.categoryBreakdown.achievements,
        problem_solving_score: results.categoryBreakdown.problem_solving,
        total_time_spent: results.timeAnalysis.totalTimeSpent,
        average_time_per_question: results.timeAnalysis.averageTimePerQuestion,
        questions_auto_submitted: results.timeAnalysis.questionsAutoSubmitted,
        passed: results.passed,
        recommendation: results.recommendation,
        next_steps: results.nextSteps
      })
      .select("id")
      .single();

    if (resultError) {
      throw resultError;
    }

    // Update application status based on interview result
    const { error: updateError } = await adminSupabase
      .from("applications")
      .update({
        status: results.passed ? "Passed Interview" : "Failed Interview",
        pipeline_stage: results.passed ? "Technical Assessment" : "Rejected",
        ai_score: results.percentageScore
      })
      .eq("id", application_id);
    
    if (updateError) {
      console.error("Error updating application status:", updateError);
    }

    return new Response(JSON.stringify({ success: true, result_id: resultData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing interview data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleJobConfig(req: Request, supabase) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");
  const applicationId = url.searchParams.get("application_id");

  if (!jobId || !applicationId) {
    return new Response(JSON.stringify({ error: "Missing job_id or application_id parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch job configuration and application data
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      company_name,
      typing_test_enabled,
      minimum_wpm,
      minimum_accuracy,
      typing_test_duration,
      fraud_detection_enabled,
      fraud_sensitivity,
      total_interview_questions,
      question_distribution,
      ai_model,
      difficulty_level,
      minimum_passing_score,
      evaluation_strictness,
      dynamic_questions_enabled,
      ats_minimum_score
    `)
    .eq("id", jobId)
    .single();

  if (jobError) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select(`
      id,
      ai_score,
      candidates (
        id,
        resume_url,
        experience_years
      )
    `)
    .eq("id", applicationId)
    .single();

  if (appError) {
    return new Response(JSON.stringify({ error: "Application not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch existing typing test results if any
  const { data: typingResults } = await supabase
    .from("typing_test_results")
    .select("*")
    .eq("application_id", applicationId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1);

  // Fetch interview results if any
  const { data: interviewResults } = await supabase
    .from("interview_results")
    .select("*")
    .eq("application_id", applicationId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1);

  const response = {
    job_config: job,
    application: application,
    typing_results: typingResults?.length ? typingResults[0] : null,
    interview_results: interviewResults?.length ? interviewResults[0] : null
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
