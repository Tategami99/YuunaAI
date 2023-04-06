import bot from './assets/yuuna.png';
import user from './assets/user.svg';

//keyboard stuff
let voiceListening = false;

//html stuff
const form = document.querySelector('form');
const textArea = form.elements['prompt'];
const chatContainer = document.querySelector('#chat_container');
const img = document.getElementById('yuuna_img');
const subtitleDiv = document.getElementById('subtitles');

//synthesis stuff
const synth = window.speechSynthesis;
const yuunaVoice = new SpeechSynthesisUtterance();
yuunaVoice.volume = 1; //0 to 1
yuunaVoice.rate = 1.75; //0.1 to 10
yuunaVoice.pitch = 1.8; //0 to 2

//yuunas mood
const mood = Object.freeze({
  Ecstatic: 'Ecstatic',
  Happy: 'Happy',
  Meh: 'Meh',
  Pout: 'Pout',
  Sad: 'Sad',
  Angry: 'Angry'
});
let aiMood = mood.Meh;

//speech recognition stuff
const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
const recognition = new SpeechRecognition();
recognition.continuous = false;

//typing stuff
let loadInterval;
function typingMessage(element){
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '';
    if(element.textContext === '....'){
      element.textContent = '';
    }
  }, 300);
}
function typeMessage(element, text){
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length){
      element.textContent += text.charAt(index);
      index++;
    }else{
      clearInterval(interval);
    }
  }, 20);
}
function generateUniqueID(){
  const timeStamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timeStamp}-${hexadecimalString}`;
}
function chatStripe(isAI, value, uniqueID){
  return (
    `
    <div class="wrapper ${isAI && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img
            src="${isAI ? bot : user}"
            alt="${isAI ? 'bot' : 'user'}"
          />
        </div>
        <div class="message" id=${uniqueID}>${value}</div>
      </div>
    </div>
    `
  )
}

//sentiment stuff
function analyzeMessage(com){
  const roundedComparitiveScore = Math.round(com * 100) / 100;
  let moodFromText = mood.Meh;
  if(roundedComparitiveScore < -0.50){
    moodFromText = mood.Angry;
  }
  else if (roundedComparitiveScore <= -0.20){
    moodFromText = mood.Sad
  }
  else if (roundedComparitiveScore <= 0){
    moodFromText = mood.Pout
  }
  else if (roundedComparitiveScore <= 0.20){
    moodFromText = mood.Meh
  }
  else if (roundedComparitiveScore <= 0.50){
    moodFromText = mood.Happy
  }
  else{
    moodFromText = mood.Ecstatic
  }
  console.log(com);
  console.log("mood from text: " + moodFromText);
  return moodFromText;
}

//more mood stuff
function changeImage(yuunaMood){
  img.src = './assets/moods/yuuna' + yuunaMood + '.png';
}

//jap stuff
function changeSubtitles(text){
  subtitleDiv.innerHTML = text;
}
function speak(text){
  //check if speaking
  if(synth.speaking){
    console.log('already speaking');
    return;
  }else{
    yuunaVoice.text = text;
    yuunaVoice.voiceURI = 'Microsoft Sayaka - Japanese (Japan)';
    yuunaVoice.lang = 'ja-JP';
    speechSynthesis.speak(yuunaVoice);
    console.log('rate: ' + yuunaVoice.rate);
  }
}

//voice recognition stuff
function toggleVoice(e){
  voiceListening = !voiceListening;
  console.log(voiceListening);
  if(!voiceListening){
    recognition.stop();
    return;
  }
  recognition.start();
}

const handleMessage = async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  let promptToBot = formData.get('prompt');

  //user's chatstripe
  chatContainer.innerHTML += chatStripe(false, promptToBot);

  form.reset();

  //bot's chatstripe
  const uniqueID = generateUniqueID();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueID);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  const messageDiv = document.getElementById(uniqueID);
  typingMessage(messageDiv);

  //fetch data from server
  const response = await fetch('http://localhost:5000', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      prompt: "\n " + promptToBot
    })
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok){
    const data = await response.json();
    const parsedMessage = data.bot.trim();
    const parsedCom = data.com;

    changeSubtitles(data.jap);
    typeMessage(messageDiv, parsedMessage);
    aiMood = analyzeMessage(parsedCom);
    changeImage(aiMood);
    speak(data.jap)
  }else{
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong.";
    alert(err);
  }
}

//form listeners
form.addEventListener('submit', handleMessage);
form.addEventListener('keyup', (e) => {
  if(e.keyCode === 13){
    if(synth.speaking){
      return;
    }
    handleMessage(e);
  }
  else if(e.keyCode === 39){
    toggleVoice(e);
  }
  else if(e.keyCode === 190){
    if(yuunaVoice.rate + 0.25 > 2){
      yuunaVoice.rate = 2;
    }else{
      yuunaVoice.rate += 0.25;
    }
  }
  else if(e.keyCode === 188){
    if(yuunaVoice.rate - 0.25 < 0.25){
      yuunaVoice.rate = 0.25;
    }else{
      yuunaVoice.rate -= 0.25;
    }
  }
});

//speech listeners
recognition.onstart = function() {
  form.focus();
  console.log('speech active');
}
recognition.onend = function() {
  form.focus();
  console.log('speech inactive');
}
recognition.onresult = function(event) {
  textArea.value = event.results[0][0].transcript;
}
