"""
ASCII Art Report Generator for NoirVision.
Generates beautiful noir-styled credibility reports.
"""
from app.models import CredibilityReport


class ReportGenerator:
    """Generates formatted ASCII art reports."""
    
    @staticmethod
    def generate_report(report: CredibilityReport) -> str:
        """
        Generate a complete formatted report.
        
        Args:
            report: CredibilityReport object
            
        Returns:
            Formatted ASCII art report string
        """
        lines = []
        
        # Header
        lines.extend(ReportGenerator._generate_header(report))
        lines.append("")
        
        # Witness Claim
        lines.extend(ReportGenerator._generate_claim_section(report))
        lines.append("")
        
        # Video Analysis
        lines.extend(ReportGenerator._generate_video_section(report))
        lines.append("")
        
        # Comparison Engine
        lines.extend(ReportGenerator._generate_comparison_section(report))
        lines.append("")
        
        # Verdict
        lines.extend(ReportGenerator._generate_verdict_section(report))
        lines.append("")
        
        # Evidence Summary
        lines.extend(ReportGenerator._generate_summary_section(report))
        lines.append("")
        
        # Footer
        lines.extend(ReportGenerator._generate_footer(report))
        
        return "\n".join(lines)
    
    @staticmethod
    def _generate_header(report: CredibilityReport) -> list:
        """Generate report header."""
        return [
            "╔══════════════════════════════════════════════════════════════╗",
            "║                    VERITAS CREDIBILITY REPORT                ║",
            f"║                    Case #: {report.case_id:<33}║",
            f"║                    \"{report.case_title:<38}║",
            "╚══════════════════════════════════════════════════════════════╝"
        ]
    
    @staticmethod
    def _generate_claim_section(report: CredibilityReport) -> list:
        """Generate witness claim section."""
        lines = [
            "┌──────────────────────────────────────────────────────────────┐",
            "│  WITNESS CLAIM                                               │",
            "├──────────────────────────────────────────────────────────────┤"
        ]
        
        # Wrap claim text
        wrapped = ReportGenerator._wrap_text(report.witness_claim, 60)
        for line in wrapped:
            lines.append(f"│  {line:<60}│")
        
        lines.append("└──────────────────────────────────────────────────────────────┘")
        return lines
    
    @staticmethod
    def _generate_video_section(report: CredibilityReport) -> list:
        """Generate video analysis section."""
        video = report.video_analysis
        lines = [
            "┌──────────────────────────────────────────────────────────────┐",
            "│  VIDEO EVIDENCE ANALYSIS (TwelveLabs)                        │",
            "├──────────────────────────────────────────────────────────────┤",
            f"│  Source: {video.source:<49}│",
            f"│  Duration: {video.duration:<47}│",
            "│                                                                │",
            "│  Key Detections:                                              │"
        ]
        
        # Add detections
        for detection in video.detections:
            det_line = f"  ⏱ {detection.timestamp} – {detection.description}"
            if detection.confidence:
                det_line += f" ({int(detection.confidence)}%)"
            
            wrapped = ReportGenerator._wrap_text(det_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        lines.append("│                                                                │")
        
        # Add on-screen text if available
        if video.on_screen_text:
            text_line = f"  On‑Screen Text: {video.on_screen_text}"
            wrapped = ReportGenerator._wrap_text(text_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        # Add GPS if available
        if video.gps_metadata:
            gps_line = f"  GPS Metadata: {video.gps_metadata}"
            wrapped = ReportGenerator._wrap_text(gps_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        # Add speech transcription if available
        if video.speech_transcription:
            lines.append("│                                                                │")
            lines.append("│  Speech transcription (from nearby mic):                      │")
            for speech in video.speech_transcription:
                speech_line = f"  - {speech['speaker']}: \"{speech['text']}\""
                wrapped = ReportGenerator._wrap_text(speech_line, 60)
                for line in wrapped:
                    lines.append(f"│  {line:<60}│")
        
        lines.append("└──────────────────────────────────────────────────────────────┘")
        return lines
    
    @staticmethod
    def _generate_comparison_section(report: CredibilityReport) -> list:
        """Generate comparison engine section."""
        lines = [
            "┌──────────────────────────────────────────────────────────────┐",
            "│  COMPARISON ENGINE ANALYSIS                                   │",
            "├──────────────────────────────────────────────────────────────┤"
        ]
        
        for comp in report.comparisons:
            comp_line = f"  ⚖️  {comp.category}: {comp.explanation}"
            wrapped = ReportGenerator._wrap_text(comp_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        lines.append("└──────────────────────────────────────────────────────────────┘")
        return lines
    
    @staticmethod
    def _generate_verdict_section(report: CredibilityReport) -> list:
        """Generate verdict section."""
        lines = [
            "┌──────────────────────────────────────────────────────────────┐",
            "│  VERDICT                                                      │",
            "├──────────────────────────────────────────────────────────────┤",
            f"│  CREDIBILITY SCORE: {report.credibility_score}/100{' ' * (39 - len(str(report.credibility_score)))}│",
            f"│  STATUS: {report.verdict:<50}│",
            "│                                                                │",
            "│  INVESTIGATION RECOMMENDATION:                                │"
        ]
        
        # Wrap recommendation
        rec_lines = report.recommendation.split("\n")
        for rec_line in rec_lines:
            wrapped = ReportGenerator._wrap_text(rec_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        lines.append("└──────────────────────────────────────────────────────────────┘")
        return lines
    
    @staticmethod
    def _generate_summary_section(report: CredibilityReport) -> list:
        """Generate evidence summary section."""
        lines = [
            "┌──────────────────────────────────────────────────────────────┐",
            "│  EVIDENCE SUMMARY (for detective's notebook)                 │",
            "├──────────────────────────────────────────────────────────────┤"
        ]
        
        # Add evidence points
        for key, value in report.evidence_summary.items():
            if isinstance(value, dict):
                status = "✓" if value.get("match") else "✗"
                summary_line = f"  • {key}: {status} {value.get('detail', '')}"
            else:
                summary_line = f"  • {key}: {value}"
            
            wrapped = ReportGenerator._wrap_text(summary_line, 60)
            for line in wrapped:
                lines.append(f"│  {line:<60}│")
        
        lines.append("│                                                                │")
        
        # Add detective note
        note_wrapped = ReportGenerator._wrap_text(f'  "{report.detective_note}"', 60)
        for line in note_wrapped:
            lines.append(f"│  {line:<60}│")
        
        lines.append("└──────────────────────────────────────────────────────────────┘")
        return lines
    
    @staticmethod
    def _generate_footer(report: CredibilityReport) -> list:
        """Generate report footer."""
        return [
            "╔══════════════════════════════════════════════════════════════╗",
            "║  Case filed by: Detective Veritas                           ║",
            "║  \"In the city of lies, trust the footage.\"                  ║",
            "╚══════════════════════════════════════════════════════════════╝"
        ]
    
    @staticmethod
    def _wrap_text(text: str, width: int) -> list:
        """Wrap text to specified width."""
        if len(text) <= width:
            return [text + " " * (width - len(text))]
        
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line) + len(word) + 1 <= width:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
            else:
                lines.append(current_line + " " * (width - len(current_line)))
                current_line = word
        
        if current_line:
            lines.append(current_line + " " * (width - len(current_line)))
        
        return lines
