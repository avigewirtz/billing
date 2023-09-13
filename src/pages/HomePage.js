import React, { useState} from 'react';
import axios from 'axios';
import './HomePage.css';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import Tesseract from 'tesseract.js';

function HomePage() {
    const [text, setText] = useState('');  
    const [selectedOption, setSelectedOption] = useState('');
    const [responseText, setResponseText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const extractAllTextFromPDF = async (dataUrl) => {
        const loadingTask = pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
    
        let combinedText = '';
    
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
    
            // If the PDF has selectable text, use it
            if (textContent.items.length > 0) {
                combinedText += textContent.items.map(item => item.str).join(' ') + "\n";
            } 
            // If not, fallback to OCR
            else {
                const canvas = document.createElement("canvas");
                const viewport = page.getViewport({ scale: 1.5 });
                const context = canvas.getContext("2d");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
    
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
    
                const result = await Tesseract.recognize(canvas);
                combinedText += result.data.text + "\n";
            }
        }
    
        return combinedText;
    };
    

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleFileChange = async (e) => {
        setIsLoading(true);
        setError(null);
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                try {
                    if (file.name.endsWith('.pdf')) {
                        const extractedText = await extractAllTextFromPDF(event.target.result);
                        setText(extractedText);
                    } else {
                        setText(event.target.result);
                    }
                } catch (err) {
                    console.error("Error processing the file:", err);
                    setError("There was an error processing your file. Please ensure it's in the correct format and try again.");
                } finally {
                    setIsLoading(false); // Only set loading to false after processing the file
                }
            }
            reader.readAsDataURL(file);
        } else {
            setIsLoading(false); // If no file selected, also set loading to false
        }
    }
    

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        if (!text || !selectedOption) {
            alert("Please provide text and select an option.");
            setIsLoading(false);
            return;
        }

        try {
            const data = {
                text: text,
                choice: selectedOption
            };

            const response = await axios.post('https://billing-automater-801d93465a2c.herokuapp.com/get-prompt', data, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            setResponseText(response.data.response);
        } catch (error) {
            console.error("Error fetching prompt:", error);
            setError("There was an error processing your request. Please try again.");
        }
        setIsLoading(false);
    }

    return (
        <div className="app">
            {isLoading && <div className="spinner">Loading...</div>}
            {error && <div className="error">{error}</div>}

            <main>
                <h1>The smartest way to elevate your progress notes</h1>

                <label>Input Text:</label>
                <textarea key={Date.now()} rows="10" cols="50" value={text} onChange={handleTextChange}></textarea>

                <label>Or Upload Text File:</label>
                <input type="file" accept=".txt,.pdf" onChange={handleFileChange} />

                <label>Select an option:</label>
                <select onChange={handleOptionChange}>
                    <option value="">--Choose an option--</option>
                    <option value="1">Diagnosis</option>
                    <option value="2">ICD10 Codes</option>
                    <option value="3">Medicare verbiage if the patient can benefit for physical therapy based off the patient's diagnoses.</option>
                    <option value="4">Spell check</option>
                    <option value="5">Care plan</option>
                </select>
                <button onClick={handleSubmit}>Submit</button>

                <div className="response-section">
                    <h2>Response:</h2>
                    <div className="output-box">
                        <p>{responseText}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default HomePage;
