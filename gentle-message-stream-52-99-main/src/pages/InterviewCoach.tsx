
import React from 'react';
import InterviewCoachNew from '@/components/interview/InterviewCoachNew';
import StudentDashboardLayout from '@/components/layout/StudentDashboardLayout';

const InterviewCoach: React.FC = () => {
  return (
    <StudentDashboardLayout>
      <InterviewCoachNew />
    </StudentDashboardLayout>
  );
};

export default InterviewCoach;
