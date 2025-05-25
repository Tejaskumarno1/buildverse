
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Code,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Clock,
  List,
  Sparkles,
  FileCode,
  MessageSquare,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize,
  Minimize,
  Download,
  Upload,
  Book,
  Cpu,
  LightbulbIcon,
  Check,
  Layers,
  ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import MainLayout from "@/components/layout/MainLayout";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock function to analyze code
const analyzeCode = async (code: string, language: string, analysisType: string) => {
  try {
    console.log(`Analyzing ${language} code for ${analysisType}`);
    
    const API_KEY = "AIzaSyDRuULswOC1iFSJr83VqRaeP1g8p0Vn4Lc"; // This is a placeholder
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    let prompt = "";
    switch(analysisType) {
      case "quality":
        prompt = `You are a senior code reviewer. Analyze this ${language} code for quality issues:
        
        ${code}
        
        Provide feedback in JSON format:
        {
          "overallQuality": 85, // score from 0-100
          "strengths": ["Strength 1", "Strength 2"],
          "weaknesses": ["Weakness 1", "Weakness 2"],
          "suggestions": ["Suggestion 1", "Suggestion 2"],
          "recommendations": [
            { "line": 5, "message": "Consider using const instead of let", "severity": "minor" }
          ]
        }`;
        break;
        
      case "complexity":
        prompt = `You are an algorithm expert. Analyze this ${language} code for time and space complexity:
        
        ${code}
        
        Provide analysis in JSON format:
        {
          "timeComplexity": {
            "notation": "O(n log n)",
            "explanation": "The sort operation takes n log n time"
          },
          "spaceComplexity": {
            "notation": "O(n)",
            "explanation": "We're creating a new array of size n"
          },
          "criticalSections": [
            { "line": 7, "complexity": "O(n^2)", "suggestion": "Consider using a more efficient algorithm" }
          ],
          "optimizationTips": ["Tip 1", "Tip 2"]
        }`;
        break;
        
      case "bestPractices":
        prompt = `You are a ${language} expert. Analyze this code for adherence to best practices:
        
        ${code}
        
        Provide analysis in JSON format:
        {
          "score": 75,
          "languageSpecificIssues": ["Issue 1", "Issue 2"],
          "securityConcerns": ["Security issue 1"],
          "readabilityIssues": ["Readability issue 1"],
          "suggestions": [
            { "line": 12, "message": "Add proper error handling", "severity": "critical" }
          ],
          "positiveAspects": ["Good aspect 1"]
        }`;
        break;
        
      default:
        prompt = `Analyze this ${language} code and provide general feedback:
        
        ${code}`;
    }
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON portion from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse analysis results");
    
    try {
      // Parse the JSON result
      const analysisResults = JSON.parse(jsonMatch[0]);
      return analysisResults;
    } catch (error) {
      // If JSON parsing fails, return the raw text
      return { 
        rawAnalysis: aiResponse,
        error: "Failed to parse structured response"
      };
    }
  } catch (error) {
    console.error("Error analyzing code:", error);
    throw error;
  }
};

// Function to generate code from prompt
const generateCodeFromPrompt = async (prompt: string, language: string) => {
  try {
    console.log(`Generating ${language} code from prompt:`, prompt);
    
    const API_KEY = "AIzaSyDRuULswOC1iFSJr83VqRaeP1g8p0Vn4Lc"; // This is a placeholder
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const requestPrompt = `You are an expert ${language} programmer. Generate code based on this prompt:
    
    ${prompt}
    
    Provide the response in JSON format with multiple different approaches:
    {
      "approaches": [
        {
          "name": "Approach 1: [Short name]",
          "description": "Brief description of this approach",
          "advantages": ["Advantage 1", "Advantage 2"],
          "disadvantages": ["Disadvantage 1", "Disadvantage 2"],
          "codeExample": "Full code example here",
          "timeComplexity": "O(n)",
          "spaceComplexity": "O(1)",
          "bestUseCase": "When to use this approach"
        },
        {
          "name": "Approach 2: [Short name]",
          "description": "Brief description of this approach",
          "advantages": ["Advantage 1", "Advantage 2"],
          "disadvantages": ["Disadvantage 1", "Disadvantage 2"],
          "codeExample": "Full code example here",
          "timeComplexity": "O(n^2)",
          "spaceComplexity": "O(n)",
          "bestUseCase": "When to use this approach"
        }
      ],
      "explanation": "General explanation about the problem and solution approaches",
      "sampleInputOutput": [
        {"input": "Sample input 1", "output": "Expected output 1"},
        {"input": "Sample input 2", "output": "Expected output 2"}
      ]
    }`;
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: requestPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON portion from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse generated code results");
    
    try {
      // Parse the JSON result
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // If JSON parsing fails, return the raw text
      return { 
        rawResponse: aiResponse,
        error: "Failed to parse structured response"
      };
    }
  } catch (error) {
    console.error("Error generating code:", error);
    throw error;
  }
};

const AICodingCoach = () => {
  const [mode, setMode] = useState<"learn" | "generate">("learn");
  const [code, setCode] = useState(
`// Example: Sorting an array in JavaScript
function bubbleSort(arr) {
  let len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`
  );
  const [language, setLanguage] = useState("javascript");
  const [analysisType, setAnalysisType] = useState("quality");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [codeOutput, setCodeOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCodeResults, setGeneratedCodeResults] = useState<any>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { 
    data: analysisResults, 
    isLoading: isAnalyzing, 
    isError,
    error,
    refetch,
    isSuccess: analysisComplete
  } = useQuery({
    queryKey: ['codeAnalysis', code, language, analysisType],
    queryFn: () => analyzeCode(code, language, analysisType),
    enabled: false, // Don't run automatically
    retry: 1,
  });
  
  const handleAnalyze = () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter code to analyze",
        variant: "destructive"
      });
      return;
    }
    refetch();
  };

  const handleRunCode = () => {
    setIsRunning(true);
    // Simulate code execution with a timeout
    setTimeout(() => {
      try {
        // For JavaScript code, we can try to evaluate it safely
        if (language === "javascript") {
          // Create a sandbox function to evaluate the code
          const sandbox = new Function(`
            try {
              ${code}
              // Test the function if it exists
              if (typeof bubbleSort === 'function') {
                return "Output: " + JSON.stringify(bubbleSort([5, 3, 8, 1, 2, 7]));
              }
              return "Code executed successfully. No output to display.";
            } catch(e) {
              return "Error: " + e.message;
            }
          `);
          
          const result = sandbox();
          setCodeOutput(result);
        } else {
          setCodeOutput(`Code execution for ${language} is simulated.\nNo actual execution environment available in browser.`);
        }
      } catch (error) {
        setCodeOutput(`Error executing code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsRunning(false);
      }
    }, 1000);
  };
  
  const handleExplainCode = () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter code to explain",
        variant: "destructive"
      });
      return;
    }
    
    setIsExplaining(true);
    
    // Simulate AI explanation
    setTimeout(() => {
      const explanationText = `
# Code Explanation

This code implements the Bubble Sort algorithm in JavaScript.

## How it works:
1. The function \`bubbleSort\` takes an array as input
2. It uses two nested loops to compare adjacent elements
3. If an element is greater than the next one, they are swapped
4. This process continues until the array is sorted

## Time Complexity:
- Worst Case: O(n²)
- Average Case: O(n²)
- Best Case: O(n) with optimized implementation

## Space Complexity:
- O(1) - The algorithm sorts in place

## Potential Improvements:
- Add an optimization to break early if no swaps occur in an iteration
- Consider using a more efficient algorithm like Quick Sort or Merge Sort for large datasets
      `;
      
      setExplanation(explanationText);
      setIsExplaining(false);
    }, 1500);
  };

  const handleGenerateCode = () => {
    if (!promptInput.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt describing what you want to build",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingCode(true);
    setSelectedApproach(null);

    generateCodeFromPrompt(promptInput, language)
      .then(results => {
        setGeneratedCodeResults(results);
        setSelectedApproach(0); // Select first approach by default
      })
      .catch(err => {
        toast({
          title: "Error generating code",
          description: err.message || "Unknown error occurred",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsGeneratingCode(false);
      });
  };
  
  const renderQualityAnalysis = () => {
    if (!analysisResults) return null;
    
    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Overall Quality Score</h3>
            <Badge variant={
              analysisResults.overallQuality >= 80 ? "default" :
              analysisResults.overallQuality >= 60 ? "secondary" : "destructive"
            }>
              {analysisResults.overallQuality}/100
            </Badge>
          </div>
          <Progress value={analysisResults.overallQuality} className="h-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.strengths?.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm">{strength}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.weaknesses?.map((weakness: string, idx: number) => (
                  <li key={idx} className="text-sm">{weakness}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Specific Recommendations</h3>
          <div className="space-y-3">
            {analysisResults.recommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <Badge variant={
                    rec.severity === 'critical' ? "destructive" :
                    rec.severity === 'major' ? "secondary" : "outline"
                  } className="mt-0.5">
                    Line {rec.line}
                  </Badge>
                  <p className="text-sm flex-1">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Suggestions for Improvement</h3>
          <ul className="space-y-2 pl-5 list-disc">
            {analysisResults.suggestions?.map((suggestion: string, idx: number) => (
              <li key={idx} className="text-sm">{suggestion}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  const renderComplexityAnalysis = () => {
    if (!analysisResults) return null;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Time Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {analysisResults.timeComplexity?.notation}
                </Badge>
              </div>
              <p className="text-sm">{analysisResults.timeComplexity?.explanation}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="mr-2 h-4 w-4 text-purple-500" />
                Space Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                  {analysisResults.spaceComplexity?.notation}
                </Badge>
              </div>
              <p className="text-sm">{analysisResults.spaceComplexity?.explanation}</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Critical Sections</h3>
          <div className="space-y-3">
            {analysisResults.criticalSections?.map((section: any, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 mt-0.5">
                    Line {section.line}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{section.complexity}</p>
                    <p className="text-sm text-muted-foreground">{section.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Optimization Tips</h3>
          <ul className="space-y-2 pl-5 list-disc">
            {analysisResults.optimizationTips?.map((tip: string, idx: number) => (
              <li key={idx} className="text-sm">{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  
  const renderBestPracticesAnalysis = () => {
    if (!analysisResults) return null;
    
    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Best Practices Score</h3>
            <Badge variant={
              analysisResults.score >= 80 ? "default" :
              analysisResults.score >= 60 ? "secondary" : "destructive"
            }>
              {analysisResults.score}/100
            </Badge>
          </div>
          <Progress value={analysisResults.score} className="h-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Positive Aspects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.positiveAspects?.map((aspect: string, idx: number) => (
                  <li key={idx} className="text-sm">{aspect}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center text-amber-600">
                <List className="mr-2 h-4 w-4" />
                Language-Specific Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.languageSpecificIssues?.map((issue: string, idx: number) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-100">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center text-red-600">
                <AlertCircle className="mr-2 h-4 w-4" />
                Security Concerns
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.securityConcerns?.length > 0 ? 
                  analysisResults.securityConcerns?.map((concern: string, idx: number) => (
                    <li key={idx} className="text-sm">{concern}</li>
                  )) : 
                  <li className="text-sm text-green-600">No security issues detected</li>
                }
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileCode className="mr-2 h-4 w-4" />
                Readability Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {analysisResults.readabilityIssues?.map((issue: string, idx: number) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Specific Suggestions</h3>
          <div className="space-y-3">
            {analysisResults.suggestions?.map((suggestion: any, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-md">
                <div className="flex items-start gap-2">
                  <Badge variant={
                    suggestion.severity === 'critical' ? "destructive" :
                    suggestion.severity === 'major' ? "secondary" : "outline"
                  } className="mt-0.5">
                    Line {suggestion.line}
                  </Badge>
                  <p className="text-sm flex-1">{suggestion.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderAnalysisResults = () => {
    if (!analysisComplete || !analysisResults) return null;
    
    // If we have raw analysis (failed to parse JSON)
    if (analysisResults.rawAnalysis) {
      return (
        <div className="p-4 bg-muted rounded-lg">
          <p className="whitespace-pre-wrap font-mono text-sm">{analysisResults.rawAnalysis}</p>
        </div>
      );
    }
    
    switch(analysisType) {
      case 'quality':
        return renderQualityAnalysis();
      case 'complexity':
        return renderComplexityAnalysis();
      case 'bestPractices':
        return renderBestPracticesAnalysis();
      default:
        return null;
    }
  };

  const renderApproachList = () => {
    if (!generatedCodeResults || !generatedCodeResults.approaches) {
      return null;
    }

    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Available Approaches</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {generatedCodeResults.approaches.map((approach: any, idx: number) => (
            <Card 
              key={idx}
              className={`cursor-pointer transition-all ${selectedApproach === idx ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
              onClick={() => setSelectedApproach(idx)}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{approach.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {approach.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 pb-3 flex justify-between">
                <Badge variant="outline" className="text-xs">
                  {approach.timeComplexity}
                </Badge>
                {selectedApproach === idx && (
                  <Badge variant="default" className="ml-auto">
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedApproach = () => {
    if (!generatedCodeResults || selectedApproach === null) {
      return null;
    }

    const approach = generatedCodeResults.approaches[selectedApproach];
    if (!approach) return null;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">{approach.name}</h2>
          <p className="text-muted-foreground">{approach.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Advantages</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 pl-5 list-disc">
                {approach.advantages.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm">{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Disadvantages</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 pl-5 list-disc">
                {approach.disadvantages.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm">{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileCode className="mr-2 h-4 w-4" />
              Code Example
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{approach.timeComplexity}</Badge>
                <Badge variant="outline">{approach.spaceComplexity}</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => {
                  navigator.clipboard.writeText(approach.codeExample);
                  toast({
                    title: "Code copied",
                    description: "Code has been copied to clipboard",
                  });
                }}
              >
                Copy
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="bg-slate-50 p-3 rounded-md text-sm overflow-auto font-mono whitespace-pre-wrap">
              {approach.codeExample}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Best Use Case</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{approach.bestUseCase}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSampleInputOutput = () => {
    if (!generatedCodeResults || !generatedCodeResults.sampleInputOutput || 
        generatedCodeResults.sampleInputOutput.length === 0) {
      return null;
    }

    return (
      <Card className="mt-6">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium">Sample Input/Output</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {generatedCodeResults.sampleInputOutput.map((sample: any, idx: number) => (
              <div key={idx} className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Input:</p>
                <pre className="bg-slate-100 p-2 rounded-md text-sm mb-2 font-mono">{sample.input}</pre>
                <p className="text-sm font-medium mb-1">Output:</p>
                <pre className="bg-slate-100 p-2 rounded-md text-sm font-mono">{sample.output}</pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className={`container py-6 ${fullScreen ? 'max-w-none px-2' : ''}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Coding Coach</h1>
          <p className="text-muted-foreground">
            Get instant feedback, complexity analysis, and best practices for your code
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant={mode === "learn" ? "default" : "outline"}
              size="lg"
              className="h-20 flex flex-col items-center justify-center gap-1.5"
              onClick={() => setMode("learn")}
            >
              <Book className="h-6 w-6" />
              <span>Learn Coding</span>
              <span className="text-xs opacity-70">Practice, analyze & optimize</span>
            </Button>
            <Button 
              variant={mode === "generate" ? "default" : "outline"}
              size="lg"
              className="h-20 flex flex-col items-center justify-center gap-1.5"
              onClick={() => setMode("generate")}
            >
              <Sparkles className="h-6 w-6" />
              <span>AI Code Generator</span>
              <span className="text-xs opacity-70">Get code from prompts</span>
            </Button>
          </div>
        </div>
        
        {mode === "learn" ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`${sidebarOpen ? 'lg:w-1/3' : 'lg:w-16'} ${fullScreen ? 'hidden' : ''}`}>
              <div className={`border rounded-lg p-4 ${sidebarOpen ? '' : 'hidden lg:block'}`}>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Code Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select what type of feedback you want for your code
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Programming Language</label>
                      <select
                        className="w-full border rounded-md p-2 bg-background"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                        <option value="cpp">C++</option>
                        <option value="go">Go</option>
                        <option value="ruby">Ruby</option>
                        <option value="php">PHP</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Analysis Type</label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={analysisType === "quality" ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setAnalysisType("quality")}
                        >
                          <FileCode className="mr-2 h-4 w-4" />
                          Code Quality
                        </Button>
                        <Button
                          variant={analysisType === "complexity" ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setAnalysisType("complexity")}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Time & Space Complexity
                        </Button>
                        <Button
                          variant={analysisType === "bestPractices" ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => setAnalysisType("bestPractices")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Best Practices
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button className="w-full" onClick={handleAnalyze} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Code
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <Button className="w-full" onClick={handleRunCode} disabled={isRunning} variant="secondary">
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Run Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-2">Code Explanation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask AI to explain the code or generate code based on your prompt
                  </p>
                  
                  <Textarea
                    placeholder="Ask a question about your code or request code generation..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    className="min-h-20 mb-2"
                  />
                  <Button className="w-full" onClick={handleExplainCode} disabled={isExplaining}>
                    {isExplaining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Explain Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className={`${sidebarOpen ? 'lg:w-2/3' : 'lg:flex-1'} ${fullScreen ? 'w-full' : ''}`}>
              <div className="flex flex-col h-full">
                <div className="border rounded-lg mb-4">
                  <div className="flex items-center justify-between border-b p-2 bg-muted/50">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Code Editor</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-7 w-7 hidden lg:flex">
                        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setFullScreen(!fullScreen)} className="h-7 w-7">
                        {fullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" title="Download Code" className="h-7 w-7">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Upload Code" className="h-7 w-7">
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Run Code" className="h-7 w-7" onClick={handleRunCode}>
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-sm min-h-[400px] border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter your code here..."
                    spellCheck={false}
                  />
                </div>
                
                {codeOutput && (
                  <Card className="mb-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Play className="mr-2 h-4 w-4 text-green-600" />
                        Code Output
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-50 p-3 rounded-md text-sm overflow-auto whitespace-pre-wrap">{codeOutput}</pre>
                    </CardContent>
                  </Card>
                )}
                
                {explanation && (
                  <Card className="mb-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                        Code Explanation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap">{explanation}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {isAnalyzing && (
                  <div className="p-6 border rounded-lg mb-4 flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                    <h3 className="text-lg font-medium mb-2">Analyzing Your Code</h3>
                    <p className="text-center text-muted-foreground mb-4">
                      Our AI is evaluating your code for {analysisType === 'quality' ? 'quality issues' : 
                        analysisType === 'complexity' ? 'time and space complexity' : 'best practices'}
                    </p>
                  </div>
                )}
                
                {isError && (
                  <div className="p-4 border border-red-300 bg-red-50 rounded-lg mb-4">
                    <h3 className="font-medium text-red-800 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Error analyzing code
                    </h3>
                    <p className="text-red-600">{(error as Error).message || "Please check your code and try again."}</p>
                  </div>
                )}
                
                {analysisResults && (
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {analysisType === 'quality' ? (
                          <FileCode className="mr-2 h-5 w-5" />
                        ) : analysisType === 'complexity' ? (
                          <BarChart3 className="mr-2 h-5 w-5" />
                        ) : (
                          <CheckCircle className="mr-2 h-5 w-5" />
                        )}
                        {analysisType === 'quality' ? 'Code Quality Analysis' : 
                          analysisType === 'complexity' ? 'Complexity Analysis' : 'Best Practices Analysis'}
                      </CardTitle>
                      <CardDescription>
                        {analysisType === 'quality' ? 'Feedback on code quality, strengths and areas for improvement' :
                          analysisType === 'complexity' ? 'Assessment of algorithmic time and space complexity' :
                          'Evaluation of coding standards and best practices'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderAnalysisResults()}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          // AI Code Generator UI
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>AI Code Generator</CardTitle>
                  <CardDescription>
                    Describe what you want to build, and our AI will generate multiple solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Programming Language</label>
                    <select
                      className="w-full border rounded-md p-2 bg-background"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="csharp">C#</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="ruby">Ruby</option>
                      <option value="php">PHP</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">What would you like to build?</label>
                    <Textarea
                      placeholder="Example: Write a function to find the longest palindromic substring in a given string"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode || !promptInput.trim()}
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Code...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Code
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {/* Example prompts */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Example Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2" 
                    onClick={() => setPromptInput("Create a function to detect if a string is a palindrome")}
                  >
                    <span className="truncate">Create a palindrome detector function</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2" 
                    onClick={() => setPromptInput("Build a binary search algorithm for a sorted array")}
                  >
                    <span className="truncate">Build a binary search algorithm</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2" 
                    onClick={() => setPromptInput("Create a function that converts temperature between Celsius and Fahrenheit")}
                  >
                    <span className="truncate">Temperature conversion function</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:w-2/3">
              {isGeneratingCode ? (
                <div className="p-10 border rounded-lg mb-4 flex flex-col items-center">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium mt-6 mb-2">Generating Code</h3>
                  <p className="text-center text-muted-foreground max-w-md mb-4">
                    Our AI is analyzing your request and creating multiple implementation approaches...
                  </p>
                </div>
              ) : generatedCodeResults ? (
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Solutions</CardTitle>
                      <CardDescription>
                        Here are different approaches to solve your problem
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {generatedCodeResults.explanation && (
                        <div className="mb-6 bg-muted p-4 rounded-md">
                          <h3 className="font-medium mb-2">Problem Overview</h3>
                          <p className="text-sm">{generatedCodeResults.explanation}</p>
                        </div>
                      )}

                      {/* List of approaches */}
                      {renderApproachList()}

                      {/* Selected approach details */}
                      <ScrollArea className="max-h-[600px] pr-4">
                        {renderSelectedApproach()}
                        {renderSampleInputOutput()}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-10 border rounded-lg mb-4 flex flex-col items-center border-dashed">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <LightbulbIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">AI Code Generator</h3>
                  <p className="text-center text-muted-foreground max-w-md mb-4">
                    Describe what you want to build and our AI will generate multiple solution approaches
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline">Multiple approaches</Badge>
                    <Badge variant="outline">Time complexity analysis</Badge>
                    <Badge variant="outline">Space complexity analysis</Badge>
                    <Badge variant="outline">Best practices</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AICodingCoach;
