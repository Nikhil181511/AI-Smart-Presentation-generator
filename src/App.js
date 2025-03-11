import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const bubbleContainer = document.querySelector(".bubble-background");

    for (let i = 0; i < 30; i++) {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.style.width = `${Math.random() * 60 + 20}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.animationDuration = `${Math.random() * 10 + 5}s`;
      bubbleContainer.appendChild(bubble);
    }
  }, []);

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
      const response = await axios.post("http://localhost:8000/generate_ppt/", {
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
      <div className="bubble-background"></div>

      <h1>🧠 AI-Powered PPT Generator 📊</h1>

      <h3>What's your topic of interest? 🤔</h3>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter your topic"
        className="input-box"
      />

      <h2>Want to add some extra points? ✍</h2>
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

      <h2>✨ How would you like to style your presentation? ✨</h2>
      <label>Background Color:</label>
      <input
        type="color"
        value={bgColor}
        onChange={(e) => setBgColor(e.target.value)}
      />

      <label>Text Color:</label>
      <input
        type="color"
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
      />

      <label>🎨 Choose a Creative Font:</label>
      <select
        value={fontStyle}
        onChange={(e) => setFontStyle(e.target.value)}
        className="font-select"
      >
        <option value="Arial">🖋 Classic - Arial</option>
        <option value="Times New Roman">📜 Elegant - Times New Roman</option>
        <option value="Verdana">🎯 Clean - Verdana</option>
        <option value="Courier New">📂 Retro - Courier New</option>
      </select>

      <button
        onClick={handleGeneratePPT}
        className="button generate-button"
        disabled={loading}
      >
        {loading ? "Generating..." : "🚀 Generate PPT"}
      </button>

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