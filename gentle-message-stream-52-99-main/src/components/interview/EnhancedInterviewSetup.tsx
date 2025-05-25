import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface InterviewFormData {
  resumeText?: string;
  resumeFileName?: string;
  jobLevel?: string;
  duration?: number;
  jobTitle?: string;
  targetCompany?: string;
  difficulty?: string;
  interviewType?: string;
  yearsOfExperience?: string;
  preferredLanguage?: string;
  enableRealTimeFeedback?: boolean;
  includeCompanyResearch?: boolean;
  includeTechnicalQuestions?: boolean;
}

export interface InterviewSettings {
  resumeText: string;
  resumeFileName: string;
  jobLevel: string;
  duration?: number;
  jobTitle: string;
  targetCompany?: string;
  difficulty?: string;
  interviewType?: string;
  yearsOfExperience?: string;
  preferredLanguage?: string;
  enableRealTimeFeedback?: boolean;
  includeCompanyResearch?: boolean;
  includeTechnicalQuestions?: boolean;
}

interface EnhancedInterviewSetupProps {
  onSubmit: (settings: InterviewSettings) => void;
  isLoading: boolean;
}

const formSchema = z.object({
  resumeText: z.string().optional(),
  resumeFileName: z.string().optional(),
  jobLevel: z.string().optional(),
  duration: z.number().min(5).max(60).default(30),
  jobTitle: z.string().optional(),
  targetCompany: z.string().optional(),
  difficulty: z.string().optional(),
  interviewType: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  preferredLanguage: z.string().optional(),
  enableRealTimeFeedback: z.boolean().default(false),
  includeCompanyResearch: z.boolean().default(false),
  includeTechnicalQuestions: z.boolean().default(false),
})

const EnhancedInterviewSetup: React.FC<EnhancedInterviewSetupProps> = ({ onSubmit, isLoading }) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const { toast } = useToast()

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resumeText: "",
      resumeFileName: "Resume.txt",
      jobLevel: "mid",
      duration: 30,
      jobTitle: "Software Engineer",
      targetCompany: "",
      difficulty: "medium",
      interviewType: "mixed",
      yearsOfExperience: "1-3",
      preferredLanguage: "English",
      enableRealTimeFeedback: false,
      includeCompanyResearch: false,
      includeTechnicalQuestions: false
    },
  })

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const handleSubmit = (data: InterviewFormData) => {
    const settings: InterviewSettings = {
      resumeText: data.resumeText || '',
      resumeFileName: data.resumeFileName || 'Resume.txt',
      jobLevel: data.jobLevel || 'mid',
      duration: data.duration || 30,
      jobTitle: data.jobTitle || 'Software Developer',
      targetCompany: data.targetCompany,
      difficulty: data.difficulty || 'medium',
      interviewType: data.interviewType || 'mixed',
      yearsOfExperience: data.yearsOfExperience || '1-3',
      preferredLanguage: data.preferredLanguage,
      enableRealTimeFeedback: data.enableRealTimeFeedback || false,
      includeCompanyResearch: data.includeCompanyResearch || false,
      includeTechnicalQuestions: data.includeTechnicalQuestions || false
    };

    onSubmit(settings);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Interview Setup</CardTitle>
        <CardDescription>Customize your interview settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resumeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your resume text here..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste your resume text to tailor the interview questions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the job level you are interviewing for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Duration (minutes)</FormLabel>
                  <FormControl>
                    <Slider
                      defaultValue={[field.value]}
                      max={60}
                      min={5}
                      step={5}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the duration of the interview.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Start Interview"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EnhancedInterviewSetup;
