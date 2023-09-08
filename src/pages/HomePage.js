import React, { useState } from 'react';
import axios from 'axios';
import './HomePage.css';
import { PDFDocument } from 'pdf-lib';

function HomePage() {
    const [file, setFile] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    }

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    const extractTextFromPDF = async (pdfFile) => {
        const fileBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBuffer);

        let text = '';

        const pageCount = pdfDoc.getPageCount();
        for (let i = 0; i < pageCount; i++) {
            const page = pdfDoc.getPage(i);
            const content = page.getContentStreamTextContent();
            text += content.items.map(item => item.str).join(' ');
        }

        return text;
    }

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
        </div>
    );
}

export default HomePage;
