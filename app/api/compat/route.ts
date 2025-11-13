import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from 'next/server';

// Next.js 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.GEMINI_API_KEY;

// CORS 설정: 모든 출처 허용 (개발 및 호환성 목적으로 설정)
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 메서드 핸들러 (CORS Preflight 요청 처리)
export async function OPTIONS() {
  return new Response(null, { status: 200, headers });
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." }),
      { status: 500, headers }
    );
  }

  try {
    // 요청 본문에서 messages 배열을 가져옵니다. (OAI 호환 형식)
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 요청 본문: 'messages' 배열이 필요합니다." }),
        { status: 400, headers }
      );
    }

    // 1. GoogleGenAI 클라이언트 초기화 (이전 GoogleGenerativeAI 이름 오류 수정 완료)
    const ai = new GoogleGenAI(API_KEY);

    // 2. 대화 기록 준비
    // OAI 메시지 포맷('assistant' 역할)을 Gemini API 포맷('model' 역할)으로 변환합니다.
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model', 
      parts: [{ text: msg.content }],
    }));
    
    // 모델 선택 (기본값)
    const model = 'gemini-2.5-flash';

    // 3. 채팅 세션 생성
    // history에는 마지막 사용자 메시지 직전까지의 대화 내용을 포함합니다.
    const chat = ai.chats.create({
      model: model,
      history: contents.slice(0, -1),
    });

    // 4. 메시지 전송 및 응답 받기
    // 마지막 메시지가 실제 프롬프트입니다.
    const lastMessage = contents[contents.length - 1].parts[0].text;
    const result = await chat.sendMessage({ message: lastMessage });

    // 5. OAI 호환 응답 JSON 구성
    const responseData = {
      id: Date.now().toString(), // 임시 ID
      object: 'chat.completion',
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant', // OAI 호환성을 위해 'assistant' 사용
            content: result.text,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0, // 실제 토큰 사용량은 여기서 계산하지 않음
        completion_tokens: 0,
        total_tokens: 0,
      },
    };

    return new Response(JSON.stringify(responseData), { status: 200, headers });

  } catch (error) {
    console.error('API Error:', error);
    // 에러 발생 시 사용자에게 에러 상세 정보를 포함하여 응답합니다.
    return new Response(
      JSON.stringify({ error: '요청 처리 중 오류가 발생했습니다.', details: (error as Error).message }),
      { status: 500, headers }
    );
  }
}