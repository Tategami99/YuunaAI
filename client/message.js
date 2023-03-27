import bot from './assets/yuuna.png';
import user from './assets/user.svg';

//html stuff
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const img = document.getElementById('yuuna_img');

// let validEntry = false;

const mood = Object.freeze({
  Ecstatic: 'Ecstatic',
  Happy: 'Happy',
  Meh: 'Meh',
  Pout: 'Pout',
  Sad: 'Sad',
  Angry: 'Angry'
});
let aiMood = mood.Meh;

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

function changeImage(yuunaMood){
  img.src = './assets/moods/yuuna' + yuunaMood + '.png';
}

const handleMessage = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  // if(data.get('prompt').match(/^\s*$/) === null){
  //   validEntry = true
  // }

  //user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

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
      prompt: "\n " + data.get('prompt')
    })
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok){
    const data = await response.json();
    const parsedMessage = data.bot.trim();
    const parsedCom = data.com;

    console.log(data.jap);
    typeMessage(messageDiv, parsedMessage);
    aiMood = analyzeMessage(parsedCom);
    changeImage(aiMood);
  }else{
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong.";
    alert(err);
  }
}

form.addEventListener('submit', handleMessage);
form.addEventListener('keyup', (e) => {
  if(e.keyCode === 13){
    handleMessage(e);
  }
});
