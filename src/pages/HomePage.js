import React, { useState } from 'react';
import axios from 'axios';
import './HomePage.css';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.js';

function HomePage() {
    const [file, setFile] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [responseText, setResponseText] = useState(''); // Added to capture response data

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    }

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    // Function to extract text from uploaded PDF
    const extractTextFromPDF = async (pdfFile) => {
        const pdf = await pdfjs.getDocument({ url: URL.createObjectURL(pdfFile) }).promise;
        let text = '';

        for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
        }

        return text;
    }

    // Function to handle form submission
    const handleSubmit = async () => {
        if (!file || !selectedOption) {
            alert("Please select both a PDF file and an option.");
            return;
        }

        try {
            const pdfText = await extractTextFromPDF(file);

            const data = {
                text: pdfText,
                choice: selectedOption
            };

            const response = await axios.post('https://billing-automater-801d93465a2c.herokuapp.com/get-prompt', data, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            console.log(response.data.response);
            setResponseText(response.data.response); // Save response data to state
        } catch (error) {
            console.error("Error fetching prompt:", error);
        }
    }

    return (
        <div>
            <h1>Welcome to HomePage</h1>
            <label>Upload PDF:</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
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

            {/* Display response data */}
            <div className="response-section">
                <h2>Response:</h2>
                <p>{responseText}</p>
            </div>
        </div>
    );
}

export default HomePage;
