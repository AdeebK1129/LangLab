import {useState, useEffect, FormEvent} from 'react';
import {useParams, useNavigate, Navigate} from 'react-router-dom';
import {nanoid} from 'nanoid';
import {MessageInput} from '@/components/ui/message-input';
import {MessageList} from '@/components/ui/message-list';
import {useAuth} from '@/auth/AuthUserProvider';
import {addWord, fetchKnownWords} from '@/utils/vocab';

type ChatMode = 'beginner' | 'intermediate' | 'advanced' | 'progression';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function ChatPage() {
  const {user} = useAuth();
  const {mode} = useParams<{mode: ChatMode}>();
  const navigate = useNavigate();

  const [context, setContext] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeEP, setIncludeEP] = useState(false);

  /** Loads known words and fetches conversation scenario */
  useEffect(() => {
    if (!user || !mode) return;
    (async () => {
      setLoadingContext(true);
      try {
        const kw = await fetchKnownWords(user.uid);
        setKnownWords(kw);

        const token = await user.getIdToken();
        const res = await fetch(`/api/chat/context/${mode}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        if (!res.ok) {
          console.error('Failed to fetch scenario:', await res.text());
          setContext('❗️ Failed to load scenario.');
        } else {
          const {context} = await res.json();
          setContext(context);
        }
      } catch (e) {
        console.error(e);
        setContext('❗️ Error loading scenario.');
      } finally {
        setLoadingContext(false);
      }
    })();
  }, [user, mode]);

  if (!user) return <Navigate to="/" replace />;
  if (loadingContext)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg font-medium">Loading scenario…</div>
      </div>
    );

  /**
   * Transcribes audio blob to text using server API
   * @param blob Audio data to transcribe
   * @return The transcribed text
   */
  const transcribeAudio = async (blob: Blob): Promise<string> => {
    const form = new FormData();
    form.append('file', blob, 'speech.webm');
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: form,
    });
    const {text} = await res.json();
    return text;
  };

  /**
   * Handles sending user message and getting AI response
   */
  const handleSend = async () => {
    if (!input.trim() || !mode) return;

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    setConversation((c) => [...c, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/chat/${mode}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          context,
          conversation: conversation.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          knownWords,
          includeEnglishPinyin: includeEP,
          userMessage: userMsg.content,
        }),
      });
      const {reply} = await res.json();

      const aiMsg: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: reply,
        createdAt: new Date(),
      };
      setConversation((c) => [...c, aiMsg]);

      // Store new Chinese characters
      const raw = reply.match(/\p{Script=Hani}+/gu) ?? [];
      const unseen = raw.filter((w: string) => !knownWords.includes(w));
      const uniqueNew: string[] = Array.from(new Set(unseen));
      if (uniqueNew.length) {
        await Promise.all(uniqueNew.map((w) => addWord(user.uid, w)));
        setKnownWords((k) => [...k, ...uniqueNew]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Ends the current chat session and navigates to feedback page
   */
  const handleEnd = async () => {
    if (!mode) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/chat/${mode}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({context, conversation}),
    });
    const feedback = await res.json();
    navigate(`/feedback/${mode}`, {
      state: {
        context,
        conversation,
        feedback,
        newWordsCount: knownWords.length,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm m-4">
        <strong>Scenario:</strong>
        <p className="mt-2">{context}</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <MessageList messages={conversation} isTyping={isGenerating} />
      </div>

      <div className="flex items-center px-4 space-x-4 mb-2">
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeEP}
            onChange={(e) => setIncludeEP(e.target.checked)}
          />
          <span>EN + 拼音</span>
        </label>
        <button
          onClick={handleEnd}
          className="ml-auto bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-full transition"
        >
          End Session
        </button>
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t p-4"
      >
        <MessageInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          isGenerating={isGenerating}
          placeholder="Type your message… or press 🎤"
          submitOnEnter
          transcribeAudio={transcribeAudio}
        />
      </form>
    </div>
  );
}