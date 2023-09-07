import React, { useState } from 'react';
import axios from 'axios';
import './HomePage.css';

function HomePage() {
    const [file, setFile] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    }

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    const handleSubmit = async () => {
        if (!file || !selectedOption) {
            alert("Please select both a PDF file and an option.");
            return;
        }
    
        const formData = new FormData();
        formData.append('file', file);
        formData.append('choice', selectedOption);
    
        try {
            const response = await axios.post('https://billing-automater-801d93465a2c.herokuapp.com/get-prompt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true // Assuming you still need this for cross-origin credentials
            });
            console.log(response.data.response);
        } catch (error) {
            console.error("Error fetching prompt:", error);
        }
    }
    

    return (
        <div>
            <h1>Welcome to HomePage</h1>

            {/* File Upload */}
            <label>Upload PDF:</label>
            <input type="file" accept=".pdf" onChange={handleFileChange} />

            {/* Options Dropdown */}
            <label>Select an option:</label>
            <select onChange={handleOptionChange}>
                <option value="">--Choose an option--</option>
                <option value="1">Diagnosis</option>
                <option value="2">ICD10 Codes</option>
                <option value="3">Medicare verbiage if the patient can benefit for physical therapy based off the patient's diagnoses.</option>
                <option value="4">Spell check</option>
                <option value="5">Care plan</option>
            </select>

            {/* Submit Button */}
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default HomePage;
