import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';
import sentiment from 'sentiment';
import translatte from 'translatte';

dotenv.config();

const maxConversation = 10;
const initialPrompt = process.env.OPENAI_PROMPT;
let appendedPrompt = initialPrompt;

//sentiment stuff
const sentimentObj = new sentiment();

//open ai stuff
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://yuunacreates.000webhostapp.com/');
    res.status(200).send({
        message: 'Sheeeeeeesh',
    })
})

app.post('/', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    try {
        appendedPrompt += req.body.prompt;
        if(appendedPrompt.length >= 2900){
            appendedPrompt = initialPrompt;
        }
        const prompt = appendedPrompt;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 1,
            max_tokens: 500,
            top_p: 1,
            frequency_penalty: 0.25,
            presence_penalty: 0.25,
            stop: ["\''\''\''"],
        });
        console.log(prompt + response.data.choices[0].text);
        const analysisObj = sentimentObj.analyze(response.data.choices[0].text.trim());
        const translation = await translatte(response.data.choices[0].text.trim(), {to: 'ja'});
        res.status(200).send({
           bot: response.data.choices[0].text,
           com: analysisObj.comparative,
           jap: translation.text
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error })
    }
})

app.listen(5000, () => console.log('Yuuna wants to talk to you on http://localhost:5000'));