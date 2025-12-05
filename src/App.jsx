import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Sun,
  Menu,
  X,
  MapPin,
  Wifi,
  Coffee,
  Car,
  Utensils,
  Wine,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  ZoomIn,
  ZoomOut,
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2
} from 'lucide-react';

/**
 * HOTEL JINA - MODERN LANDING PAGE
 * * Features:
 * - 3D Tilt Cards for Rooms
 * - Dark/Light Mode Toggle
 * - Smooth Scroll Animations
 * - Responsive Mobile Menu
 * - Interactive Lightbox Gallery with Zoom
 * - Full Gallery View with Footer & Navigation Support
 * - Gemini AI Powered Concierge (Vercel Ready)
 */

// --- Configuration ---

// Automatically detect API Key from Vercel Environment or Local .env
// We use a safe check to prevent crashes in environments where import.meta is restricted
const getApiKey = () => {
  try {
    // VITE_GEMINI_API_KEY is required for Vite/Vercel
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (error) {
    // Fallback for non-Vite environments
    return "";
  }
};

const apiKey = getApiKey();

// --- Hooks & Utilities ---

// Hook for 3D Tilt Effect on cards
const useTilt = (active = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !active) return;

    const el = ref.current;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
      const rotateY = ((x - centerX) / centerX) * 10;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [active]);

  return ref;
};

// Hook for scroll animations (Intersection Observer)
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect(); // Trigger once
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return [ref, isVisible];
};

// --- Gemini API Integration ---

const HOTEL_CONTEXT = `
You are Jina, the AI Concierge for Hotel Jina, a luxury hotel in Silchar, Assam.
Hotel Details:
- Address: Malugram, Silchar, Assam 788002.
- Contact: +91 95312 73486, m.nath190702@gmail.com.
- Rooms: 
  1. Executive Room (375 sq ft, King Bed, City View) - ₹3,500/night.
  2. Luxury Suite (420 sq ft, Living Area, Bathtub) - ₹5,200/night.
  3. Classic Double (172 sq ft, Twin/Double) - ₹2,800/night.
- Amenities: Free Valet Parking, High-Speed Wifi, In-room Dining, Restaurant (7AM-10:30PM), Bar/Lounge (11AM-10PM), 24/7 Front Desk.
- Location Highlights: Near heart of Silchar city.
Your Goal: Answer guest questions politely, professionally, and concisely. If they want to book, tell them to click the "Book Now" button in the navigation. You can also suggest itineraries for Silchar.
`;

// Helper for Demo Mode responses
const getMockResponse = (userText) => {
  const text = userText.toLowerCase();

  if (text.includes('room') || text.includes('price') || text.includes('cost') || text.includes('stay')) {
    return "Since I'm in Demo Mode, I can tell you our rates:\n\n• Executive Room: ₹3,500\n• Luxury Suite: ₹5,200\n• Classic Double: ₹2,800\n\nAll rooms include breakfast!";
  }
  if (text.includes('food') || text.includes('restaurant') || text.includes('eat') || text.includes('dining')) {
    return "Our restaurant serves authentic Assamese and multi-cuisine dishes from 7 AM to 10:30 PM. We also have a lovely Bar & Lounge open until 10 PM. (Demo Mode)";
  }
  if (text.includes('location') || text.includes('where') || text.includes('address')) {
    return "We are located at Malugram, Silchar, Assam 788002. It's a prime location near the city center! (Demo Mode)";
  }
  if (text.includes('wifi') || text.includes('parking') || text.includes('gym')) {
    return "Yes! We offer complimentary High-Speed WiFi and Free Valet Parking for all guests. (Demo Mode)";
  }

  return "Hello! I’m Jina. I’m having a tiny technical hiccup right now.\n\nI think my developer, Monoswee Nath, is either updating something awesome for you… or he’s off somewhere eating, sleeping, and living his best life.\n\nBut don’t worry—I can still answer questions about our Rooms, Location, and Dining!";
};

const callGeminiAPI = async (messages) => {
  const lastUserMessage = messages[messages.length - 1];
  const userText = lastUserMessage.text || "";

  // ---------------------------------------------------------
  // FALLBACK: If no API key, return a mock response immediately
  // ---------------------------------------------------------
  if (!apiKey) {
    console.warn("API Key missing. Switching to Demo Mode.");
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getMockResponse(userText);
  }

  // Real API Call
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: "user",
      parts: [{ text: HOTEL_CONTEXT }]
    },
    {
      role: "model",
      parts: [{ text: "Understood. I am Jina, the AI Concierge for Hotel Jina. I am ready to assist guests." }]
    },
    ...messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
        }
      })
    });

    if (!response.ok) {
      throw new Error("API_FAIL");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that. Could you rephrase?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Even if the API call fails (e.g. quota, network), fallback to mock
    return getMockResponse(userText);
  }
};

// --- Components ---

const Reveal = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const Button = ({ children, primary = false, className = "", ...props }) => {
  return (
    <button
      className={`px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${primary
        ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-900/20"
        : "bg-transparent border-2 border-current hover:bg-gray-100 dark:hover:bg-gray-800"
        } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// AI Chat Widget Component
const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm Jina, your AI concierge. How can I help you plan your stay in Silchar today?", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call Gemini (or Mock Fallback)
      const aiResponseText = await callGeminiAPI([...messages, userMsg]);
      const aiMsg = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = { id: Date.now() + 1, text: "I'm having trouble connecting right now. Please try again.", sender: 'ai' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center gap-2 ${isOpen
          ? "bg-zinc-800 text-white rotate-90"
          : "bg-amber-600 text-white animate-bounce-subtle"
          }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 w-[90vw] md:w-96 h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 dark:border-zinc-800 transition-all duration-300 transform origin-bottom-right ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-10 pointer-events-none"
          }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-amber-600 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bot size={20} />
            <div>
              <h3 className="font-bold text-sm">Ask Jina AI</h3>
              <p className="text-xs text-amber-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-zinc-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                  ? "bg-amber-600 text-white rounded-br-none"
                  : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-bl-none shadow-sm"
                  }`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1 mb-1 text-amber-600 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={10} /> Jina
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-zinc-700">
                <Loader2 size={16} className="animate-spin text-amber-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 rounded-b-2xl">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about rooms, food, or Silchar..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Powered by Jina Ai ✨
          </p>
        </form>
      </div>
    </>
  );
};

const RoomCard = ({ title, price, image, features, description }) => {
  const tiltRef = useTilt();

  return (
    <div
      ref={tiltRef}
      className="group relative h-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 dark:border-zinc-800"
    >
      <div className="h-64 overflow-hidden relative">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-amber-600">
          {price}
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          {description}
        </p>

        <div className="space-y-2 mb-8">
          {features.map((feat, i) => (
            <div key={i} className="flex items-center text-gray-500 dark:text-gray-500 text-sm">
              <CheckCircle className="w-4 h-4 mr-2 text-amber-500" />
              {feat}
            </div>
          ))}
        </div>

        <button className="w-full py-3 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-amber-600 hover:border-amber-600 hover:text-white transition-colors uppercase tracking-widest">
          View Details
        </button>
      </div>
    </div>
  );
};

const Lightbox = ({ src, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute top-6 right-6 flex gap-4 z-50">
        <button onClick={handleZoomOut} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <ZoomOut size={24} />
        </button>
        <button onClick={handleZoomIn} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
          <ZoomIn size={24} />
        </button>
        <button onClick={onClose} className="p-3 bg-amber-600 hover:bg-amber-700 rounded-full text-white transition-colors ml-4">
          <X size={24} />
        </button>
      </div>

      <div
        className="relative overflow-hidden cursor-move w-full h-full flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt="Expanded view"
          className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? 'grab' : 'default'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Reusable Footer Component
const SiteFooter = ({ onNavClick }) => {
  return (
    <footer id="contact" className="bg-zinc-900 text-white pt-24 pb-12 border-t border-zinc-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-amber-600 rounded-br-xl rounded-tl-xl flex items-center justify-center font-serif font-bold">J</div>
              <span className="text-2xl font-serif font-bold">JINA</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Your premier destination in Silchar. Combining modern luxury with traditional hospitality to create unforgettable memories.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Instagram size={20} />} />
              <SocialIcon icon={<Facebook size={20} />} />
              <SocialIcon icon={<Twitter size={20} />} />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-serif">Contact Us</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 text-amber-600 shrink-0" size={18} />
                <span>Malugram,<br /> Silchar, Assam 788002</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-amber-600 shrink-0" size={18} />
                <span>+91 95312 73486</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-amber-600 shrink-0" size={18} />
                <span>m.nath190702@gmail.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-serif">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#home" onClick={(e) => onNavClick(e, '#home')} className="hover:text-amber-500 transition-colors">Home</a></li>
              <li><a href="#rooms" onClick={(e) => onNavClick(e, '#rooms')} className="hover:text-amber-500 transition-colors">Rooms & Suites</a></li>
              <li><a href="#dining" onClick={(e) => onNavClick(e, '#dining')} className="hover:text-amber-500 transition-colors">Dining</a></li>
              <li><a href="#amenities" onClick={(e) => onNavClick(e, '#amenities')} className="hover:text-amber-500 transition-colors">Amenities</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-serif">Newsletter</h4>
            <p className="text-gray-400 mb-4 text-sm">Subscribe to receive special offers and updates.</p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your Email Address"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors"
              />
              <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition-colors text-sm uppercase tracking-wider">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Jina. All rights reserved.</p>
          <p className="text-gray-600 text-xs">
            Designed and developed by{' '}
            <a
              href="https://jinamatrix.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-500 transition-colors"
            >
              JinaMatrix.in
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

const FullGallery = ({ onClose, onImageClick, onNavClick }) => {
  const images = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2832&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2071&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"
  ];

  return (
    // UPDATED: Increased z-index to 60 to appear above the main nav (z-50)
    <div className="fixed inset-0 z-[60] bg-white dark:bg-black overflow-y-auto animate-fade-in">
      {/* Sticky Gallery Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 border-b border-gray-100 dark:border-zinc-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-amber-600 transition-colors group"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-serif font-bold text-lg">Back to Home</span>
          </button>

          <div className="text-amber-600 font-bold tracking-widest uppercase text-sm hidden md:block">
            Jina Photo Gallery
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-amber-600 hover:text-white rounded-full transition-colors text-gray-900 dark:text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer bg-gray-100 dark:bg-zinc-900"
              onClick={() => onImageClick(img)}
            >
              <img
                src={img}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="text-white drop-shadow-md" size={32} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer included in Gallery View */}
      <SiteFooter onNavClick={onNavClick} />
    </div>
  );
};

// --- Main App ---

export default function Jina() {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode for "fancy" feel
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Universal Navigation Handler
  // Closes menu/gallery and smoothly scrolls to section
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setShowFullGallery(false);
    setIsMenuOpen(false);

    // Slight delay to allow gallery to close if open, improving animation smoothness
    setTimeout(() => {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Rooms", href: "#rooms" },
    { name: "Dining", href: "#dining" },
    { name: "Amenities", href: "#amenities" },
    { name: "Gallery", href: "#gallery" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans selection:bg-amber-500 selection:text-white">

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {/* Full Gallery Overlay */}
      {showFullGallery && (
        <FullGallery
          onClose={() => setShowFullGallery(false)}
          onImageClick={(src) => setLightboxImage(src)}
          onNavClick={handleNavClick}
        />
      )}

      {/* AI Chat Widget (New Feature) */}
      <AIChatWidget />

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md py-4 shadow-lg border-b border-gray-200 dark:border-zinc-800"
          : "bg-transparent py-6"
          }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-amber-600 rounded-br-2xl rounded-tl-2xl flex items-center justify-center text-white font-serif font-bold text-xl group-hover:rotate-45 transition-transform duration-500">
              J
            </div>
            <span className={`text-2xl font-serif font-bold tracking-tighter ${scrolled ? "text-gray-900 dark:text-white" : "text-white"}`}>
              JINA
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-sm font-medium uppercase tracking-widest hover:text-amber-500 transition-colors ${scrolled ? "text-gray-600 dark:text-gray-300" : "text-gray-200"
                  }`}
              >
                {link.name}
              </a>
            ))}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-colors ${scrolled
                ? "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white"
                : "bg-white/10 hover:bg-white/20 text-white"
                }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Button primary className="shadow-lg shadow-amber-900/20">
              Book Now
            </Button>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${scrolled ? "text-gray-900 dark:text-white" : "text-white"
                }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={scrolled ? "text-gray-900 dark:text-white" : "text-white"}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-zinc-900 pt-24 px-6 md:hidden">
          <div className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-3xl font-serif font-bold text-gray-900 dark:text-white hover:text-amber-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Button primary className="w-full mt-8">Book A Room</Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax Feel */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
            alt="Hotel Biva Exterior"
            className="w-full h-full object-cover opacity-60 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-black/60 dark:from-black dark:via-black/30 dark:to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <Reveal>
            <div className="inline-block mb-4 px-3 py-1 border border-gray-900/30 bg-gray-900/5 dark:border-white/30 dark:bg-white/10 backdrop-blur-md text-xs font-bold tracking-[0.2em] uppercase text-gray-900 dark:text-white transition-colors duration-500">
              Welcome to Silchar's Finest
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif font-bold text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow-sm dark:drop-shadow-2xl transition-colors duration-500">
              HOTEL <span className="text-amber-600 dark:text-amber-500">JINA</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 max-w-2xl mx-auto mb-10 font-medium dark:font-light leading-relaxed transition-colors duration-500">
              Experience the perfect blend of luxury and comfort in the heart of Silchar.
              Modern amenities, exquisite dining, and impeccable service await you.
            </p>
          </Reveal>

          <Reveal delay={600}>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Button primary className="w-full md:w-auto min-w-[180px] shadow-lg shadow-amber-600/20">
                Check Availability
              </Button>
              <Button
                // UPDATED: Now scrolls to the #gallery section
                onClick={(e) => handleNavClick(e, '#gallery')}
                className="w-full md:w-auto min-w-[180px] text-gray-900 border-gray-900 hover:bg-gray-900 hover:text-white dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors duration-300"
              >
                View Gallery
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-900/30 dark:border-white/50 rounded-full flex justify-center transition-colors duration-500">
            <div className="w-1 h-2 bg-amber-600 dark:bg-amber-500 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* About / Info Bar Section */}
      <section className="relative z-20 -mt-24 pb-20 px-6">
        <div className="container mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark:text-white">Prime Location</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Located at Malugram, Silchar. Minutes from the heart of the city.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                <Car size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark:text-white">Free Valet Parking</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Hassle-free parking for all our guests. Secure and convenient.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 dark:text-white">24/7 Front Desk</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Always here to serve you. Check-in starts at 11:30 AM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-24 bg-white dark:bg-black">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20">
              <span className="text-amber-600 font-bold tracking-widest uppercase text-sm">Accommodations</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mt-3 mb-6 dark:text-white">Luxury & Comfort</h2>
              <div className="w-24 h-1 bg-amber-600 mx-auto" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <Reveal delay={200}>
              <RoomCard
                title="Executive Room"
                price="₹ 3,500 / Night"
                image="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070&auto=format&fit=crop"
                features={["375 sq. ft", "King Size Bed", "City View", "Work Desk"]}
                description="Designed for the business traveler, offering ample workspace and modern amenities for a productive stay."
              />
            </Reveal>

            <Reveal delay={400}>
              <RoomCard
                title="Luxury Suite"
                price="₹ 5,200 / Night"
                image="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2070&auto=format&fit=crop"
                features={["420 sq. ft", "Separate Living Area", "Premium Toiletries", "Bathtub"]}
                description="Our most spacious offering. Indulge in luxury with a separate living area and premium bath amenities."
              />
            </Reveal>

            <Reveal delay={600}>
              <RoomCard
                title="Classic Double"
                price="₹ 2,800 / Night"
                image="https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop"
                features={["172 sq. ft", "Twin/Double Bed", "Free WiFi", "Daily Housekeeping"]}
                description="Perfect for couples or solo travelers. Cozy, comfortable, and equipped with everything you need."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Dining / Restaurant Parallax Section */}
      <section id="dining" className="relative py-32 overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
            alt="Restaurant"
            className="w-full h-full object-cover fixed-background"
            style={{}}
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="text-white">
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                <Star className="fill-current" size={16} />
                <Star className="fill-current" size={16} />
                <Star className="fill-current" size={16} />
                <Star className="fill-current" size={16} />
                <Star className="fill-current" size={16} />
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">Fine Dining <br /> & Lounge</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Experience culinary excellence at our in-house restaurant. From local Assamese delicacies to international cuisine, our chefs craft dishes that delight the senses.
                <br /><br />
                Unwind after a long day at our exclusive <strong>Bar & Lounge</strong>, offering a curated selection of beverages in a sophisticated atmosphere.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20">
                  <Utensils className="text-amber-500" />
                  <div>
                    <div className="font-bold text-sm">Restaurant</div>
                    <div className="text-xs text-gray-400">07:00 AM - 10:30 PM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20">
                  <Wine className="text-amber-500" />
                  <div>
                    <div className="font-bold text-sm">Bar & Lounge</div>
                    <div className="text-xs text-gray-400">11:00 AM - 10:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={300} className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4 rotate-3 hover:rotate-0 transition-transform duration-700">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" className="rounded-2xl shadow-2xl mt-12 transform translate-y-8" alt="Cocktail" />
              <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" className="rounded-2xl shadow-2xl" alt="Food" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Amenities Grid */}
      <section id="amenities" className="py-24 bg-gray-50 dark:bg-zinc-950">
        <div className="container mx-auto px-6">
          <Reveal>
            <h2 className="text-4xl font-serif font-bold text-center mb-16 dark:text-white">World Class Amenities</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AmenityItem icon={<Wifi />} title="High-Speed WiFi" />
            <AmenityItem icon={<Car />} title="Valet Parking" />
            <AmenityItem icon={<Coffee />} title="In-room Dining" />
            <AmenityItem icon={<Utensils />} title="Restaurant" />
            <AmenityItem icon={<Wine />} title="Bar / Lounge" />
            <AmenityItem icon={<CheckCircle />} title="Daily Housekeeping" />
            <AmenityItem icon={<MapPin />} title="Travel Assistance" />
            <AmenityItem icon={<ArrowRight />} title="Laundry Service" />
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-white dark:bg-black overflow-hidden">
        <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-amber-600 font-bold tracking-widest uppercase text-sm">Visuals</span>
            <h2 className="text-4xl font-serif font-bold mt-2 dark:text-white">Inside Jina</h2>
          </div>
          <button
            onClick={() => setShowFullGallery(true)}
            className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            View All Photos <ArrowRight size={18} />
          </button>
        </div>

        {/* Masonry-style Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
          <GalleryImage
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
            span="col-span-2 row-span-2"
            onClick={setLightboxImage}
          />
          <GalleryImage
            src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop"
            onClick={setLightboxImage}
          />
          <GalleryImage
            src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2832&auto=format&fit=crop"
            onClick={setLightboxImage}
          />
          <GalleryImage
            src="https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop"
            span="row-span-2"
            onClick={setLightboxImage}
          />
          <GalleryImage
            src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=2070&auto=format&fit=crop"
            onClick={setLightboxImage}
          />
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button onClick={() => setShowFullGallery(true)}>View All Photos</Button>
        </div>
      </section>

      {/* Main Page Footer */}
      <SiteFooter onNavClick={handleNavClick} />
    </div>
  );
}

// --- Sub Components ---

const AmenityItem = ({ icon, title }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-600 transition-colors duration-300 group">
    <div className="text-gray-400 group-hover:text-amber-600 transition-colors duration-300 mb-4 transform group-hover:scale-110">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <span className="font-medium text-gray-900 dark:text-gray-200 text-center">{title}</span>
  </div>
);

const GalleryImage = ({ src, span = "", onClick }) => (
  <div
    className={`relative group overflow-hidden rounded-lg ${span} h-64 md:h-auto min-h-[250px] cursor-pointer`}
    onClick={() => onClick(src)}
  >
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors z-10 duration-500 flex items-center justify-center">
      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" size={32} />
    </div>
    <img
      src={src}
      alt="Gallery"
      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
    />
  </div>
);

const SocialIcon = ({ icon }) => (
  <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 hover:bg-amber-600 hover:text-white transition-all duration-300">
    {icon}
  </a>
);

// Placeholder icon for Clock since I missed importing it in the main list
const Clock = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);