
// Original utility function to ensure arrays have length
export function ensureArrayHasLength<T>(arr: T[] | null | undefined): T[] {
  return arr || [];
}

// Speech synthesis utilities
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!text || typeof window === 'undefined') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  if (onStart) {
    utterance.onstart = onStart;
  }
  
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Start speaking
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
}

// Speech recognition utilities
export function initSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  
  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn("Speech recognition not supported in this browser");
    return null;
  }
  
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  return recognition;
}

// Speech analysis utilities
interface SpeechAnalysisResult {
  toneScore: number; // 0-100 confidence score
  paceScore: number; // 0-100 speaking pace score
  fillerWordCount: number;
  fillerWords: string[];
  keywordsDetected: string[];
}

export function analyzeSpeech(text: string): SpeechAnalysisResult {
  // Simple analysis for demonstration purposes
  // In a real implementation, this would use more sophisticated algorithms
  
  // Check for filler words
  const fillerWordsToCheck = ["um", "uh", "like", "you know", "actually", "basically", "literally"];
  const textLower = text.toLowerCase();
  const fillerWords: string[] = [];
  let fillerWordCount = 0;
  
  fillerWordsToCheck.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      fillerWords.push(word);
      fillerWordCount += count;
    }
  });
  
  // Calculate tone score
  // This is a very simple heuristic - a real implementation would use NLP
  let toneScore = 80; // Default confident score
  
  if (fillerWordCount > 10) {
    toneScore -= 25;
  } else if (fillerWordCount > 5) {
    toneScore -= 15;
  } else if (fillerWordCount > 2) {
    toneScore -= 5;
  }
  
  // Check for hesitant language
  const hesitantPhrases = ["i think", "i guess", "sort of", "kind of"];
  let hesitationCount = 0;
  
  hesitantPhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = textLower.match(regex);
    hesitationCount += matches ? matches.length : 0;
  });
  
  if (hesitationCount > 3) {
    toneScore -= 15;
  } else if (hesitationCount > 0) {
    toneScore -= 5;
  }
  
  // Pace score (word count relative to ideal)
  const wordCount = text.split(/\s+/).length;
  const speakingTimeEstimate = wordCount / 2.5; // Assuming 150 words per minute (2.5 words per second)
  
  // Ideal length - simulate an ideal response
  const idealLength = 30; // seconds
  const paceScore = 100 - Math.abs(speakingTimeEstimate - idealLength) * 1.5;
  
  // Ensure scores are within bounds
  const boundedToneScore = Math.max(0, Math.min(100, toneScore));
  const boundedPaceScore = Math.max(0, Math.min(100, paceScore));
  
  // Detect keywords (very simplistic approach)
  const keywordMatches = text.match(/\b(experience|skills|project|team|leadership|problem|solution|challenge|success|learn)\b/gi);
  const keywordsDetected = keywordMatches ? [...new Set(keywordMatches.map(k => k.toLowerCase()))] : [];
  
  return {
    toneScore: boundedToneScore,
    paceScore: boundedPaceScore,
    fillerWordCount,
    fillerWords,
    keywordsDetected
  };
}
