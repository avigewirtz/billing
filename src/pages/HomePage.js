import React, { useState } from 'react';
import axios from 'axios';
import './HomePage.css'

function HomePage() {
    const [text, setText] = useState('');  // For directly inputting text
    const [selectedOption, setSelectedOption] = useState('');
    const [responseText, setResponseText] = useState('');

    const handleTextChange = (e) => {
        setText(e.target.value);
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                setText(event.target.result);
            }
            reader.readAsText(file);
        }
    }

    const handleOptionChange = (e) => {
        setSelectedOption(e.target.value);
    }

    const handleSubmit = async () => {
        if (!text || !selectedOption) {
            alert("Please provide text and select an option.");
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
            console.log(response.data.response);
            setResponseText(response.data.response);
        } catch (error) {
            console.error("Error fetching prompt:", error);
        }
    }

      return (
            <div className="app">
                <main>
                    <h1>The smartest way to elevate your progress notes</h1>

                    <label>Input Text:</label>
                    <textarea rows="10" cols="50" value={text} onChange={handleTextChange}></textarea>

                    <label>Or Upload Text File:</label>
                    <input type="file" accept=".txt" onChange={handleFileChange} />

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





