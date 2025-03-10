from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pptx import Presentation
from pptx.util import Inches, Pt
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

# API Configurations
PEXELS_API_KEY = "mYGJaFjke2BYgo5GtFZHP5HbAS5TGj5ad2LX5EPbIPeb7FaMZIkTRreK"
DUCKDUCKGO_API_URL = "https://api.duckduckgo.com/"

# Input model for topic and optional subtopics
class TopicInput(BaseModel):
    topic: str
    subtopics: list[str] = []  # Optional list of user-defined subtopics

def get_images(query, num_images=5):
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": query, "per_page": num_images}
    response = requests.get("https://api.pexels.com/v1/search", headers=headers, params=params)
    if response.status_code == 200:
        return [photo['src']['medium'] for photo in response.json().get('photos', [])]
    return []

def fetch_wikipedia_content(topic):
    try:
        summary = wikipedia.summary(topic, sentences=5)
        content = summary.split(". ")
        return [point.strip() for point in content if len(point) > 20][:4]  # Limit to 4 key points
    except Exception:
        return ["No relevant data found."]

def get_general_subtopics():
    """General subtopics valid for all topics."""
    return ["Introduction", "Key Features", "Benefits", "Challenges", "Future Scope"]

@app.post("/generate_ppt/")
def generate_ppt(input_data: TopicInput):
    topic = input_data.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    presentation = Presentation()
    presentation.slide_width = Inches(16)
    presentation.slide_height = Inches(9)

    # Title Slide
    slide = presentation.slides.add_slide(presentation.slide_layouts[0])
    slide.shapes.title.text = topic
    slide.placeholders[1].text = "AI-Generated Presentation"

    images = get_images(topic, num_images=4)
    subtopics = input_data.subtopics if input_data.subtopics else get_general_subtopics()
    used_content = set()

    for idx, subtopic in enumerate(subtopics):
        slide = presentation.slides.add_slide(presentation.slide_layouts[5])
        slide.shapes.title.text = f"{subtopic} - {topic}".strip()

        content = fetch_wikipedia_content(f"{topic} {subtopic}")
        filtered_content = [point for point in content if point not in used_content and "No relevant data found" not in point]
        used_content.update(filtered_content)

        if not filtered_content:
            filtered_content = ["No relevant data found."]

        # Adjust text box size to prevent overflow
        text_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(9), Inches(5))
        text_frame = text_box.text_frame
        text_frame.word_wrap = True
        text_frame.text = f"{subtopic} on {topic}:"

        for point in filtered_content[:4]:  # Max 4 bullet points
            p = text_frame.add_paragraph()
            p.text = f"- {point}"
            p.font.size = Pt(22)
            p.font.name = "Arial"

        # Place image on the right side (avoiding text overlap)
        if idx < len(images):
            try:
                img_data = requests.get(images[idx]).content
                image_stream = BytesIO(img_data)
                slide.shapes.add_picture(image_stream, Inches(11), Inches(2), width=Inches(4), height=Inches(3))
            except Exception as e:
                print(f"Error loading image {idx}: {e}")

    # Conclusion Slide
    slide = presentation.slides.add_slide(presentation.slide_layouts[5])
    slide.shapes.title.text = "Conclusion"
    
    text_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(14), Inches(4))
    text_frame = text_box.text_frame
    text_frame.text = "Key Takeaways:"
    
    for subtopic in subtopics:
        p = text_frame.add_paragraph()
        p.text = f"- {subtopic.strip()}"
        p.font.size = Pt(22)
        p.font.name = "Arial"

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
    raise HTTPException(status_code=404, detail="File not found")
