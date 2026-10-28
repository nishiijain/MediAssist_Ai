import re
import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ExtractionService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def extract_from_document(
        self,
        document_text: str,
        pages_data: List[Dict[str, Any]],
        document_id: Optional[str] = None,
        patient_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract structured clinical fields from document text and pages.
        Returns a list of structured field dictionaries.
        """
        # Check if external LLM provider is configured
        if self.gemini_key and settings.LLM_PROVIDER in ["auto", "gemini"]:
            try:
                fields = self._extract_with_gemini(document_text, pages_data)
                if fields:
                    return fields
            except Exception as e:
                logger.warning(f"Gemini extraction failed, falling back to deterministic extractor: {e}")

        if self.openai_key and settings.LLM_PROVIDER in ["auto", "openai"]:
            try:
                fields = self._extract_with_openai(document_text, pages_data)
                if fields:
                    return fields
            except Exception as e:
                logger.warning(f"OpenAI extraction failed, falling back to deterministic extractor: {e}")

        # Deterministic clinical extractor
        return self._extract_deterministic(document_text, pages_data)

    def _extract_deterministic(self, text: str, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        High-precision deterministic extractor for clinical entities, lab tests,
        medications, allergies, dates, and vital signs.
        """
        extracted: List[Dict[str, Any]] = []

        # Helper to find source page and exact snippet
        def find_source(match_str: str) -> tuple[int, str]:
            if not match_str:
                return 1, ""
            for item in pages_data:
                p_text = item.get("text", "")
                if match_str.lower() in p_text.lower():
                    # extract surrounding context line
                    idx = p_text.lower().find(match_str.lower())
                    start = max(0, idx - 40)
                    end = min(len(p_text), idx + len(match_str) + 60)
                    snippet = p_text[start:end].replace("\n", " ").strip()
                    return item.get("page", 1), snippet
            # fallback to full text
            idx = text.lower().find(match_str.lower())
            if idx != -1:
                start = max(0, idx - 40)
                end = min(len(text), idx + len(match_str) + 60)
                return 1, text[start:end].replace("\n", " ").strip()
            return 1, match_str

        # 1. Document Date / Encounter Date
        date_patterns = [
            (r"(?:Date of Service|Service Date|Encounter Date|Visit Date|Collection Date|Test Date|Date):\s*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}|[A-Za-z]+ \d{1,2},? \d{4})", "Encounter Date"),
            (r"(?:Report Date|Result Date|Dictated Date):\s*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}|[A-Za-z]+ \d{1,2},? \d{4})", "Report Date")
        ]
        doc_date = None
        for pattern, label in date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                val = m.group(1).strip()
                if not doc_date:
                    doc_date = val
                pg, snip = find_source(m.group(0))
                extracted.append({
                    "field_category": "date",
                    "field_name": label,
                    "extracted_value": val,
                    "numeric_value": None,
                    "unit": None,
                    "reference_range": None,
                    "event_date": val,
                    "source_page": pg,
                    "source_snippet": snip,
                    "extraction_method": "deterministic_rule",
                    "verification_status": "awaiting_verification",
                    "uncertainty_notes": None
                })

        # 2. Lab Results: HbA1c, Glucose, Blood Pressure, Creatinine, eGFR, Cholesterol, LDL, HDL, ALT, AST
        lab_patterns = [
            # HbA1c
            {
                "pattern": r"(?:Hemoglobin\s*A1c|HbA1c|Glycated\s*Hemoglobin|A1C)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(%|percent)?(?:\s*(?:Ref|Reference|Range|Normal)?\s*[:(]?\s*([<0-9.\-\s]+%?)[)]?)?",
                "name": "Hemoglobin A1c",
                "default_unit": "%",
                "default_ref": "< 5.7%"
            },
            # Fasting Glucose
            {
                "pattern": r"(?:Fasting\s*Blood\s*Glucose|Fasting\s*Glucose|Serum\s*Glucose|Blood\s*Sugar|Glucose)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mmol/L)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([<0-9.\-\s]+(?:mg/dL|mmol/L)?)[)]?)?",
                "name": "Fasting Blood Glucose",
                "default_unit": "mg/dL",
                "default_ref": "70-99 mg/dL"
            },
            # Blood Pressure
            {
                "pattern": r"(?:Blood\s*Pressure|BP)\s*[:=\-]?\s*([0-9]{2,3}\s*/\s*[0-9]{2,3})\s*(mmHg)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([<0-9/\-\s]+mmHg?)[)]?)?",
                "name": "Blood Pressure",
                "default_unit": "mmHg",
                "default_ref": "< 120/80 mmHg"
            },
            # Serum Creatinine
            {
                "pattern": r"(?:Serum\s*Creatinine|Creatinine)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|umol/L)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([0-9.\-\s]+(?:mg/dL)?)[)]?)?",
                "name": "Serum Creatinine",
                "default_unit": "mg/dL",
                "default_ref": "0.7 - 1.3 mg/dL"
            },
            # eGFR
            {
                "pattern": r"(?:eGFR|Estimated\s*GFR)\s*[:=\-]?\s*([>0-9]+(?:\.[0-9]+)?)\s*(mL/min/1.73m2|mL/min)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([>0-9.\-\s]+)[)]?)?",
                "name": "eGFR",
                "default_unit": "mL/min/1.73m2",
                "default_ref": "> 60 mL/min/1.73m2"
            },
            # Total Cholesterol
            {
                "pattern": r"(?:Total\s*Cholesterol|Cholesterol,\s*Total)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mmol/L)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([<0-9.\-\s]+(?:mg/dL)?)[)]?)?",
                "name": "Total Cholesterol",
                "default_unit": "mg/dL",
                "default_ref": "< 200 mg/dL"
            },
            # LDL Cholesterol
            {
                "pattern": r"(?:LDL\s*Cholesterol|LDL-C|LDL)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mmol/L)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([<0-9.\-\s]+(?:mg/dL)?)[)]?)?",
                "name": "LDL Cholesterol",
                "default_unit": "mg/dL",
                "default_ref": "< 100 mg/dL"
            },
            # HDL Cholesterol
            {
                "pattern": r"(?:HDL\s*Cholesterol|HDL-C|HDL)\s*[:=\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(mg/dL|mmol/L)?(?:\s*(?:Ref|Range|Normal)?\s*[:(]?\s*([>0-9.\-\s]+(?:mg/dL)?)[)]?)?",
                "name": "HDL Cholesterol",
                "default_unit": "mg/dL",
                "default_ref": "> 40 mg/dL"
            }
        ]

        for lp in lab_patterns:
            matches = list(re.finditer(lp["pattern"], text, re.IGNORECASE))
            for m in matches:
                raw_val = m.group(1).strip()
                unit = m.group(2).strip() if (len(m.groups()) >= 2 and m.group(2)) else None
                ref = m.group(3).strip() if (len(m.groups()) >= 3 and m.group(3)) else lp.get("default_ref")
                
                # Try parsing numeric value
                num_val = None
                try:
                    clean_num = raw_val.replace(">", "").replace("<", "").strip()
                    if "/" not in clean_num:
                        num_val = float(clean_num)
                except ValueError:
                    pass

                pg, snip = find_source(m.group(0))
                extracted.append({
                    "field_category": "lab_result",
                    "field_name": lp["name"],
                    "extracted_value": raw_val,
                    "numeric_value": num_val,
                    "unit": unit or lp.get("default_unit"),
                    "reference_range": ref,
                    "event_date": doc_date,
                    "source_page": pg,
                    "source_snippet": snip,
                    "extraction_method": "deterministic_rule",
                    "verification_status": "awaiting_verification",
                    "uncertainty_notes": "Unit missing in text; defaulted" if not unit else None
                })

        # 3. Medications: Metformin, Lisinopril, Atorvastatin, Amoxicillin, Insulin, Aspirin, Omeprazole, Levothyroxine, etc.
        med_pattern = r"(?:(?:Rx|Prescription|Medication|Current Meds|Medications):\s*|\b)(Metformin|Lisinopril|Atorvastatin|Amoxicillin|Aspirin|Amlodipine|Metoprolol|Hydrochlorothiazide|Omeprazole|Levothyroxine|Gabapentin|Insulin Glargine|Empagliflozin|Glipizide)\b(?:\s+([0-9]+(?:\.[0-9]+)?\s*(?:mg|mcg|units|ml)))?(?:\s+(oral|tablet|capsule|daily|once daily|twice daily|BID|QD|QHS|PRN|at bedtime))?"
        med_matches = re.finditer(med_pattern, text, re.IGNORECASE)
        seen_meds = set()
        for m in med_matches:
            med_name = m.group(1).capitalize()
            dose = m.group(2).strip() if m.group(2) else None
            freq = m.group(3).strip() if m.group(3) else None
            
            full_val = med_name
            if dose:
                full_val += f" {dose}"
            if freq:
                full_val += f" {freq}"

            if med_name in seen_meds and not dose:
                continue
            seen_meds.add(med_name)

            pg, snip = find_source(m.group(0))
            uncertainty = "Dosage or frequency not documented in text" if not dose else None

            extracted.append({
                "field_category": "medication",
                "field_name": med_name,
                "extracted_value": full_val,
                "numeric_value": None,
                "unit": "mg" if (dose and "mg" in dose.lower()) else None,
                "reference_range": None,
                "event_date": doc_date,
                "source_page": pg,
                "source_snippet": snip,
                "extraction_method": "deterministic_rule",
                "verification_status": "awaiting_verification",
                "uncertainty_notes": uncertainty
            })

        # 4. Reported Conditions / Diagnoses
        condition_patterns = [
            r"\b(Type 2 Diabetes Mellitus|Type 2 Diabetes|Diabetes Mellitus|T2DM)\b",
            r"\b(Essential Hypertension|Hypertension|HTN)\b",
            r"\b(Hyperlipidemia|Dyslipidemia|Hypercholesterolemia)\b",
            r"\b(Chronic Kidney Disease|CKD Stage [1-5]|Diabetic Nephropathy)\b",
            r"\b(Coronary Artery Disease|CAD|Myocardial Infarction)\b",
            r"\b(Asthma|COPD|Chronic Obstructive Pulmonary Disease)\b",
            r"\b(Hypothyroidism|Gastroesophageal Reflux Disease|GERD)\b"
        ]
        seen_conds = set()
        for cp in condition_patterns:
            cond_matches = re.finditer(cp, text, re.IGNORECASE)
            for cm in cond_matches:
                cond_val = cm.group(1).strip()
                norm_cond = cond_val.title()
                if norm_cond in seen_conds:
                    continue
                seen_conds.add(norm_cond)
                pg, snip = find_source(cm.group(0))
                extracted.append({
                    "field_category": "condition",
                    "field_name": "Documented Condition",
                    "extracted_value": norm_cond,
                    "numeric_value": None,
                    "unit": None,
                    "reference_range": None,
                    "event_date": doc_date,
                    "source_page": pg,
                    "source_snippet": snip,
                    "extraction_method": "deterministic_rule",
                    "verification_status": "awaiting_verification",
                    "uncertainty_notes": None
                })

        # 5. Allergies
        allergy_patterns = [
            r"(?:Allergies|Allergy|Known Allergies|NKDA|Allergic to):\s*([^.\n]+)",
            r"\b(Penicillin allergy|Sulfa allergy|Allergic to penicillin|No known drug allergies|NKDA)\b"
        ]
        for ap in allergy_patterns:
            a_matches = re.finditer(ap, text, re.IGNORECASE)
            for am in a_matches:
                a_val = am.group(1).strip()
                pg, snip = find_source(am.group(0))
                extracted.append({
                    "field_category": "allergy",
                    "field_name": "Documented Allergy",
                    "extracted_value": a_val,
                    "numeric_value": None,
                    "unit": None,
                    "reference_range": None,
                    "event_date": doc_date,
                    "source_page": pg,
                    "source_snippet": snip,
                    "extraction_method": "deterministic_rule",
                    "verification_status": "awaiting_verification",
                    "uncertainty_notes": None
                })

        return extracted

    def _extract_with_gemini(self, text: str, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Call Google Gemini API if key is available"""
        import google.generativeai as genai
        genai.configure(api_key=self.gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are a clinical information extraction engine. Extract structured findings from the medical document below.
Return a STRICT JSON array of objects with the following schema:
[
  {{
    "field_category": "condition" | "medication" | "allergy" | "lab_result" | "observation" | "date",
    "field_name": "Name of field (e.g. Hemoglobin A1c, Metformin, Type 2 Diabetes)",
    "extracted_value": "exact value as string",
    "numeric_value": float or null,
    "unit": "unit or null",
    "reference_range": "reference range or null",
    "event_date": "YYYY-MM-DD or null",
    "source_page": 1,
    "source_snippet": "EXACT verbatim phrase from the document supporting this finding",
    "uncertainty_notes": "any ambiguity or null"
  }}
]

CRITICAL RULES:
1. Do NOT invent diagnoses, medication dosages, or values not explicitly stated.
2. source_snippet MUST be an exact verbatim substring from the text.
3. If an allergy is not mentioned, DO NOT extract NKDA.
4. Output raw JSON only, no markdown markers.

Document Text:
{text}
"""
        response = model.generate_content(prompt)
        content = response.text.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
        data = json.loads(content)
        for item in data:
            item["extraction_method"] = "gemini_api"
            item["verification_status"] = "awaiting_verification"
        return data

    def _extract_with_openai(self, text: str, pages_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Call OpenAI API if key is available"""
        from openai import OpenAI
        client = OpenAI(api_key=self.openai_key)
        prompt = f"""Extract structured clinical findings from the medical document. Return a JSON array:
[
  {{
    "field_category": "condition" | "medication" | "allergy" | "lab_result" | "observation" | "date",
    "field_name": "Field name",
    "extracted_value": "value",
    "numeric_value": null or float,
    "unit": null or string,
    "reference_range": null or string,
    "event_date": null or string,
    "source_page": 1,
    "source_snippet": "EXACT quote from text",
    "uncertainty_notes": null
  }}
]
Rules:
- Exact quotes for source_snippet.
- Do not fabricate missing values.
Text:
{text}
"""
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        content = res.choices[0].message.content
        data = json.loads(content)
        if isinstance(data, dict) and "findings" in data:
            data = data["findings"]
        elif isinstance(data, dict):
            # find first list value
            for v in data.values():
                if isinstance(v, list):
                    data = v
                    break
        for item in data:
            item["extraction_method"] = "openai_api"
            item["verification_status"] = "awaiting_verification"
        return data

extraction_service = ExtractionService()
