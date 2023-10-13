const { OpenAIAPI } = require("openai");

const openai = new OpenAIAPI({
    key: process.env.openAI
  });
  

const generatePrompt = (patientText, choice) => {
  const choiceNum = parseInt(choice, 10);
  switch (choiceNum) {
    case 1:
      return `Based on the following progress note and medications, please tell me what diagnosis the patient would have. Here is the progress note: ${patientText}`;
    case 2:
      return `Based on the following progress note, please provide ICD10 and CPT codes for this visit. Here is the patient's progress note: ${patientText}`;
    case 3:
      return `Based on the following progress note, please provide Medicare verbiage if the patient can benefit from physical therapy based on the patient's diagnoses. Here is the patient's progress note: ${patientText}`;
    case 4:
      return `Spell check the following progress note and notify me if there are any spelling errors. Here is the progress note: ${patientText}`;
    case 5:
      return `Based on the following progress note, create a care plan based on the patient's diagnosis. Here is the patient's progress note: ${patientText}`;
    case 6:
      return `Based on the following progress note, does the patient have any medication discrepencies? Here is the patient's progress note: ${patientText}`;
    default:
      return "Invalid choice.";
  }
};

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);
  const { notes, choice } = data;
  const processedNotes = [];

  for (const note of notes) {
    const prompt = generatePrompt(note, choice);

    try {
      const openAIAPIResponse = await openai.createCompletion({
        model: "gpt-3.5-turbo-16k",
        prompt: prompt,
        temperature: 1,
      });

      const responseContent = openAIAPIResponse.choices[0].text.trim();
      processedNotes.push({ note, response: responseContent });
    } catch (error) {
      processedNotes.push({
        note,
        response: `Error processing this note: ${error.message}`,
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processedNotes }),
  };
};
