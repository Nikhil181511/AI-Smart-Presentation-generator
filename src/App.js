import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState([""]);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [fontStyle, setFontStyle] = useState("Arial");
  const [loading, setLoading] = useState(false);
  const [pptUrl, setPptUrl] = useState(null);

  const handleAddSubtopic = () => {
    if (subtopics[subtopics.length - 1].trim() !== "") {
      setSubtopics([...subtopics, ""]);
    }
  };

  const handleSubtopicChange = (index, value) => {
    const newSubtopics = [...subtopics];
    newSubtopics[index] = value;
    setSubtopics(newSubtopics);
  };

  const handleGeneratePPT = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://scgbackend.onrender.com/generate_ppt/", {
        topic,
        subtopics: subtopics.filter((s) => s.trim() !== ""),
        bg_color: bgColor,
        text_color: textColor,
        font_style: fontStyle,
      });

    setPptUrl(response.data.ppt_url);
    } catch (error) {
      console.error("Error generating presentation:", error);
      alert("Unable to generate presentation. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Smart Presentation Generator</h1>

      <div className="form-card">
        <h3>Define Your Presentation Topic</h3>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your main topic or title"
          className="input-box"
        />
      </div>

      <div className="form-card">
        <h2>Include Key Points</h2>
        {subtopics.map((subtopic, index) => (
          <input
            key={index}
            type="text"
            value={subtopic}
            onChange={(e) => handleSubtopicChange(index, e.target.value)}
            placeholder={`Key point ${index + 1}`}
            className="input-box"
          />
        ))}
        <button onClick={handleAddSubtopic} className="button add-button">
          + Add Key Point
        </button>
      </div>

      <div className="form-card">
        <h2>Customize Your Design</h2>
        <div className="color-selector">
          <div className="color-field">
            <label>Background Color:</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </div>

          <div className="color-field">
            <label>Text Color:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>
        </div>

        <label>Typography Style:</label>
        <select
          value={fontStyle}
          onChange={(e) => setFontStyle(e.target.value)}
          className="font-select"
        >
          <option value="Arial">Professional (Arial)</option>
          <option value="Times New Roman">Traditional (Times New Roman)</option>
          <option value="Verdana">Modern (Verdana)</option>
          <option value="Courier New">Technical (Courier New)</option>
        </select>

        <button
          onClick={handleGeneratePPT}
          className="button generate-button"
          disabled={loading}
        >
          {loading ? "Creating Presentation..." : "Generate Presentation"}
        </button>
      </div>

      {pptUrl && (
        <div className="download-section">
          <h3>Your presentation is ready!</h3>
          <a href={pptUrl} download className="button download-button">
            Download Presentation
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
