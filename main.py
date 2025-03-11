from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
import requests
import wikipedia
import spacy
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import os

app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Pexels API Key (Replace with a valid API key)
PEXELS_API_KEY = "mYGJaFjke2BYgo5GtFZHP5HbAS5TGj5ad2LX5EPbIPeb7FaMZIkTRreK"

# Input model with theme customization
class TopicInput(BaseModel):
    topic: str
    subtopics: list[str] = []
    bg_color: str = "#FFFFFF"  # Default: White
    text_color: str = "#000000"  # Default: Black
    font_style: str = "Times New Roman"  # Default font

def fetch_wikipedia_content(topic):
    """Fetch Wikipedia summary content."""
    try:
        summary = wikipedia.summary(topic, sentences=5)
        content = summary.split(". ")
        return [point.strip() for point in content if len(point) > 20][:4]  # Limit to 4 key points
    except Exception:
        return ["No relevant data found."]

def fetch_images(query, num_images=1):
    """Fetch images from Pexels."""
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": query, "per_page": num_images}
    response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
    if response.status_code == 200:
        return [photo["src"]["medium"] for photo in response.json().get("photos", [])]
    return []

def hex_to_rgb(hex_color):
    """Convert HEX color to RGB for PowerPoint compatibility."""
    hex_color = hex_color.lstrip("#")
    return RGBColor(int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16))

@app.post("/generate_ppt/")
def generate_ppt(input_data: TopicInput):
    topic = input_data.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    presentation = Presentation()
    presentation.slide_width = Inches(16)
    presentation.slide_height = Inches(9)

    # Convert colors from HEX to RGB
    bg_rgb = hex_to_rgb(input_data.bg_color)
    text_rgb = hex_to_rgb(input_data.text_color)

    subtopics = input_data.subtopics or ["Introduction", "Key Features", "Benefits", "Challenges", "Future Scope"]

    # Fetch images for the main topic
    topic_images = fetch_images(topic, num_images=len(subtopics))

    # Title Slide
    slide = presentation.slides.add_slide(presentation.slide_layouts[0])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = bg_rgb

    title = slide.shapes.title
    title.text = topic
    title.text_frame.paragraphs[0].font.color.rgb = text_rgb
    title.text_frame.paragraphs[0].font.name = input_data.font_style

    subtitle = slide.placeholders[1]
    subtitle.text = "AI-Generated Presentation"
    subtitle.text_frame.paragraphs[0].font.color.rgb = text_rgb
    subtitle.text_frame.paragraphs[0].font.name = input_data.font_style

    for idx, subtopic in enumerate(subtopics):
        slide = presentation.slides.add_slide(presentation.slide_layouts[5])
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb = bg_rgb

        title = slide.shapes.title
        title.text = f"{subtopic} - {topic}"
        title.text_frame.paragraphs[0].font.color.rgb = text_rgb
        title.text_frame.paragraphs[0].font.name = input_data.font_style

        text_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(10), Inches(4))
        text_frame = text_box.text_frame
        text_frame.word_wrap = True
        text_frame.text = f"{subtopic} on {topic}:"
        text_frame.paragraphs[0].font.color.rgb = text_rgb
        text_frame.paragraphs[0].font.name = input_data.font_style

        for point in fetch_wikipedia_content(f"{topic} {subtopic}")[:4]:
            p = text_frame.add_paragraph()
            p.text = f"- {point}"
            p.font.size = Pt(20)
            p.font.color.rgb = text_rgb
            p.font.name = input_data.font_style

        # Add Image if available
        if idx < len(topic_images):
            try:
                img_data = requests.get(topic_images[idx]).content
                image_stream = BytesIO(img_data)
                slide.shapes.add_picture(image_stream, Inches(11), Inches(2), width=Inches(4))
            except Exception as e:
                print(f"Error loading image {idx}: {e}")

    # Conclusion Slide
    slide = presentation.slides.add_slide(presentation.slide_layouts[5])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = bg_rgb

    slide.shapes.title.text = "Conclusion"
    slide.shapes.title.text_frame.paragraphs[0].font.color.rgb = text_rgb
    slide.shapes.title.text_frame.paragraphs[0].font.name = input_data.font_style

    text_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(14), Inches(4))
    text_frame = text_box.text_frame
    text_frame.text = "Key Takeaways:"
    text_frame.paragraphs[0].font.color.rgb = text_rgb
    text_frame.paragraphs[0].font.name = input_data.font_style

    for subtopic in subtopics:
        p = text_frame.add_paragraph()
        p.text = f"- {subtopic}"
        p.font.size = Pt(22)
        p.font.color.rgb = text_rgb
        p.font.name = input_data.font_style

    # Save the presentation
    ppt_folder = "generated_ppts"
    os.makedirs(ppt_folder, exist_ok=True)
    ppt_path = os.path.join(ppt_folder, f"{topic.replace(' ', '_')}.pptx")
    presentation.save(ppt_path)

    return {"ppt_url": f"http://localhost:8000/download/{topic.replace(' ', '_')}.pptx"}

@app.get("/download/{filename}")
async def download_ppt(filename: str):
    ppt_folder = "generated_ppts"
    file_path = os.path.join(ppt_folder, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=filename)
    raise HTTPException(status_code=404, detail="File not found")
