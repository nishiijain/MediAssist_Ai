import os
from pathlib import Path
import pymupdf as fitz

SAMPLE_DIR = Path(__file__).resolve().parent / "demo_docs"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

# 1. Lab Report Text
lab_text = """METROPOLITAN CLINICAL LABORATORIES
CLINICAL BIOCHEMISTRY REPORT
Patient Name: Johnathan Doe
MRN: MED-98402
DOB: 1966-08-20 (Age: 58) | Sex: Male
Collection Date: 2023-11-15
Ordering Physician: Dr. Emily Carter, MD

TEST RESULTS:
Hemoglobin A1c: 9.4 % (Reference: < 5.7%) [HIGH - Suboptimal Control]
Fasting Blood Glucose: 195 mg/dL (Reference: 70 - 99 mg/dL) [HIGH]
Total Cholesterol: 240 mg/dL (Reference: < 200 mg/dL) [ELEVATED]
LDL Cholesterol: 155 mg/dL (Reference: < 100 mg/dL) [ELEVATED]
HDL Cholesterol: 38 mg/dL (Reference: > 40 mg/dL) [LOW]
Serum Creatinine: 1.1 mg/dL (Reference: 0.7 - 1.3 mg/dL) [NORMAL]
eGFR: 78 mL/min/1.73m2 (Reference: > 60 mL/min/1.73m2)

Diagnostic Impression:
1. Poorly controlled Type 2 Diabetes Mellitus with marked hyperglycemia.
2. Comorbid mixed hyperlipidemia.
Clinical Recommendation: Initiate oral hypoglycemic therapy and repeat HbA1c in 90-120 days."""

with open(SAMPLE_DIR / "sample_lab_report.txt", "w") as f:
    f.write(lab_text)

# 2. Prescription Text
rx_text = """VALLEY ENDOCRINOLOGY CLINICAL PRACTICE
100 Medical Center Way, Suite 400
Provider: Dr. Emily Carter, MD | License: MD-492019

PRESCRIPTION ORDER
Date: 2023-11-20
Patient: Johnathan Doe | MRN: MED-98402

1. Metformin 1000mg tablet
   Sig: 1 tablet orally twice daily with meals (BID).
   Dispense: 60 tablets | Refills: 3

2. Lisinopril 10mg tablet
   Sig: 1 tablet orally once daily in the morning (QD).
   Dispense: 30 tablets | Refills: 3

3. Atorvastatin 20mg tablet
   Sig: 1 tablet orally daily at bedtime (QHS).
   Dispense: 30 tablets | Refills: 3

Allergy Check on File: Patient reports Penicillin allergy (severe rash).
Beta-lactams contraindicated."""

with open(SAMPLE_DIR / "sample_prescription.txt", "w") as f:
    f.write(rx_text)

# 3. Create Sample PDF files using PyMuPDF
doc1 = fitz.open()
page1 = doc1.new_page(width=595, height=842) # A4
page1.insert_textbox(fitz.Rect(50, 50, 545, 792), lab_text, fontsize=11, fontname="helv")
doc1.save(SAMPLE_DIR / "sample_lab_report.pdf")
doc1.close()

doc2 = fitz.open()
page2 = doc2.new_page(width=595, height=842)
page2.insert_textbox(fitz.Rect(50, 50, 545, 792), rx_text, fontsize=11, fontname="helv")
doc2.save(SAMPLE_DIR / "sample_prescription.pdf")
doc2.close()

print(f"Generated sample files in {SAMPLE_DIR}")
