import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

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

const handleMessage = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

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
      prompt: data.get('prompt')
    })
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok){
    const data = await response.json();
    const parsedData = data.bot.trim();

    typeMessage(messageDiv, parsedData);
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