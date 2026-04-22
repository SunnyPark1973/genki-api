const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userName } = req.body;

    console.log('API KEY 존재:', !!GEMINI_API_KEY);
    console.log('받은 messages 수:', messages?.length);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    console.log('필터링 후 history 수:', history.length);
    console.log('첫 번째 role:', history[0]?.role);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `너는 갠기야. 유저의 친한 친구이자 AI 비서야.
항상 반말로 친근하게 대화해.
유저 이름은 ${userName || '친구'}야.
짧고 자연스럽게 대화해.
이모지를 적절히 사용해.
질문에는 정확하게 답해줘.`
            }]
          },
          contents: history,
        }),
      }
    );

    console.log('Gemini 응답 상태:', response.status);
    const data = await response.json();
    console.log('Gemini 응답:', JSON.stringify(data).slice(0, 200));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '미안, 잘 못들었어 😅';
    res.json({ text });
  } catch (e) {
    console.log('에러:', e.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = app;