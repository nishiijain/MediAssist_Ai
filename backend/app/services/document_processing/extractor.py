import os
import shutil
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pymupdf as fitz
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

from app.core.config import settings

class DocumentExtractorService:
    def __init__(self):
        # Configure tesseract if custom path or system path
        if pytesseract:
            custom_cmd = settings.TESSERACT_CMD or shutil.which("tesseract")
            if custom_cmd and os.path.exists(custom_cmd):
                pytesseract.pytesseract.tesseract_cmd = custom_cmd

    def extract_document(self, file_path: str, file_type: str) -> Tuple[str, int, bool, List[str], List[Dict[str, Any]]]:
        """
        Extract text from file.
        Returns:
            (full_text, page_count, ocr_used, quality_warnings, pages_data)
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = path.suffix.lower()
        warnings = []
        pages_data: List[Dict[str, Any]] = []
        ocr_used = False
        full_text_parts = []

        if ext == ".txt":
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()
                pages_data.append({"page": 1, "text": text})
                return text, 1, False, [], pages_data
            except Exception as e:
                warnings.append(f"Failed to read text file: {str(e)}")
                return "", 0, False, warnings, []

        elif ext == ".pdf":
            try:
                doc = fitz.open(str(path))
                page_count = len(doc)
                
                for page_idx in range(page_count):
                    page = doc[page_idx]
                    page_num = page_idx + 1
                    page_text = page.get_text("text").strip()
                    
                    # If page has very little or no text, it might be a scanned page
                    if len(page_text) < 30:
                        ocr_attempted = False
                        if pytesseract and self._is_tesseract_available():
                            try:
                                pix = page.get_pixmap(dpi=150)
                                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                                ocr_text = pytesseract.image_to_string(img).strip()
                                if len(ocr_text) > len(page_text):
                                    page_text = ocr_text
                                    ocr_used = True
                                    ocr_attempted = True
                            except Exception as ocr_err:
                                warnings.append(f"OCR failed on PDF page {page_num}: {str(ocr_err)}")
                        
                        if not ocr_attempted and len(page_text) < 10:
                            warnings.append(f"PDF page {page_num} contains minimal extractable text (possible scanned image without OCR engine available).")

                    pages_data.append({"page": page_num, "text": page_text})
                    full_text_parts.append(f"--- Page {page_num} ---\n{page_text}")

                full_text = "\n\n".join(full_text_parts)
                if not full_text.strip():
                    warnings.append("Document extracted text is completely empty.")

                return full_text, page_count, ocr_used, warnings, pages_data

            except Exception as e:
                warnings.append(f"PDF extraction error: {str(e)}")
                return "", 0, False, warnings, []

        elif ext in [".png", ".jpg", ".jpeg"]:
            # Image file
            if not pytesseract or not self._is_tesseract_available():
                warnings.append("OCR engine (tesseract) not found or not configured. To extract text from images, install Tesseract (e.g. `brew install tesseract`).")
                return "", 1, False, warnings, [{"page": 1, "text": ""}]

            try:
                img = Image.open(str(path))
                text = pytesseract.image_to_string(img).strip()
                ocr_used = True
                if len(text) < 15:
                    warnings.append("Image OCR produced very short or low-confidence text.")
                pages_data.append({"page": 1, "text": text})
                return text, 1, ocr_used, warnings, pages_data
            except Exception as e:
                warnings.append(f"Image OCR failed: {str(e)}")
                return "", 1, True, warnings, [{"page": 1, "text": ""}]

        else:
            warnings.append(f"Unsupported file type: {ext}")
            return "", 0, False, warnings, []

    def _is_tesseract_available(self) -> bool:
        if not pytesseract:
            return False
        try:
            tcmd = pytesseract.pytesseract.tesseract_cmd
            if os.path.exists(tcmd) or shutil.which(tcmd):
                return True
        except Exception:
            pass
        return False

document_extractor = DocumentExtractorService()
