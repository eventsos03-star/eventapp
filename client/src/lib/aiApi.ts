import axios from "axios";

export interface AiSource {
  source: string;
  section: string;
}

export interface AiAnswer {
  answer: string;
  sources: AiSource[];
}

export async function askAiDocs(question: string): Promise<AiAnswer> {
  const { data } = await axios.post<{
    success: boolean;
    message: string;
    data: AiAnswer;
  }>("/api/ai/ask", { question });

  return data.data;
}