import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClockIcon, 
  BarChart3Icon, 
  CalendarIcon, 
  TargetIcon, 
  ListTodoIcon, 
  SparklesIcon,
  AlertTriangleIcon,
  ArrowRightIcon
} from "lucide-react";
import { generateQwiXProContent, getCareerSimulatorMockData } from "@/utils/qwixProApi";
import { toast } from "@/components/ui/use-toast";

interface SimulationResult {
  role: string;
  dailyTasks: string[];
  meetings: string[];
  stressFactors: {
    level: number;
    description: string;
    triggers: string[];
  };
  kpis: string[];
  schedule: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  skills: string[];
  challenges: string[];
}

const AIShadowCareerSimulator = () => {
  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const generateSimulation = async () => {
    if (!role) {
      toast({
        title: "Role is required",
        description: "Please enter a job role to simulate",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const prompt = `
        Generate a realistic "day in the life" simulation for the role of "${role}" ${industry ? `in the ${industry} industry` : ''}.
        ${additionalInfo ? `Additional context: ${additionalInfo}` : ''}
        
        Format your response as a JSON object with the following structure:
        {
          "role": "Job title",
          "dailyTasks": ["Task 1", "Task 2", ...],
          "meetings": ["Meeting type 1", "Meeting type 2", ...],
          "stressFactors": {
            "level": (number from 1-10),
            "description": "Brief description of overall stress level",
            "triggers": ["Stress trigger 1", "Stress trigger 2", ...]
          },
          "kpis": ["KPI 1", "KPI 2", ...],
          "schedule": {
            "morning": "Description of morning activities",
            "afternoon": "Description of afternoon activities",
            "evening": "Description of evening activities"
          },
          "skills": ["Skill 1", "Skill 2", ...],
          "challenges": ["Challenge 1", "Challenge 2", ...]
        }
        
        Make it realistic, detailed and insightful to help someone understand what it's really like to work in this role.
      `;

      try {
        // Try to use the API with the career-specific API key
        const response = await generateQwiXProContent(prompt, 'career');
        
        // Extract the JSON object from the response
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                          response.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0].replace(/```json|```/g, '').trim();
          const parsedResult = JSON.parse(cleanedJson);
          setSimulationResult(parsedResult);
        } else {
          throw new Error("Could not parse the simulation result");
        }
      } catch (error) {
        console.error("API call failed, using mock data instead:", error);
        
        // Use mock data as fallback
        toast({
          title: "Using simulation fallback",
          description: "We couldn't connect to our AI service, so we're showing you a simulated example.",
          variant: "default"
        });
        
        // Get mock data and parse it
        const mockDataJson = getCareerSimulatorMockData(role, industry);
        const parsedResult = JSON.parse(mockDataJson);
        setSimulationResult(parsedResult);
      }
    } catch (error) {
      console.error("Error generating simulation:", error);
      toast({
        title: "Error",
        description: "Failed to generate career simulation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StressLevelIndicator = ({ level }: { level: number }) => {
    const getColor = () => {
      if (level <= 3) return "bg-green-500";
      if (level <= 6) return "bg-yellow-500";
      return "bg-red-500";
    };

    return (
      <div className="flex items-center space-x-2 mt-2">
        <div className="text-sm font-medium">{level}/10</div>
        <div className="h-2 w-full bg-gray-200 rounded-full">
          <div 
            className={`h-2 rounded-full ${getColor()}`}
            style={{ width: `${level * 10}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-modern-blue-500 to-soft-purple">
            AI Shadow Career Simulator
          </span>
        </h1>
        <p className="text-gray-600 mb-8">
          Experience "a day in the life" of any job role before committing to a career path
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Simulate a Career</CardTitle>
              <CardDescription>
                Enter a job role to experience what a typical day looks like
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Job Role*
                </label>
                <Input 
                  placeholder="e.g. Product Manager, Game Designer" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Industry (Optional)
                </label>
                <Input 
                  placeholder="e.g. Tech, Healthcare, Finance" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Additional Context (Optional)
                </label>
                <Textarea 
                  placeholder="Any specific aspects you're curious about?" 
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={generateSimulation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">○</span> 
                    Simulating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="mr-2 h-4 w-4" /> 
                    Generate Simulation
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Simulation Results */}
          <div className="md:col-span-2">
            {simulationResult ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>A Day as a {simulationResult.role}</CardTitle>
                  <CardDescription>
                    Here's what a typical day looks like in this role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="schedule">
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="schedule">
                        <ClockIcon className="h-4 w-4 mr-2" /> Daily Schedule
                      </TabsTrigger>
                      <TabsTrigger value="tasks">
                        <ListTodoIcon className="h-4 w-4 mr-2" /> Tasks & Meetings
                      </TabsTrigger>
                      <TabsTrigger value="stress">
                        <AlertTriangleIcon className="h-4 w-4 mr-2" /> Stress Factors
                      </TabsTrigger>
                      <TabsTrigger value="kpis">
                        <TargetIcon className="h-4 w-4 mr-2" /> KPIs & Skills
                      </TabsTrigger>
                    </TabsList>
                  
                    <TabsContent value="schedule" className="space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <CalendarIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Daily Schedule</h3>
                        </div>
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <h4 className="font-medium text-sm">Morning</h4>
                            <p className="text-gray-600 mt-1">{simulationResult.schedule.morning}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm">Afternoon</h4>
                            <p className="text-gray-600 mt-1">{simulationResult.schedule.afternoon}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm">Evening</h4>
                            <p className="text-gray-600 mt-1">{simulationResult.schedule.evening}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <TargetIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Key Challenges</h3>
                        </div>
                        
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {simulationResult.challenges.map((challenge, i) => (
                            <li key={i}>{challenge}</li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tasks" className="space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <ListTodoIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Common Daily Tasks</h3>
                        </div>
                        
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {simulationResult.dailyTasks.map((task, i) => (
                            <li key={i}>{task}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <CalendarIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Typical Meetings</h3>
                        </div>
                        
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {simulationResult.meetings.map((meeting, i) => (
                            <li key={i}>{meeting}</li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stress" className="space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <BarChart3Icon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Stress Level</h3>
                        </div>
                        
                        <StressLevelIndicator level={simulationResult.stressFactors.level} />
                        <p className="text-sm text-gray-600 mt-2">{simulationResult.stressFactors.description}</p>
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-sm">Common Stress Triggers</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mt-1">
                            {simulationResult.stressFactors.triggers.map((trigger, i) => (
                              <li key={i}>{trigger}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="kpis" className="space-y-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <TargetIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Key Performance Indicators</h3>
                        </div>
                        
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {simulationResult.kpis.map((kpi, i) => (
                            <li key={i}>{kpi}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center text-modern-blue-600 mb-2">
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">Required Skills</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {simulationResult.skills.map((skill, i) => (
                            <span 
                              key={i}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <SparklesIcon className="h-12 w-12 mb-4 mx-auto text-gray-400" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Experience Any Career</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Enter a job role to simulate a day in the life and see if it matches your expectations and career goals.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setRole("Product Manager");
                      setIndustry("Tech");
                    }}
                  >
                    Try "Product Manager" <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIShadowCareerSimulator;
