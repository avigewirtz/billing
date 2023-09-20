



    import React, { useState } from 'react';
    import axios from 'axios';
    import { Button, Input, Select, Spin, Alert, Typography, Card } from 'antd';
    import * as pdfjsLib from 'pdfjs-dist/webpack';
    import Tesseract from 'tesseract.js';
    import pdfMake from "pdfmake/build/pdfmake";
    import { PDFDocument } from 'pdf-lib';
    import pdfFonts from "pdfmake/build/vfs_fonts";
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    
    function HomePage() {
        const { Option } = Select;
        const { TextArea } = Input;
        const { Title } = Typography;
    
        const [notes, setNotes] = useState([]);
        const [selectedOption, setSelectedOption] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState(null);
        const [responseText, setResponseText] = useState("");
        const [originalPdfDataUrls, setOriginalPdfDataUrls] = useState([]);
    
        const downloadAsPDF = async () => {
            // Create a new PDF
            const newPdfDoc = await PDFDocument.create();
        
            for (let url of originalPdfDataUrls) {
                const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
                const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
                
                // Import all pages from the existing PDF
                const copiedPages = await newPdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                copiedPages.forEach(page => newPdfDoc.addPage(page));
            }
        
            // Append the response text to the end
            const page = newPdfDoc.addPage();
            const { height } = page.getSize();
            const element = document.getElementById("response-card-content").textContent;
            page.drawText('Response:', {
                x: 50,
                y: height - 100,
                size: 20,
            });
            page.drawText(element, {
                x: 50,
                y: height - 150,
                size: 12,
            });
        
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'merged-response.pdf';
            link.click();
        };
        
    
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
            resetResponseText();
            setNotes([]);
            setOriginalPdfDataUrls([]); // Reset on new upload
    
            setIsLoading(true);
            setError(null);
            const files = Array.from(e.target.files);
            const newNotesPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async function(event) {
                        const currentPdfDataUrl = event.target.result;
                        setOriginalPdfDataUrls(prevDataUrls => [...prevDataUrls, currentPdfDataUrl]);
                        const extractedText = await extractAllTextFromPDF(currentPdfDataUrl);
                        resolve(`--- Start of Note from ${file.name} ---\n${extractedText}\n`);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });
    
            // [Rest of the function stays the samee
    
        Promise.all(newNotesPromises).then(notesArray => {
            // Here's the change. We are directly setting the state to the new notes array
            // instead of spreading the previous notes with the new ones.
            setNotes(notesArray);
            setIsLoading(false);
        }).catch(error => {
            setError("There was an error processing your files. Please ensure they are in the correct format and try again.");
            setIsLoading(false);
        });
    }
    

    const handleOptionChange = (value) => {
        setSelectedOption(value);
    }

    const resetResponseText = () => {
        setResponseText("");
    };



    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        resetResponseText();
    
        if (notes.length === 0 || !selectedOption) {
            alert("Please upload files and select an option.");
            setIsLoading(false);
            return;
        }
    
        const data = {
            notes,
            choice: selectedOption
        };
    
        try {
            const response = await axios.post('https://billing-automater-801d93465a2c.herokuapp.com/get-prompt', data, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
    
            const processedResponses = response.data.processedNotes;
            const concatenatedResponses = processedResponses.map((item, index) => {
                if (index % 2 === 0) {
                    return ''; 
                }
                return `--- Response for Note ${(index + 1) / 2} ---\n${item}\n`; 
            }).join('\n');
    
            setResponseText(concatenatedResponses);  // Only set the response text
    
        } catch (error) {
            setError("There was an error processing your request. Please try again.");
        }
    
        setIsLoading(false);
    }
    

























    return (
        <div>
            {isLoading && <Spin size="large" />}
            {error && <Alert message={error} type="error" showIcon />}
            
            <Title style={{ marginTop: '20px', marginBottom: '20px' }}>The Smartest Way to Elevate your Progress Notes</Title>
            
            <Card title="Input Text:" bordered={true} style={{ marginTop: '20px' }}>
    <TextArea 
        rows="10" 
        value={notes.map((note, index) => `--- Note ${index + 1} ---\n${note}\n`).join('\n')}
        // readOnly
    />
</Card>

            
            <label>Upload PDF Document:</label>
            <Input type="file" accept=".pdf" onChange={handleFileChange} multiple style={{ marginBottom: '20px' }} />
            
            <label>What information would you like?:</label>
            <Select onChange={handleOptionChange} style={{ width: '100%' }}>
    <Option value="">--Choose an option--</Option>
    <Option value="1">Patient's diagnosis</Option>
    <Option value="2">ICD10 and CPT Codes</Option>
    <Option value="3">Medicare verbiage if the patient can benefit for physical therapy.</Option>
    <Option value="4">Spell check</Option>
    <Option value="5">Care plan</Option>
    <Option value="6">Medication discrepancy</Option>
</Select>

            
<Button type="primary" onClick={handleSubmit} style={{ marginTop: '8px' }}>Submit</Button>

{responseText && (
    <Button onClick={downloadAsPDF} style={{ marginTop: '10px', marginLeft: '10px' }}>
        Download as PDF
    </Button>
)}


<Card title="Response:" bordered={true} style={{ marginTop: '20px' }}>
    <pre id="response-card-content" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{responseText}</pre>
</Card>



        </div>
    );
}

export default HomePage;
