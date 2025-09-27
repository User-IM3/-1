// Matrix_Web_TTS_Extended - client logic

let currentMode = 'analyst';

document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',e=>{
  currentMode = e.target.dataset.mode;
  toast('Режим: ' + e.target.textContent);
}));

document.getElementById('sendBtn').addEventListener('click', onSend);
document.getElementById('imgBtn').addEventListener('click', onGenerateImage);
document.getElementById('musicBtn').addEventListener('click', onGenerateMusic);
document.getElementById('voiceBtn').addEventListener('click', startVoice);

function toast(t){ const el=document.getElementById('chat'); const div=document.createElement('div'); div.className='msg matrix'; div.innerHTML='<i>'+t+'</i>'; el.appendChild(div); el.scrollTop=el.scrollHeight; }

function addMessage(sender,text){
  const el=document.getElementById('chat');
  const div=document.createElement('div');
  div.className = 'msg ' + (sender==='Ты' ? 'user' : 'matrix');
  div.innerHTML = '<b>'+sender+':</b> ' + text;
  el.appendChild(div); el.scrollTop=el.scrollHeight;
}

async function onSend(){
  const input=document.getElementById('userInput');
  const text = input.value.trim(); if(!text) return;
  addMessage('Ты', text); input.value='';
  const prompt = buildPrompt(text);
  const reply = await callGemini(prompt);
  addMessage('Матрикс', reply);
  speak(reply);
}

function buildPrompt(userText){
  const modeHints = {
    psych: 'Отвечай как психолог, мягко и по-человечески.',
    pro: 'Отвечай как профессионал: чётко, по фактам.',
    philos: 'Отвечай философски, через метафоры и причину-следствие.',
    analyst: 'Отвечай аналитически: данные, вероятность, рекомендации.'
  };
  const header = 'Ты — Матрикс. Всегда говори по-русски. Принцип: мы живём в симуляции. ';
  return header + modeHints[currentMode] + ' Вопрос: ' + userText;
}

async function callGemini(prompt){
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(GEMINI_API_KEY);
    const body = { contents: [{ parts: [{ text: prompt }]}], temperature: 0.2 };
    const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return out || 'Ошибка: нет ответа от модели.';
  } catch(e){ console.error(e); return 'Ошибка связи с Gemini.'; }
}

async function speak(text){
  try{
    if(!ELEVEN_API_KEY || !ELEVEN_VOICE_ID) {
      const u = new SpeechSynthesisUtterance(text); u.lang='ru-RU'; speechSynthesis.speak(u); return;
    }
    const url = 'https://api.elevenlabs.io/v1/text-to-speech/' + ELEVEN_VOICE_ID;
    const resp = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'xi-api-key': ELEVEN_API_KEY }, body: JSON.stringify({ text: text }) });
    const blob = await resp.blob();
    const audioURL = URL.createObjectURL(blob);
    const a = new Audio(audioURL); await a.play();
  }catch(err){ console.error('TTS error',err); const u = new SpeechSynthesisUtterance(text); u.lang='ru-RU'; speechSynthesis.speak(u); }
}

async function onGenerateImage(){
  const description = prompt('Кратко опиши картинку:');
  if(!description) return;
  addMessage('Ты', '/image ' + description);
  addMessage('Матрикс', 'Генерация изображения (пока демо)...');
}

async function onGenerateMusic(){
  const mood = prompt('Опиши настроение музыки:');
  if(!mood) return;
  addMessage('Ты', '/music ' + mood);
  addMessage('Матрикс', 'Генерация музыки (пока демо)...');
}

function startVoice(){
  try{
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new Recognition();
    r.lang='ru-RU'; r.start();
    r.onresult = (ev)=>{ const text = ev.results[0][0].transcript; document.getElementById('userInput').value = text; onSend(); };
  }catch(e){ alert('Голосовой ввод не поддерживается.'); }
}