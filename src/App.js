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
const response = await axios.post("https://scgbackend.onrender.com", {
        topic,
        subtopics: subtopics.filter((s) => s.trim() !== ""),
        bg_color: bgColor.replace("#", ""),
        text_color: textColor.replace("#", ""),
        font_style: fontStyle,
      });
      setPptUrl(response.data.ppt_url);
    } catch (error) {
      console.error("Error generating PPT:", error);
      alert("Failed to generate PPT. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI-Powered PPT Generator </h1>

      <div className="form-card">
        <h3>What's your topic of interest ? </h3>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your topic"
          className="input-box"
        />
      </div>

      <div className="form-card">
        <h2>Want to add your points?</h2>
        {subtopics.map((subtopic, index) => (
          <input
            key={index}
            type="text"
            value={subtopic}
            onChange={(e) => handleSubtopicChange(index, e.target.value)}
            placeholder={`Subtopic ${index + 1}`}
            className="input-box"
          />
        ))}
        <button onClick={handleAddSubtopic} className="button add-button">
          ➕ Add Subtopic
        </button>
      </div>

      <div className="form-card">
        <h2>How would you like to style your presentation ?</h2>
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

        <label>🎨 Choose a Creative Font:</label>
        <select
          value={fontStyle}
          onChange={(e) => setFontStyle(e.target.value)}
          className="font-select"
        >
          <option value="Arial">Classic - Arial</option>
          <option value="Times New Roman">Elegant - Times New Roman</option>
          <option value="Verdana">Clean - Verdana</option>
          <option value="Courier New">Retro - Courier New</option>
        </select>

        <button
          onClick={handleGeneratePPT}
          className="button generate-button"
          disabled={loading}
        >
          {loading ? "Generating..." : "🚀 Generate PPT"}
        </button>
      </div>

      {pptUrl && (
        <div className="download-section">
          <h3>Your presentation is ready! 🎉</h3>
          <a href={pptUrl} download className="button download-button">
            📥 Download PPT
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
