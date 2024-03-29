import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import Tesseract from 'tesseract.js';
import pdfMake from "pdfmake/build/pdfmake";
import logo from './logo2.png';
import Header from './Header';
import Footer from './Footer';

// import { PDFDocument } from 'pdf-lib';
import pdfFonts from "pdfmake/build/vfs_fonts";
// import { BrowserRouter as Router } from 'react-router-dom';
import {
  ChakraProvider, Checkbox, Spinner, Flex, Box, Heading, Button, Input, Text, FormControl, CheckboxGroup, FormLabel, Textarea
} from '@chakra-ui/react';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

function App() {
  const [notes, setNotes] = useState([]);
  // const [selectedOption, setSelectedOption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseText, setResponseText] = useState([]);
  const [noteNames, setNoteNames] = useState([]);
  const [selectedOption, setSelectedOption] = useState([]);
  const [textInput, setTextInput] = useState("");



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

      if (files.length > 10) {
        setError("You can upload a maximum of 10 files at a time.");
        setIsLoading(false);
        return;
      }
    
      const newNotesPromises = files.map(file => {
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = async function(event) {
                  const currentPdfDataUrl = event.target.result;
                  setOriginalPdfDataUrls(prevDataUrls => [...prevDataUrls, currentPdfDataUrl]);
                  const extractedText = await extractAllTextFromPDF(currentPdfDataUrl);
                  resolve(`${extractedText}\n`);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      });

    

  Promise.all(newNotesPromises).then(notesArray => {
      // Here's the change. We are directly setting the state to the new notes array
      // instead of spreading the previous notes with the new ones.
      const newNoteNames = files.map(file => file.name);
      setNoteNames(newNoteNames);
      setNotes(notesArray);
      setIsLoading(false);
  }).catch(error => {
      setError("There was an error processing your files. Please ensure they are in the correct format and try again.");
      setIsLoading(false);
  });
}


const handleOptionChange = (values) => {
  setSelectedOption(values);
};



const resetResponseText = () => {
  setResponseText("");
};



const handleSubmit = async () => {
  console.log("Notes state:", notes);  // Debugging line
  console.log("Selected Option:", selectedOption); // Debugging line

  setError(null);
  resetResponseText();

  if (notes.length === 0 && selectedOption.length === 0 && textInput.trim() === "") {
    alert("Please upload file(s) or paste note, and select an option.");
    return;
  }

  if (notes.length === 0 && textInput.trim() === "" && !selectedOption.length === 0) {
    alert("Please upload file(s) or paste note.");
    return;
  }

  if (selectedOption.length === 0 && !notes.length === 0) {
    alert("Please select an option.");
    return;
  }

  setIsLoading(true);

  // If there is pasted text, add it to the notes array
  if (textInput.trim() !== "") {
    notes.push(textInput);
    noteNames.push("Pasted Note"); // Add a placeholder name for the pasted note
  }

  const data = {
    notes,
    choices: selectedOption 
  };


  try {
    const response = await axios.post('/api/get-prompt', data, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log(response.data);  // Debugging line

    const taskIds = response.data.task_ids;  // Assuming the backend sends this as 'task_ids'
    const completedResults = [];  // Temporary array to hold completed results

    taskIds.forEach((taskId, index) => {
      const intervalId = setInterval(async () => {
        const resultResponse = await axios.get(`/api/get-result/${taskId}`);
        console.log("Result Response: ", resultResponse.data);
        
        if (resultResponse.data.status === 'SUCCESS') {
          clearInterval(intervalId);  // Stop polling this task ID
          completedResults[index] = resultResponse.data.result;  // Store the result in the temporary array
          console.log(`Task ${taskId} completed.`);
      
          const isAllTasksComplete = completedResults.length === taskIds.length && !completedResults.includes(undefined);
          console.log("Is All Tasks Complete?", isAllTasksComplete);
      
          if (isAllTasksComplete) {
            setIsLoading(false);
            setResponseText(completedResults);  // Update state once all tasks are complete
          }
        }
      }, 5000);  // Poll every 5 seconds
      
    });
  } catch (error) {
    setError("There was an error processing your request. Please try again.");
    setIsLoading(false);
  }
};



return (
  <ChakraProvider>
    <Box as="div">
    <Header logoSrc={logo} />









      <Box 
  p={4} 
  w="50%" 
  m="auto"
  mt={10}
  bg="gray.50"         // Set background color to a light blue from Chakra UI theme
  border="2px solid"    // Set border width to 2 pixels and style to solid
  borderColor="#8C52FF" // Set border color to a darker blue from Chakra UI theme
  borderRadius="md" 
  marginBottom="100px"    // Set border radius to a medium value from Chakra UI theme
>
{isLoading && (
  <Flex justifyContent="center" mt={4}>  {/* Added marginTop for some spacing */}
    <Spinner size="xl" color="#8C52FF" />
  </Flex>
)}

        {error && <Text color="red.500">Error: {error}</Text>}
        
        <Heading as="h2" my={4} textAlign="center">Elevate Your Progress Notes</Heading>

        
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <FormControl id="file-upload" mt={4}>
          <FormLabel fontWeight="bold">Upload Progress Notes</FormLabel>
      
            <Input type="file" accept=".pdf" onChange={handleFileChange} multiple />
          </FormControl>

          <FormControl id="text-input" mt={4}>
    <FormLabel fontWeight="bold">And/Or Paste Note</FormLabel>
    <Textarea 
        placeholder="Enter your text here" 
        value={textInput} 
        onChange={(e) => setTextInput(e.target.value)}
    />
</FormControl>


          <FormControl id="info-selection" mt={4}>
          <FormLabel fontWeight="bold">Choose one or more options below</FormLabel>
       

          <CheckboxGroup onChange={handleOptionChange}>
  <Flex direction="column">
    <Checkbox value="1">Patient's diagnosis</Checkbox>
    <Checkbox value="2">ICD10 and CPT Codes</Checkbox>
    <Checkbox value="3">Medicare verbiage if the patient can benefit from physical therapy</Checkbox>
    <Checkbox value="4">Spell check</Checkbox>
    <Checkbox value="5">Care plan</Checkbox>
    <Checkbox value="6">Medication discrepancy</Checkbox>
  </Flex>
</CheckboxGroup>

</FormControl>

          
          
          <Box mt={4}>
          <Flex justifyContent="center" mt={4}>  {/* Added marginTop for some spacing */}
          <Button type="submit" bg="#8C52FF" color="white">
  Submit
</Button>
</Flex>


          </Box>
          {responseText.length > 0 && (
  <Box mt={4}>
    {/* <Heading as="h3" style={{ marginBottom: '16px' }}>Response</Heading> */}
    {responseText.map((text, index) => (
      <>
        <Text style={{ marginTop: '16px', fontWeight: 'bold', fontSize: '16px' }}>
  Response for {noteNames[index]}
</Text>

        <Box 
          bg="gray.100" 
          p={4} 
          rounded="md" 
          mt={2} 
          overflowY="auto" 
          overflowX="hidden" 
          maxHeight="400px"
          key={index}
        >
          <pre id={`response-card-content-${index}`} style={{ whiteSpace: "pre-wrap" }}>
            {`${text}\n\n`}
          </pre>
        </Box>
      </>
    ))}
  </Box>
)}






        </form>
      </Box>

      <Box as="footer" position="fixed" bottom="0" width="100%">
<Footer/></Box>
    </Box>
  </ChakraProvider>
);
}

export default App;
