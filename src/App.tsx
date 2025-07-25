import React, { useState, useRef } from 'react';
import { Send, Upload, Search, Brain, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem("chat_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("chat_session_id", sessionId);
  }
  return sessionId;
}

const suggestions = [
  {
    icon: <Upload className="w-5 h-5" />,
    title: 'Upload PDF',
    subtitle: 'Upload documents for instant analysis',
    color: 'bg-primary/10 text-primary',
    type: 'pdf',
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Web Search',
    subtitle: 'Get real-time information from the web',
    color: 'bg-blue-500/10 text-blue-400',
    type: 'web',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'AI Assistant',
    subtitle: 'Chat with Gemini 2.5 Flash for any questions',
    color: 'bg-purple-500/10 text-purple-400',
    type: 'llm',
  }
];

const FILTER_TABS = ["All", "Text", "Image", "Summary", "Q&A", "Code", "Analytics"];

const App = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'pdf' | 'web' | 'llm' | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [sessionId] = useState(getOrCreateSessionId());

  const uploadPDF = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BACKEND_URL}/upload_pdf`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('PDF upload failed');
    const data = await res.json();
    return data.pdf_path;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setMessageType('pdf');
      try {
        const uploadedPath = await uploadPDF(file);
        setPdfPath(uploadedPath);
        toast({ title: 'PDF uploaded', description: `${file.name} uploaded & ready.` });
      } catch {
        toast({ title: 'PDF upload failed', variant: 'destructive' });
        setPdfPath(null);
      }
    } else {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF file', variant: 'destructive' });
    }
  };

  const handleSuggestion = (type: 'pdf' | 'web' | 'llm') => {
    if (type === 'pdf') fileInputRef.current?.click();
    else setMessageType(type);
  };

  const sendMessage = async () => {
    if (!message.trim() && !pdfPath) return;
    setIsLoading(true);

    const payload: any = {
      session_id: sessionId,
      User_message: message,
      pdf_path: pdfPath
    };

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date(),
        source: messageType,
      },
    ]);
    setMessage('');
    setMessageType(undefined);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.reply || 'No response received.',
          timestamp: new Date(),
          source: messageType,
        },
      ]);
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black dark text-foreground flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <span className="text-lg font-semibold max-w-[70vw] truncate">SessionID-{pdfPath}</span>
        <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-sm">Gemini-2.5-flash</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="flex flex-col items-center w-full px-2 sm:px-0">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4 mt-6">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold mb-2 text-center">How can I help you today?</h2>
          <p className="text-muted-foreground max-w-xl text-center mb-10 text-base sm:text-lg">
            An intelligent assistant powered by LangGraph and RAG.
          </p>

          {/* Suggestions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8 w-full items-center justify-center">
            {suggestions.map((suggestion, i) => (
              <Card
                key={i}
                className="w-full sm:w-64 cursor-pointer transition-colors hover:bg-chat-hover border-border"
                onClick={() => handleSuggestion(suggestion.type as any)}
              >
                <CardContent className="p-4 flex flex-col items-center pointer-events-auto">
                  <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${suggestion.color}`}>
                    {suggestion.icon}
                  </div>
                  <h4 className="font-medium mb-1 text-center">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground text-center">{suggestion.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {FILTER_TABS.map(tab => (
              <span
                key={tab}
                className="px-3 py-1 rounded border border-border text-muted-foreground text-sm cursor-pointer select-none"
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.length > 0 && (
          <div className="w-full sm:max-w-2xl mx-auto mb-8 flex flex-col gap-3 px-1 sm:px-0">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={
                    `
                    w-fit max-w-[96vw] sm:max-w-2xl
                    rounded-2xl
                    px-3 sm:px-5 py-2 sm:py-3
                    mb-1
                    shadow
                    text-base
                    break-words
                    ${msg.type === 'user'
                      ? 'bg-gray-200 text-black ml-auto'
                      : 'bg-[#182235] text-white mr-auto'}
                    `
                  }
                  style={{ minWidth: '56px' }}
                >
                  {msg.source && (
                    <div className="text-2xs text-muted-foreground mb-1 flex items-center">
                      {msg.source === 'pdf' && <Upload className="w-3 h-3 mr-1" />}
                      {msg.source === 'web' && <Search className="w-3 h-3 mr-1" />}
                      {msg.source === 'llm' && <Brain className="w-3 h-3 mr-1" />}
                      {msg.source?.toUpperCase()} Response
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none text-base break-words">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          if (inline) {
                            return (
                              <code className="px-1 py-0.5 rounded bg-gray-800 text-pink-300" {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="bg-gray-900 text-white p-4 rounded my-2 text-sm overflow-x-auto">
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-right">
                    {msg.timestamp?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#182235] text-white rounded-2xl px-3 sm:px-5 py-2 sm:py-3 mb-1 shadow w-fit max-w-[90vw] sm:max-w-2xl">
                  <span>...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Chat Input Bar */}
      <div className="border-t border-border p-2 sm:p-4 bg-background">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
          {selectedFile && (
            <div className="p-2 bg-primary/10 rounded-lg flex items-center space-x-2 mb-2 sm:mb-0 w-full sm:w-auto">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm truncate">{selectedFile.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                Remove
              </Button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload PDF">
            <Upload className="w-4 h-4" />
          </Button>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="pr-12 bg-gray-200 text-black border-border placeholder:text-muted-foreground placeholder:text-lg h-14 w-full"
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() && !pdfPath}
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/120"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-3xs text-muted-foreground m-5 text-center">
          RAGBOT can make mistakes. Consider checking important information.
        </p>
      </div>
      <footer className="w-full text-center py-4 text-xs text-muted-foreground bg-background border-t border-border">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-primary">Dotsquares</span> &mdash; Your AI Chatbot Companion, Made with ❤️
      </footer>
    </div>
  );
};

export default App;
