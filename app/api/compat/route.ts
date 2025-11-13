import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from 'next/server';

// Next.js 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.GEMINI_API_KEY;

// 최소 CORS 설정 (효율성을 위해 필요한 헤더만 포함)
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 핸들러 (Preflight)
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    // API Key 누락 시 500 반환
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY 환경 변수 누락" }),
      { status: 500, headers: HEADERS }
    );
  }

  try {
    // 요청 본문 파싱 및 유효성 검사
    const body = await request.json();
    const messages = body.messages;

    // 클라이언트 요청 데이터 유효성 검사 (400 Bad Request)
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "요청 본문 형식 오류: 'messages' 배열이 누락되었거나 비어 있습니다." }),
        { status: 400, headers: HEADERS }
      );
    }

    // 클라이언트 초기화
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // OAI 메시지를 Gemini API 역할(user/model)로 변환
    const contents = messages.map((msg: any) => ({
      // OAI의 'assistant'를 Gemini의 'model'로 변환
      role: msg.role === 'user' ? 'user' : 'model', 
      parts: [{ text: msg.content }],
    }));
    
    const model = 'gemini-2.5-flash';

    // 마지막 메시지 전까지를 대화 기록으로 사용
    const history = contents.slice(0, -1);
    const lastMessage = contents[contents.length - 1].parts[0].text;

    // Chat 세션 생성 (여기에 구조화 설정 제거)
    const chat = ai.chats.create({ model, history });
    
    // 메시지 전송 (여기에 구조화 설정 제거)
    const result = await chat.sendMessage({ message: lastMessage });

    // OAI 호환 응답 구조 생성 
    const responseData = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.text, // 구조화된 JSON 대신 일반 텍스트가 반환됨
          },
          finish_reason: 'stop',
        },
      ],
      // usage 등 필수 필드
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };

    return new Response(JSON.stringify(responseData), { status: 200, headers: HEADERS });

  } catch (error) {
    console.error('[SOULVERSE] API Error:', (error as Error).message);
    
    // 요청 본문 파싱 실패, API 통신 실패 등 모든 내부 오류는 500 처리
    return new Response(
      JSON.stringify({ 
        error: '서버 내부 오류: API 통신 또는 요청 파싱 실패', 
        details: (error as Error).message // 자세한 오류 메시지 제공
      }),
      { status: 500, headers: HEADERS }
    );
  }
}