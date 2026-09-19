import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Trash2, ArrowLeft, Lightbulb, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

interface ChatScreenProps {
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
}

export default function ChatScreen({ isDark, theme }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "مرحباً بك في **مساعد مصحف التبيان**. أنا رفيقك الذكي للتدبر، التفكر والبحث في كتاب الله الكريم.\n\nكيف يمكنني إعانتك اليوم؟ يمكنك سؤالي عن تفسير آية، القصص الواردة في القرآن، معاني الكلمات البلاغية، أو كيف نطبق الأخلاق القرآنية في حياتنا اليومية."
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Suggested prompt questions
  const suggestedPrompts = [
    "ما رصيد الصبر العظيم في القرآن الكريم؟",
    "اشرح لي فضل سورة الكهف ويوم الجمعة",
    "اذكر آداب تلاوة القرآن ومستحباتها",
    "بماذا تشير آيات بناء الإنسان في القرآن الكريم؟"
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    setChatError(null);
    const userMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: textToSend
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsSending(true);

    try {
      // Map message structure to history expected by /api/chat
      const historyContext = messages.map(msg => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyContext
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "حدث قصور في الخادم الذكي للتدبر.");
      }

      const data = await response.json();
      const aiResponse: Message = {
        id: String(Date.now() + 1),
        role: "model",
        content: data.result || "عذراً لم نتمكن من الحصول على رد مناسب."
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatError(err.message || "فشلت التغطية الصادقة للإجابة حالياً. يرجى مراجعة الخادم.");
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        content: "مرحباً بك في **مساعد مصحف التبيان**. أنا رفيقك الذكي للتدبر والبحث القرآني.\n\nكيف يمكنني إعانتك اليوم؟ يمكنك التفاعل معي بخصوص أي آية أو مفهوم قرآني."
      }
    ]);
    setChatError(null);
  };

  return (
    <div id="chat-screen-root" className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col h-[75vh]">
      
      {/* Top action header: Clear Chat & Title */}
      <div id="chat-header-action" className={`flex items-center justify-between border-b pb-3 mb-4 ${
        theme === "emerald-velvet" ? "border-[#10b981]/30 text-[#FAF8F5]" :
        theme === "gold-velvet" ? "border-[#c5a85c]/30 text-[#011c14]" :
        theme === "navy-velvet" ? "border-slate-200 text-slate-800" :
        isDark ? "border-slate-800 text-slate-100" : "border-slate-100 text-slate-800"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            theme === "emerald-velvet" ? "bg-[#10b981]/15 text-[#34d399]" :
            theme === "gold-velvet" ? "bg-[#c5a85c]/10 text-[#c5a85c]" :
            theme === "navy-velvet" ? "bg-[#3F63C6]/10 text-[#3F63C6]" :
            isDark ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-800"
          }`}>
            <Sparkles size={16} />
          </div>
          <span className={`text-sm font-bold ${
            theme === "emerald-velvet" ? "text-[#FAF8F5]" :
            theme === "gold-velvet" ? "text-[#011c14]" :
            isDark ? "text-slate-100" : "text-slate-800"
          }`}>رفيق التدبر والتبيان بالذكاء الاصطناعي</span>
        </div>

        {messages.length > 1 && (
          <button
            id="clear-chat-act"
            onClick={clearChat}
            className={`text-xs transition flex items-center gap-1 font-bold cursor-pointer ${
              theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-red-400" :
              theme === "gold-velvet" ? "text-slate-600 hover:text-red-600" :
              isDark ? "text-slate-500 hover:text-red-400" : "text-slate-405 hover:text-red-500"
            }`}
            title="تفريغ المحادثة الحالية"
          >
            <Trash2 size={13} />
            <span>مسح المحادثة</span>
          </button>
        )}
      </div>

      {/* Messages Canvas Scroll Body */}
      <div id="messages-scroll-body" className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-thin">
        {messages.map((msg) => (
          <div
            id={`chat-msg-${msg.id}`}
            key={msg.id}
            className={`flex gap-3 text-right ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar icon */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" 
                ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011a12]" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011a12]" : "bg-emerald-800 text-white") 
                : (theme === "emerald-velvet" ? "bg-[#011a12] text-[#34d399] border border-[#10b981]/30" :
                   theme === "gold-velvet" ? "bg-white text-[#c5a85c] border border-[#c5a85c]/30" :
                   isDark ? "bg-slate-900 text-emerald-405 border border-slate-800" : "bg-emerald-50 text-emerald-800 border border-emerald-100")
            }`}>
              {msg.role === "user" ? <User size={15} /> : <Sparkles size={15} />}
            </div>

            {/* Bubble contents */}
            <div className={`p-4 rounded-2xl max-w-[85%] text-xs md:text-sm leading-relaxed ${
              msg.role === "user"
                ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011a12] rounded-tr-none font-semibold" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011a12] rounded-tr-none font-semibold" : "bg-emerald-800 text-white rounded-tr-none")
                : theme === "emerald-velvet" ? "bg-[#011a12] border border-[#10b981]/30 text-[#FAF8F5] rounded-tl-none markdown-body prose-invert" :
                  theme === "gold-velvet" ? "bg-white border border-[#c5a85c]/30 text-[#011c14] rounded-tl-none shadow-sm markdown-body" :
                  isDark ? "bg-slate-900 border border-slate-850 text-slate-150 rounded-tl-none markdown-body prose-invert" : 
                  "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none markdown-body"
            }`}>
              {msg.role === "model" ? (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading shimmer if AI is contemplating */}
        {isSending && (
          <div className="flex gap-3 text-right">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              theme === "emerald-velvet" ? "bg-[#011a12] border border-[#10b981]/30 text-[#34d399]" :
              theme === "gold-velvet" ? "bg-white border border-[#c5a85c]/30 text-[#c5a85c]" :
              isDark ? "bg-slate-900 border border-slate-805 text-emerald-400" : "bg-emerald-50 border border-emerald-100"
            }`}>
              <Sparkles size={15} className={`${theme === "emerald-velvet" ? "text-[#34d399]" : theme === "gold-velvet" ? "text-[#c5a85c]" : "text-emerald-800"} animate-spin`} />
            </div>
            <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm text-xs font-semibold ${
              theme === "emerald-velvet" ? "bg-[#011a12] border border-[#10b981]/30 text-[#FAF8F5]/60" :
              theme === "gold-velvet" ? "bg-white border border-[#c5a85c]/30 text-slate-500" :
              isDark ? "bg-slate-900 border border-slate-850 text-slate-500" : "bg-white border-slate-100 text-slate-400"
            }`}>
              <p className="flex items-center gap-1.5 grayscale opacity-75">
                <span>يتأمل المفسر ويرتب الهدايات حالياً...</span>
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {chatError && (
          <div className="p-4 bg-red-50 border border-red-101 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts helper cards (only shown initially or when history is short) */}
      {messages.length <= 2 && !isSending && (
        <div id="adhkar-suggests" className="mb-4 space-y-2">
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <Lightbulb size={13} className={theme === "emerald-velvet" ? "text-[#34d399]" : theme === "gold-velvet" ? "text-[#c5a85c]" : ""} />
            <span>أسئلة ومواضيع مقترحة لبدء التدبر:</span>
          </p>
          <div className={`grid grid-cols-2 gap-2 text-xxs font-bold ${
            theme === "emerald-velvet" ? "text-[#34d399]" :
            theme === "gold-velvet" ? "text-[#011c14]" :
            isDark ? "text-emerald-450" : "text-emerald-800"
          }`}>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                id={`pref-prompt-${idx}`}
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className={`p-3 border rounded-xl text-right transition cursor-pointer leading-normal whitespace-normal block w-full ${
                  theme === "emerald-velvet" 
                    ? "bg-[#011a12]/60 hover:bg-[#011a12] border-[#10b981]/20 hover:border-[#10b981]/50 text-[#FAF8F5]" 
                    : theme === "gold-velvet"
                      ? "bg-white hover:bg-slate-50 border-[#c5a85c]/20 hover:border-[#c5a85c]/50 text-slate-700"
                      : isDark 
                        ? "bg-slate-900/60 hover:bg-slate-850 border-slate-800 hover:border-slate-700" 
                        : "bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/60 hover:border-emerald-200"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Static text input form */}
      <form
        id="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputVal);
        }}
        className="flex items-center gap-2 mt-2"
      >
        <div className={`relative flex-1 rounded-2xl shadow-sm focus-within:ring-2 transition h-12 flex items-center border ${
          theme === "emerald-velvet" ? "bg-[#011a12] border-[#10b981]/30 text-[#FAF8F5] focus-within:ring-[#10b981]/50" :
          theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-[#011c14] focus-within:ring-[#c5a85c]/50" :
          isDark ? "bg-slate-900 border-slate-800 text-slate-100 focus-within:ring-emerald-500" : "bg-white border-slate-200 text-slate-800 focus-within:ring-emerald-650"
        }`}>
          <input
            id="chat-text-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSending}
            placeholder="اسأل رفيق التبيان عن التفسير، قصص الآيات أو الهدايات..."
            className={`w-full bg-transparent outline-none border-none py-3 pl-4 pr-1 text-xs md:text-sm rtl placeholder-slate-500 ${
              theme === "emerald-velvet" ? "text-[#FAF8F5] pr-4 placeholder-[#FAF8F5]/40" :
              theme === "gold-velvet" ? "text-[#011c14] pr-4 placeholder-slate-400" :
              isDark ? "text-slate-100 pr-4" : "text-slate-850 pr-4 placeholder-slate-400"
            }`}
          />
        </div>

        <button
          id="submit-chat-btn"
          type="submit"
          disabled={!inputVal.trim() || isSending}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white transition shadow cursor-pointer ${
            !inputVal.trim() || isSending 
              ? "bg-slate-350 pointer-events-none" 
              : theme === "emerald-velvet"
                ? "bg-[#10b981] hover:bg-[#10b981]/90 text-[#011a12]"
                : theme === "gold-velvet"
                  ? "bg-[#c5a85c] hover:bg-[#c5a85c]/90 text-[#011a12]"
                  : "bg-emerald-800 hover:bg-emerald-900"
          }`}
        >
          <Send size={18} className="rotate-180" />
        </button>
      </form>
    </div>
  );
}
