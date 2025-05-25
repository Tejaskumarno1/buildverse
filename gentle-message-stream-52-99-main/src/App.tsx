import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layout components
import StudentDashboardLayout from "@/components/layout/StudentDashboardLayout";

// Public pages
import Index from "@/pages/Index";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import Everyone from "@/pages/Everyone";
import Unauthorized from "@/pages/Unauthorized";

// Auth pages
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";

// Student pages
import StudentHome from "@/pages/StudentHome";
import ApplyJobs from "@/pages/ApplyJobs";
import MyApplications from "@/pages/MyApplications";
import MyExams from "@/pages/MyExams";
import MyAnalytics from "@/pages/MyAnalytics";
import ResumeBuilder from "@/pages/ResumeBuilder";
import ATSScanner from "@/pages/ATSScanner";
import LinkedInOptimizer from "@/pages/LinkedInOptimizer";
import ResumeCompare from "@/pages/ResumeCompare";
import CareerPathSimulator from "@/pages/CareerPathSimulator";
import InterviewCoach from "@/pages/InterviewCoach";
import JobBoard from "@/pages/JobBoard";
import AIJobSwitchPlanner from "@/pages/AIJobSwitchPlanner";
import AIShadowCareerSimulator from "@/pages/AIShadowCareerSimulator";
import AILayoffReadinessToolkit from "@/pages/AILayoffReadinessToolkit";
import AICodingCoach from "@/pages/AICodingCoach";
import QwiXProBuilder from "@/pages/QwiXProBuilder";
import SkillGapAnalysis from "@/pages/SkillGapAnalysis";
import MindprintAssessment from "@/pages/MindprintAssessment";
import CertificationCenter from "@/pages/CertificationCenter";
import BlockchainVault from "@/pages/BlockchainVault";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";

// Test page
import ApplicantTest from "@/pages/ApplicantTest";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/everyone" element={<Everyone />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Protected Student Routes */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route element={<StudentDashboardLayout />}>
                    <Route path="/student-home" element={<StudentHome />} />
                    <Route path="/apply" element={<ApplyJobs />} />
                    <Route path="/my-applications" element={<MyApplications />} />
                    <Route path="/my-exams" element={<MyExams />} />
                    <Route path="/analytics" element={<MyAnalytics />} />
                    <Route path="/builder" element={<ResumeBuilder />} />
                    <Route path="/ats-scanner" element={<ATSScanner />} />
                    <Route path="/linkedin-optimizer" element={<LinkedInOptimizer />} />
                    <Route path="/resume-compare" element={<ResumeCompare />} />
                    <Route path="/career-path-simulator" element={<CareerPathSimulator />} />
                    <Route path="/interview-coach" element={<InterviewCoach />} />
                    <Route path="/job-board" element={<JobBoard />} />
                    <Route path="/ai-job-switch-planner" element={<AIJobSwitchPlanner />} />
                    <Route path="/ai-shadow-career-simulator" element={<AIShadowCareerSimulator />} />
                    <Route path="/ai-layoff-readiness-toolkit" element={<AILayoffReadinessToolkit />} />
                    <Route path="/ai-coding-coach" element={<AICodingCoach />} />
                    <Route path="/qwixpro-builder" element={<QwiXProBuilder />} />
                    <Route path="/skill-gap-analysis" element={<SkillGapAnalysis />} />
                    <Route path="/mindprint-assessment" element={<MindprintAssessment />} />
                    <Route path="/certification-center" element={<CertificationCenter />} />
                    <Route path="/blockchain-vault" element={<BlockchainVault />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                </Route>
                
                {/* Test Route (accessible to students) */}
                <Route path="/test/:applicationId/:jobId" element={<ApplicantTest />} />
                
                {/* Add other existing routes here... */}
              </Routes>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
