import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

class VerificationEngine:
    """
    Deterministic Verification Engine for Clinical Information.
    Verifies extracted fields against source documents, clinical rules, and cross-document history.
    """

    EXPECTED_UNITS = {
        "Hemoglobin A1c": ["%", "percent", "mmol/mol"],
        "Fasting Blood Glucose": ["mg/dL", "mmol/L"],
        "Blood Pressure": ["mmHg"],
        "Serum Creatinine": ["mg/dL", "umol/L"],
        "eGFR": ["mL/min/1.73m2", "mL/min"],
        "Total Cholesterol": ["mg/dL", "mmol/L"],
        "LDL Cholesterol": ["mg/dL", "mmol/L"],
        "HDL Cholesterol": ["mg/dL", "mmol/L"],
    }

    def verify_patient_records(
        self,
        extracted_fields: List[Dict[str, Any]],
        document_texts: Dict[str, str],
        patient_reported_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Runs comprehensive deterministic checks on all extracted fields for a patient.
        Returns:
            (updated_fields, verification_issues)
        """
        updated_fields = []
        issues = []

        # 1. Field-level verification checks
        for field in extracted_fields:
            field_copy = dict(field)
            doc_id = field_copy.get("document_id")
            doc_text = document_texts.get(doc_id, "") if doc_id else ""
            
            field_issues = self._verify_single_field(field_copy, doc_text)
            
            # Determine field verification status
            if any(i["severity"] in ["high", "critical"] for i in field_issues):
                field_copy["verification_status"] = "needs_clarification"
            elif any(i["issue_type"] == "contradiction" for i in field_issues):
                field_copy["verification_status"] = "conflicting_information"
            elif any(i["issue_type"] == "unsupported_claim" for i in field_issues):
                field_copy["verification_status"] = "needs_clarification"
            elif field_copy.get("source_snippet") and not field_issues:
                field_copy["verification_status"] = "source_supported"
            else:
                field_copy["verification_status"] = field_copy.get("verification_status", "awaiting_verification")

            issues.extend(field_issues)
            updated_fields.append(field_copy)

        # 2. Cross-document and cross-field contradiction checks
        cross_issues = self._check_cross_document_contradictions(updated_fields, patient_reported_data)
        issues.extend(cross_issues)

        # Mark fields affected by contradictions
        contradicted_field_ids = {iss.get("extracted_field_id") for iss in cross_issues if iss.get("extracted_field_id")}
        for f in updated_fields:
            if f.get("id") in contradicted_field_ids:
                f["verification_status"] = "conflicting_information"

        return updated_fields, issues

    def _verify_single_field(self, field: Dict[str, Any], doc_text: str) -> List[Dict[str, Any]]:
        """Run Check A, B, C, D, F, G on an individual field"""
        issues = []
        f_name = field.get("field_name", "")
        f_val = str(field.get("extracted_value", ""))
        snippet = field.get("source_snippet", "")
        cat = field.get("field_category", "")

        # --- Check F: Unsupported information (No source snippet or hallucinated claim) ---
        if not snippet or len(snippet.strip()) < 3:
            issues.append({
                "extracted_field_id": field.get("id"),
                "document_id": field.get("document_id"),
                "patient_id": field.get("patient_id"),
                "issue_type": "unsupported_claim",
                "severity": "high",
                "description": f"Field '{f_name}: {f_val}' lacks supporting source snippet evidence in the document.",
                "expected_format": "Verbatim excerpt from document text",
                "resolved": False
            })
        elif doc_text and snippet.lower() not in doc_text.lower():
            # Source snippet is not actually found in the raw document
            issues.append({
                "extracted_field_id": field.get("id"),
                "document_id": field.get("document_id"),
                "patient_id": field.get("patient_id"),
                "issue_type": "source_mismatch",
                "severity": "high",
                "description": f"Source snippet for '{f_name}' cannot be located in the original document text.",
                "expected_format": "Authentic substring from document",
                "resolved": False
            })

        # --- Check A: Source Consistency (Extracted value vs Source snippet) ---
        if snippet:
            # Check if key tokens of the extracted value appear in the snippet
            cleaned_val_tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9]+", f_val) if len(t) > 1]
            if cleaned_val_tokens:
                missing_tokens = [t for t in cleaned_val_tokens if t not in snippet.lower()]
                if len(missing_tokens) > len(cleaned_val_tokens) / 2:
                    issues.append({
                        "extracted_field_id": field.get("id"),
                        "document_id": field.get("document_id"),
                        "patient_id": field.get("patient_id"),
                        "issue_type": "source_mismatch",
                        "severity": "high",
                        "description": f"Extracted value '{f_val}' does not match the content of source snippet: \"{snippet}\".",
                        "expected_format": f"Value consistent with: {snippet}",
                        "resolved": False
                    })

        # --- Check B: Date Validation ---
        event_date = field.get("event_date")
        if cat == "date" or event_date:
            date_to_check = field.get("extracted_value") if cat == "date" else event_date
            if date_to_check:
                is_valid, parsed_dt = self._validate_date(date_to_check)
                if not is_valid:
                    issues.append({
                        "extracted_field_id": field.get("id"),
                        "document_id": field.get("document_id"),
                        "patient_id": field.get("patient_id"),
                        "issue_type": "invalid_date",
                        "severity": "medium",
                        "description": f"Date value '{date_to_check}' could not be parsed into a recognized calendar format (YYYY-MM-DD or MM/DD/YYYY).",
                        "expected_format": "YYYY-MM-DD or MM/DD/YYYY",
                        "resolved": False
                    })
                elif parsed_dt and parsed_dt.year > datetime.now().year + 1:
                    issues.append({
                        "extracted_field_id": field.get("id"),
                        "document_id": field.get("document_id"),
                        "patient_id": field.get("patient_id"),
                        "issue_type": "invalid_date",
                        "severity": "high",
                        "description": f"Date '{date_to_check}' is set in the future ({parsed_dt.year}), indicating potential OCR or extraction error.",
                        "expected_format": "Historical date <= current year",
                        "resolved": False
                    })

        # --- Check C: Numeric and Unit Validation ---
        if cat == "lab_result":
            unit = field.get("unit")
            num_val = field.get("numeric_value")

            if not unit:
                issues.append({
                    "extracted_field_id": field.get("id"),
                    "document_id": field.get("document_id"),
                    "patient_id": field.get("patient_id"),
                    "issue_type": "missing_unit",
                    "severity": "medium",
                    "description": f"Laboratory test '{f_name}' has value '{f_val}' but is missing measurement units.",
                    "expected_format": f"One of {self.EXPECTED_UNITS.get(f_name, ['Standard clinical unit'])}",
                    "resolved": False
                })
            elif f_name in self.EXPECTED_UNITS:
                expected = [u.lower() for u in self.EXPECTED_UNITS[f_name]]
                if unit.lower() not in expected:
                    issues.append({
                        "extracted_field_id": field.get("id"),
                        "document_id": field.get("document_id"),
                        "patient_id": field.get("patient_id"),
                        "issue_type": "incompatible_unit",
                        "severity": "high",
                        "description": f"Unit '{unit}' for '{f_name}' is not compatible with expected standard units ({', '.join(self.EXPECTED_UNITS[f_name])}).",
                        "expected_format": f"Expected unit in {self.EXPECTED_UNITS[f_name]}",
                        "resolved": False
                    })

        # --- Check D: Missing Information Detection ---
        if cat == "medication":
            # Medication without dose or frequency
            if not re.search(r"\d+\s*(?:mg|mcg|units|g|ml)", f_val, re.IGNORECASE):
                issues.append({
                    "extracted_field_id": field.get("id"),
                    "document_id": field.get("document_id"),
                    "patient_id": field.get("patient_id"),
                    "issue_type": "missing_field",
                    "severity": "medium",
                    "description": f"Medication '{f_name}' is documented without dosage specification (e.g. mg, frequency). Clarification recommended.",
                    "expected_format": "Medication name + dosage (e.g. 500mg daily)",
                    "resolved": False
                })

        return issues

    def _check_cross_document_contradictions(
        self,
        fields: List[Dict[str, Any]],
        patient_reported: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Check E: Contradictions across documents and patient reports
        """
        cross_issues = []

        # 1. Contradictory allergy reports (e.g. "NKDA" vs documented "Penicillin Allergy")
        allergy_fields = [f for f in fields if f.get("field_category") == "allergy"]
        has_nkda = any("no known" in str(f.get("extracted_value", "")).lower() or "nkda" in str(f.get("extracted_value", "")).lower() for f in allergy_fields)
        specific_allergies = [f for f in allergy_fields if "no known" not in str(f.get("extracted_value", "")).lower() and "nkda" not in str(f.get("extracted_value", "")).lower()]

        if has_nkda and specific_allergies:
            for sa in specific_allergies:
                cross_issues.append({
                    "extracted_field_id": sa.get("id"),
                    "document_id": sa.get("document_id"),
                    "patient_id": sa.get("patient_id"),
                    "issue_type": "contradiction",
                    "severity": "critical",
                    "description": f"Contradiction detected: One record lists 'No Known Drug Allergies (NKDA)' while document lists active allergy '{sa.get('extracted_value')}'.",
                    "conflicting_reference": f"NKDA record conflicts with document finding: {sa.get('source_snippet')}",
                    "resolved": False
                })

        # Check patient-reported allergies vs extracted documents
        if patient_reported and patient_reported.get("reported_allergies"):
            rep_allergies = [a.lower() for a in patient_reported.get("reported_allergies", [])]
            for sa in specific_allergies:
                sa_name = sa.get("extracted_value", "").lower()
                if not any(a in sa_name or sa_name in a for a in rep_allergies):
                    # Document shows allergy not reported by patient
                    cross_issues.append({
                        "extracted_field_id": sa.get("id"),
                        "document_id": sa.get("document_id"),
                        "patient_id": sa.get("patient_id"),
                        "issue_type": "contradiction",
                        "severity": "high",
                        "description": f"Patient did not report allergy to '{sa.get('extracted_value')}', but medical document confirms it.",
                        "conflicting_reference": f"Patient reported: {rep_allergies} vs Document: {sa.get('source_snippet')}",
                        "resolved": False
                    })

        # 2. Conflicting lab measurements for the SAME test on the SAME date with divergent values
        lab_fields = [f for f in fields if f.get("field_category") == "lab_result" and f.get("event_date") and f.get("numeric_value") is not None]
        lab_groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for lf in lab_fields:
            key = (lf.get("field_name", ""), lf.get("event_date", ""))
            lab_groups.setdefault(key, []).append(lf)

        for (test_name, event_date), group in lab_groups.items():
            if len(group) > 1:
                vals = [g.get("numeric_value") for g in group if g.get("numeric_value") is not None]
                if vals and (max(vals) - min(vals)) > 0.5: # Discrepancy threshold
                    for g in group:
                        cross_issues.append({
                            "extracted_field_id": g.get("id"),
                            "document_id": g.get("document_id"),
                            "patient_id": g.get("patient_id"),
                            "issue_type": "contradiction",
                            "severity": "critical",
                            "description": f"Conflicting results for '{test_name}' on date {event_date}: Found {vals}. Both sources require clinician verification.",
                            "conflicting_reference": f"Discrepant values {vals} across records for {test_name}",
                            "resolved": False
                        })

        return cross_issues

    def _validate_date(self, date_str: str) -> Tuple[bool, Optional[datetime]]:
        """Validate date string with multiple standard medical formats"""
        date_str = date_str.strip()
        formats = [
            "%Y-%m-%d", "%Y/%m/%d",
            "%m/%d/%Y", "%m-%d-%Y",
            "%d/%m/%Y", "%d-%m-%Y",
            "%B %d, %Y", "%b %d, %Y",
            "%B %d %Y", "%b %d %Y"
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return True, dt
            except ValueError:
                continue
        # Also check ISO prefix
        match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", date_str)
        if match:
            try:
                y, m, d = int(match.group(1)), int(match.group(2)), int(match.group(3))
                return True, datetime(y, m, d)
            except Exception:
                pass
        return False, None

verification_engine = VerificationEngine()
