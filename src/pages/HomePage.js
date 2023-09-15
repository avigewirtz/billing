import React, { useState } from 'react';
import axios from 'axios';
import './HomePage.css';
// import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import Tesseract from 'tesseract.js';

function HomePage() {
    const [notes, setNotes] = useState([]); // each item is { text: "", response: "" }
    const [selectedOption, setSelectedOption] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const extractAllTextFromPDF = async (dataUrl) => {
        const loadingTask = pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
    
        let combinedText = '';
    
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
    
            if (textContent.items.length > 0) {
                combinedText += textContent.items.map(item => item.str).join(' ') + "\n";
            } else {
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

    const handleFileChange = async (e) => {
        setIsLoading(true);
        setError(null);
        const files = Array.from(e.target.files);
        const newNotesPromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    const extractedText = await extractAllTextFromPDF(event.target.result);
                    resolve({ text: extractedText, response: "" });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newNotesPromises).then(notesArray => {
            setNotes(prevNotes => [...prevNotes, ...notesArray]);
            setIsLoading(false);
        }).catch(error => {
            setError("There was an error processing your files. Please ensure they are in the correct format and try again.");
            setIsLoading(false);
        });
    }

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    const handleNoteChange = (e, index) => {
        const updatedNotes = [...notes];
        updatedNotes[index].text = e.target.value;
        setNotes(updatedNotes);
    }

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        if (notes.length === 0 || !selectedOption) {
            alert("Please upload files and select an option.");
            setIsLoading(false);
            return;
        }

        const data = {
            notes,
            choice: selectedOption
        };

        const response = await axios.post('https://billing-automater-801d93465a2c.herokuapp.com/get-prompt', data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        setNotes(response.data.processedNotes);
        setIsLoading(false);
    }

    return (
        <div className="app">
            {isLoading && <div className="spinner">Loading...</div>}
            {error && <div className="error">{error}</div>}

            <main>
                <h1>The smartest way to elevate your progress notes</h1>

                {notes.map((note, index) => (
                    <div key={index}>
                        <label>Input Text:</label>
                        <textarea rows="10" cols="50" value={note.text} onChange={e => handleNoteChange(e, index)} />
                    </div>
                ))}

                <label>Or Upload Text File:</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} multiple />

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
                    {notes.map((note, index) => (
                        <div key={index} className="output-box">
                            <p>{note.response}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default HomePage;
