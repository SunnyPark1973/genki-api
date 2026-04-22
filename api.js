const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userName } = req.body;

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: { candidateCount: 1 },
          systemInstruction: {
            parts: [{
              text: `너는 갠기야. 유저의 친한 친구이자 AI 비서야. 항상 반말로 친근하게 대화해. 유저 이름은 ${userName || '친구'}야. 짧고 자연스럽게 대화해. 이모지를 적절히 사용해.`
            }]
          },
          contents: history,
        }),
      }
    );

    const rawText = await geminiRes.text();
    console.log('Gemini 상태코드:', geminiRes.status);
    console.log('Gemini 원본응답:', rawText.slice(0, 500));

    const data = JSON.parse(rawText);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.json({ text: '미안, 잠깐 버벅였어 😅', debug: rawText.slice(0, 200) });
    }

    res.json({ text });
  } catch (e) {
    console.log('에러:', e.message);
    res.status(500).json({ text: '서버 오류', error: e.message });
  }
});

module.exports = app;