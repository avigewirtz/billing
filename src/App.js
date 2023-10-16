import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import Tesseract from 'tesseract.js';
import pdfMake from "pdfmake/build/pdfmake";
// import { PDFDocument } from 'pdf-lib';
import pdfFonts from "pdfmake/build/vfs_fonts";
// import { BrowserRouter as Router } from 'react-router-dom';
import {
  ChakraProvider, Spinner, Flex, Box, Heading, Button, Input, Select, Text, FormControl, FormLabel
} from '@chakra-ui/react';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseText, setResponseText] = useState([]);
  // eslint-disable-next-line no-unused-vars
const [originalPdfDataUrls, setOriginalPdfDataUrls] = useState([]);




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
  console.log("Notes state:", notes);  // Debugging line
  console.log("Selected Option:", selectedOption); // Debugging line

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
    // Update this line to use your Netlify function URL.
    const response = await axios.post('/.netlify/functions/openAI', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Directly save the array into the state
    setResponseText(response.data.processedNotes);
    

  } catch (error) {
    setError("There was an error processing your request. Please try again.");
  }

  setIsLoading(false);
}


return (
  <ChakraProvider>
    <Box as="div">
      <Box as="header" bg="blue.500" p={4} color="white" textAlign="center">
        <Heading as="h1">VistaScribe</Heading>
      </Box>

      <Box 
  p={4} 
  w="50%" 
  m="auto"
  mt={10}
  bg="gray.50"         // Set background color to a light blue from Chakra UI theme
  border="2px solid"    // Set border width to 2 pixels and style to solid
  borderColor="blue.500" // Set border color to a darker blue from Chakra UI theme
  borderRadius="md"     // Set border radius to a medium value from Chakra UI theme
>
{isLoading && (
  <Flex justifyContent="center" mt={4}>  {/* Added marginTop for some spacing */}
    <Spinner size="xl" color="blue.500" />
  </Flex>
)}

        {error && <Text color="red.500">Error: {error}</Text>}
        
        <Heading as="h2" my={4}>Elevate your Progress Notes</Heading>
        
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <FormControl id="file-upload" mt={4}>
          <FormLabel fontWeight="bold">Upload Progress Note(s):</FormLabel>

            <Input type="file" accept=".pdf" onChange={handleFileChange} multiple />
          </FormControl>

          <FormControl id="info-selection" mt={4}>
          <FormLabel fontWeight="bold">What information would you like?</FormLabel>
            <Select placeholder="--Choose an option--" onChange={(e) => handleOptionChange(e.target.value)}>
              <option value="1">Patient's diagnosis</option>
              <option value="2">ICD10 and CPT Codes</option>
              <option value="3">Medicare verbiage if the patient can benefit for physical therapy.</option>
              <option value="4">Spell check</option>
              <option value="5">Care plan</option>
              <option value="6">Medication discrepancy</option>
            </Select>
          </FormControl>
          
          <Box mt={4}>
          <Flex justifyContent="center" mt={4}>  {/* Added marginTop for some spacing */}
  <Button type="submit" colorScheme="blue">Submit</Button>
</Flex>


          </Box>

          {responseText.length > 0 && (
  <Box mt={4}>
    <Heading as="h3">Response(s):</Heading>
    <Box bg="gray.100" p={4} rounded="md" mt={2} overflowY="auto" overflowX="hidden" maxHeight="400px">
      {responseText.map((text, index) => (
        <pre key={index} id={`response-card-content-${index}`} style={{ whiteSpace: "pre-wrap" }}>
          {`--- Response for ${index + 1} ---\n${text}\n`}
        </pre>
      ))}
    </Box>
  </Box>
)}


        </form>
      </Box>

      <Box as="footer"></Box>
    </Box>
  </ChakraProvider>
);
}

export default App;
