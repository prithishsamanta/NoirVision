"""
Backboard.io integration for NoirVision.
Uses Backboard API to orchestrate LLM analysis for claim verification.
"""
import os
import json
import asyncio
from typing import Dict, Any, List
from backboard import BackboardClient
from app.models import (
    WitnessClaim, 
    VideoAnalysis, 
    ComparisonResult, 
    CredibilityReport
)


class BackboardAnalyzer:
    """
    Uses Backboard.io to orchestrate LLM analysis with real API calls.
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("BACKBOARD_API_KEY")
        if not self.api_key:
            raise ValueError("BACKBOARD_API_KEY not found in environment")
        
        # Initialize Backboard client
        self.client = BackboardClient(api_key=self.api_key)
        # Don't store assistant/thread at class level - create fresh for each request
    
    async def _ensure_assistant(self):
        """Create a new assistant for this analysis."""
        assistant = await self.client.create_assistant(
            name="NoirVision Claim Analyzer",
            description="Forensic video analysis assistant that compares witness claims with video evidence"
        )
        return assistant
    
    async def _create_thread(self, assistant_id: str):
        """Create a new conversation thread."""
        thread = await self.client.create_thread(assistant_id)
        return thread
    
    async def _send_message(self, thread_id: str, content: str, model: str = "gpt-4o-mini") -> str:
        """Send a message and get response."""
        try:
            response = await self.client.add_message(
                thread_id=thread_id,
                content=content,
                llm_provider="openai",
                model_name=model,
                stream=False
            )
            
            # Extract content from MessageResponse
            return response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            print(f"Error in _send_message: {type(e).__name__}: {str(e)}")
            raise
    
    async def analyze_claim_vs_video(
        self, 
        claim: WitnessClaim, 
        video_analysis: VideoAnalysis
    ) -> CredibilityReport:
        """
        Main analysis function using Backboard.io to coordinate LLMs.
        
        Args:
            claim: Witness claim/statement
            video_analysis: Video analysis data (from TwelveLabs or mock)
            
        Returns:
            Complete credibility report
        """
        return await self._analyze_async(claim, video_analysis)
    
    async def _analyze_async(
        self,
        claim: WitnessClaim,
        video_analysis: VideoAnalysis
    ) -> CredibilityReport:
        """Async version of analysis."""
        
        # Create fresh assistant and thread for this analysis
        assistant = await self._ensure_assistant()
        thread = await self._create_thread(assistant.assistant_id)
        
        try:
            # Step 1: Parse claim into structured facts using Backboard
            structured_claim = await self._parse_claim(thread.thread_id, claim.claim_text)
            
            # Step 2: Compare claim facts with video detections using Backboard
            comparisons = await self._compare_claim_with_video(
                thread.thread_id,
                structured_claim, 
                video_analysis,
                claim.claim_text
            )
            
            # Step 3: Calculate credibility score
            credibility_score = self._calculate_credibility_score(comparisons)
            
            # Step 4: Generate verdict
            verdict = self._generate_verdict(credibility_score, comparisons)
            
            # Step 5: Generate recommendations using Backboard
            recommendation = await self._generate_recommendation(
                thread.thread_id,
                verdict, 
                comparisons, 
                credibility_score
            )
            
            # Step 6: Generate evidence summary
            evidence_summary = self._generate_evidence_summary(
                structured_claim, 
                video_analysis, 
                comparisons
            )
            
            # Step 7: Generate noir detective note using Backboard
            detective_note = await self._generate_detective_note(thread.thread_id, verdict, comparisons)
            
            # Step 8: Generate case title using Backboard
            case_title = await self._generate_case_title(thread.thread_id, claim.claim_text, verdict)
            
            # Generate case ID if not provided
            case_id = claim.case_id or self._generate_case_id()
            
            report = CredibilityReport(
                case_id=case_id,
                case_title=case_title,
                witness_claim=claim.claim_text,
                video_analysis=video_analysis,
                comparisons=comparisons,
                credibility_score=credibility_score,
                verdict=verdict,
                recommendation=recommendation,
                evidence_summary=evidence_summary,
                detective_note=detective_note
            )
            
            return report
            
        finally:
            # Cleanup (don't fail if cleanup errors)
            try:
                await self.client.delete_thread(thread.thread_id)
                await self.client.delete_assistant(assistant.assistant_id)
            except Exception as cleanup_error:
                print(f"Warning: Cleanup failed (non-critical): {cleanup_error}")
    
    async def _parse_claim(self, thread_id: str, claim_text: str) -> Dict[str, Any]:
        """
        Use Backboard LLM to parse claim into structured facts.
        """
        prompt = f"""Analyze this witness statement and extract structured facts.
Return ONLY a valid JSON object with these exact keys: time, location, suspect_description, weapon, events.

For "events", provide a list of key actions in sequence.

Statement: "{claim_text}"

Return format:
{{
  "time": "extracted time",
  "location": "extracted location",
  "suspect_description": "physical description",
  "weapon": "weapon type or none",
  "events": ["event1", "event2", ...]
}}"""
        
        response = await self._send_message(thread_id, prompt)
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback: parse manually if JSON extraction fails
        return {
            "time": "unknown",
            "location": "unknown",
            "suspect_description": "unknown",
            "weapon": "none",
            "events": []
        }
    
    async def _compare_claim_with_video(
        self,
        thread_id: str,
        structured_claim: Dict[str, Any], 
        video_analysis: VideoAnalysis,
        original_claim: str
    ) -> List[ComparisonResult]:
        """
        Use Backboard to compare structured claim with video detections.
        """
        # Prepare video evidence summary
        video_summary = f"""Video Source: {video_analysis.source}
Duration: {video_analysis.duration}

Detections:
"""
        for detection in video_analysis.detections:
            video_summary += f"- {detection.timestamp}: {detection.description}\n"
            if detection.objects:
                video_summary += f"  Objects: {', '.join(detection.objects)}\n"
        
        if video_analysis.on_screen_text:
            video_summary += f"\nOn-screen text: {video_analysis.on_screen_text}\n"
        
        if video_analysis.gps_metadata:
            video_summary += f"GPS: {video_analysis.gps_metadata}\n"
        
        if video_analysis.speech_transcription:
            video_summary += "\nSpeech transcription:\n"
            for speech in video_analysis.speech_transcription:
                video_summary += f"- {speech.get('speaker', 'Unknown')}: {speech.get('text', '')}\n"
        
        # Ask Backboard to compare
        prompt = f"""You are a forensic analyst comparing a witness claim with video evidence.

WITNESS CLAIM:
{original_claim}

STRUCTURED CLAIM FACTS:
- Time: {structured_claim.get('time')}
- Location: {structured_claim.get('location')}
- Suspect: {structured_claim.get('suspect_description')}
- Weapon: {structured_claim.get('weapon')}
- Events: {', '.join(structured_claim.get('events', []))}

VIDEO EVIDENCE:
{video_summary}

Analyze each aspect and return ONLY a JSON array with this exact format:
[
  {{"category": "Time Match", "match": true/false, "explanation": "brief explanation"}},
  {{"category": "Location Match", "match": true/false, "explanation": "brief explanation"}},
  {{"category": "Suspect Description", "match": true/false, "explanation": "brief explanation"}},
  {{"category": "Weapon Match", "match": true/false, "explanation": "brief explanation"}},
  {{"category": "Event Sequence", "match": true/false, "explanation": "brief explanation"}}
]

Be strict. Mark as true ONLY if video clearly supports the claim."""
        
        response = await self._send_message(thread_id, prompt, model="gpt-4o-mini")
        
        # Parse response
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                comparison_data = json.loads(json_str)
                return [ComparisonResult(**item) for item in comparison_data]
        except Exception as e:
            print(f"Error parsing comparison: {e}")
        
        # Fallback: return default comparisons
        return [
            ComparisonResult(category="Time Match", match=False, explanation="Unable to compare"),
            ComparisonResult(category="Location Match", match=False, explanation="Unable to compare"),
            ComparisonResult(category="Suspect Description", match=False, explanation="Unable to compare"),
            ComparisonResult(category="Weapon Match", match=False, explanation="Unable to compare"),
            ComparisonResult(category="Event Sequence", match=False, explanation="Unable to compare")
        ]
    
    def _calculate_credibility_score(self, comparisons: List[ComparisonResult]) -> int:
        """Calculate credibility score based on comparisons."""
        if not comparisons:
            return 50
        
        matches = sum(1 for c in comparisons if c.match)
        return int((matches / len(comparisons)) * 100)
    
    def _generate_verdict(
        self, 
        credibility_score: int, 
        comparisons: List[ComparisonResult]
    ) -> str:
        """Generate verdict based on score and comparisons."""
        if credibility_score >= 80:
            return "CLAIM SUPPORTED"
        elif credibility_score >= 60:
            return "CLAIM SUPPORTED (with minor discrepancy)"
        elif credibility_score >= 40:
            return "INCONCLUSIVE"
        else:
            return "CLAIM CONTRADICTED – LIKELY FALSE REPORT"
    
    async def _generate_recommendation(
        self,
        thread_id: str,
        verdict: str, 
        comparisons: List[ComparisonResult],
        score: int
    ) -> str:
        """Generate investigation recommendation using Backboard."""
        
        comparison_summary = "\n".join([
            f"- {c.category}: {'Match' if c.match else 'Mismatch'} - {c.explanation}"
            for c in comparisons
        ])
        
        prompt = f"""You are a detective making an investigation recommendation.

Verdict: {verdict}
Credibility Score: {score}/100

Comparison Results:
{comparison_summary}

Write a brief recommendation (1-3 lines) for investigators on whether to proceed.
Start with "→" and be direct. Mention any key discrepancies if relevant.
Use professional law enforcement language."""
        
        response = await self._send_message(thread_id, prompt, model="gpt-4o-mini")
        return response.strip()
    
    def _generate_evidence_summary(
        self,
        structured_claim: Dict[str, Any],
        video_analysis: VideoAnalysis,
        comparisons: List[ComparisonResult]
    ) -> Dict[str, Any]:
        """Generate evidence summary for detective."""
        summary = {}
        
        # Extract key points from comparisons
        for comp in comparisons:
            summary[comp.category] = {
                "match": comp.match,
                "detail": comp.explanation
            }
        
        return summary
    
    async def _generate_detective_note(
        self,
        thread_id: str,
        verdict: str, 
        comparisons: List[ComparisonResult]
    ) -> str:
        """Generate noir-styled detective note using Backboard."""
        
        mismatches = [c.category for c in comparisons if not c.match]
        matches = [c.category for c in comparisons if c.match]
        
        prompt = f"""Write a single short noir-style detective comment about this case.

Verdict: {verdict}
Matches: {len(matches)}/{len(comparisons)}
Mismatches: {', '.join(mismatches) if mismatches else 'None'}

Write 1-2 sentences in classic noir detective voice (think 1940s private eye).
Reference "the video/tape/footage" and "the witness/dame/story".
Be cynical and world-weary but professional.
No quotes around it."""
        
        response = await self._send_message(thread_id, prompt, model="gpt-4o-mini")
        return response.strip().strip('"')
    
    async def _generate_case_title(self, thread_id: str, claim_text: str, verdict: str) -> str:
        """Generate noir-style case title using Backboard."""
        
        prompt = f"""Create a noir-style case title (3-5 words) for this investigation.

Claim summary: {claim_text[:150]}...
Verdict: {verdict}

Format: "The [Adjective] [Noun]" (example: "The Midnight Frame", "The Shadow's Truth")
Be creative and match the noir detective theme. Just return the title, nothing else."""
        
        response = await self._send_message(thread_id, prompt, model="gpt-4o-mini")
        
        # Clean up the response
        title = response.strip().strip('"').strip("'")
        
        # Ensure it starts with "The"
        if not title.startswith("The "):
            title = f"The {title}"
        
        return title
    
    def _generate_case_id(self) -> str:
        """Generate unique case ID."""
        from datetime import datetime
        import random
        date_str = datetime.now().strftime("%Y-%m-%d")
        case_num = random.randint(1, 999)
        return f"{date_str}-{case_num:03d}"
