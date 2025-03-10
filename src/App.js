import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [pptUrl, setPptUrl] = useState(null);

  const handleAddSubtopic = () => {
    setSubtopics([...subtopics, ""]);
  };

  const handleSubtopicChange = (index, value) => {
    const newSubtopics = [...subtopics];
    newSubtopics[index] = value;
    setSubtopics(newSubtopics);
  };

  const handleGeneratePPT = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/generate_ppt/", {
        topic,
        subtopics: subtopics.filter((s) => s.trim() !== ""),
      });
      setPptUrl(response.data.ppt_url);
    } catch (error) {
      console.error("Error generating PPT:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>AI-Powered PPT Generator</h1>
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic"
        className="input-box"
      />
      <h2>Enter Subtopics (Optional)</h2>
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
        + Add Subtopic
      </button>
      <button onClick={handleGeneratePPT} className="button generate-button" disabled={loading}>
        {loading ? "Generating..." : "Generate PPT"}
      </button>
      {pptUrl && (
        <a href={pptUrl} download className="button download-button">
          Download PPT
        </a>
      )}
    </div>
  );
};

export default App;
