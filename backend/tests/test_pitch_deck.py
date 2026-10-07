"""Tests for Pitch Deck and Competition Deliverables endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_pitch_deck_info_endpoint():
    """Verify metadata endpoint returns 10-slide deck details and official submission."""
    response = client.get("/api/pitch-deck/info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["slides_count"] == 10

    # Submission dossier verification
    sub = data["submission"]
    assert sub["applicant"] == "Edwin Mwiti"
    assert sub["project_name"] == "NexusFin"
    assert "98" in str(sub["word_count"])
    assert "responsible credit decision-support platform" in sub["builderbase_description"].lower()

    # File verification
    files = data["files"]
    assert files["pitch_deck_10_slides"]["available"] is True
    assert files["pitch_deck_10_slides"]["size_bytes"] > 5000
    assert files["pitch_deck_original"]["available"] is True
    assert files["pitch_deck_original"]["size_bytes"] > 500000


def test_pitch_deck_slides_endpoint():
    """Verify structured slides JSON endpoint returns all 10 competition slides."""
    response = client.get("/api/pitch-deck/slides")
    assert response.status_code == 200
    data = response.json()
    assert data["total_slides"] == 10
    slides = data["slides"]
    assert len(slides) == 10

    # Verify slide 1 (Title) and slide 6 (Carlos Manila case study)
    assert slides[0]["slide_number"] == 1
    assert "NexusFin" in slides[0]["title"]

    assert slides[5]["slide_number"] == 6
    assert "Carlos" in slides[5]["subtitle"]

    # Every slide must have title, tagline, and at least 3 key points
    for s in slides:
        assert s["slide_number"] >= 1
        assert len(s["title"]) > 0
        assert len(s["tagline"]) > 0
        assert len(s["key_points"]) >= 3


def test_pitch_deck_pdf_download():
    """Verify 10-slide PDF download endpoint returns valid binary PDF with attachment header."""
    response = client.get("/api/pitch-deck/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'attachment; filename="NexusFin_Pitch_Deck_10_Slides.pdf"' in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 5000


def test_pitch_deck_pdf_inline_view():
    """Verify 10-slide PDF view endpoint returns inline PDF for browser embedding."""
    response = client.get("/api/pitch-deck/view")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'inline; filename="NexusFin_Pitch_Deck_10_Slides.pdf"' in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF-")

    # Short route /api/pitch-deck
    response_root = client.get("/api/pitch-deck")
    assert response_root.status_code == 200
    assert response_root.content.startswith(b"%PDF-")


def test_pitch_deck_original_pdf():
    """Verify original reference PDF is accessible for both inline viewing and download."""
    res_view = client.get("/api/pitch-deck/original")
    assert res_view.status_code == 200
    assert res_view.headers["content-type"] == "application/pdf"
    assert res_view.content.startswith(b"%PDF-")
    assert len(res_view.content) > 500000

    res_dl = client.get("/api/pitch-deck/original/download")
    assert res_dl.status_code == 200
    assert 'attachment' in res_dl.headers["content-disposition"]
    assert res_dl.content.startswith(b"%PDF-")
