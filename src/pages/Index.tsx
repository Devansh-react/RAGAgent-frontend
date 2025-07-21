import React, { useState, useRef } from 'react';
import { Send, Upload, Search, Brain, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'pdf' | 'web' | 'llm';
}
const Index = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      toast({
        title: 'PDF uploaded successfully',
        description: `${file.name} is ready for analysis`
      });
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
    }
  };

  // Dummy response for demonstration: replace with API call
  const sendMessage = async (messageType?: 'pdf' | 'web' | 'llm') => {
    if (!message.trim() && !selectedFile) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      source: messageType
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // Simulate waiting for a response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Here's a response (${messageType || 'normal'}) to "${message}"${selectedFile ? ` with file ${selectedFile.name}` : ''}.`,
          timestamp: new Date(),
          source: messageType,
        }
      ]);
      setIsLoading(false);
    }, 1200);

    setMessage('');
    setSelectedFile(null);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col">
      {/* Suggestions at the top */}
      <div className="max-w-2xl mx-auto text-center mt-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">How can I help you today?</h3>
          <p className="text-muted-foreground">
            This page will save a prompt asking that start on your menu, try it
            then it will become a clickable message with the name entered for it.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        </div>
        <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <span className="px-3 py-1 rounded border border-border">All</span>
          <span className="px-3 py-1 rounded border border-border">Text</span>
          <span className="px-3 py-1 rounded border border-border">Image</span>
          <span className="px-3 py-1 rounded border border-border">Video</span>
          <span className="px-3 py-1 rounded border border-border">Music</span>
          <span className="px-3 py-1 rounded border border-border">Analytics</span>
        </div>
      </div>

      {/* Message Area */}
      <div className="max-w-3xl mx-auto mt-8 flex-1 w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} my-2`}>
            <div className={`max-w-2xl rounded-lg p-4 ${msg.type === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-foreground'
              }`}>
              {msg.source && (
                <div className="text-xs text-muted-foreground mb-2 flex items-center">
                  {msg.source === 'pdf' && <FileText className="w-3 h-3 mr-1" />}
                  {msg.source === 'web' && <Search className="w-3 h-3 mr-1" />}
                  {msg.source === 'llm' && <Brain className="w-3 h-3 mr-1" />}
                  {msg.source.toUpperCase()} Response
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="text-xs text-muted-foreground mt-2">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground rounded-lg p-4 max-w-2xl">
              <span>...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center space-x-2">
          {selectedFile && (
            <div className="p-2 bg-primary/10 rounded-lg flex items-center space-x-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm">{selectedFile.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                Remove
              </Button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(selectedFile ? 'pdf' : undefined)}
            className="flex-1 pr-12 bg-chat-input border-border"
          />
          <Button
            onClick={() => sendMessage(selectedFile ? 'pdf' : undefined)}
            disabled={!message.trim() && !selectedFile}
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ChatGPT can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default Index;
