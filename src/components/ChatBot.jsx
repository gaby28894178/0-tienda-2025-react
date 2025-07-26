import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import "./ChatBot.css";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "+1234567890";

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Simular respuesta del bot
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("precio") || lowerMessage.includes("costo")) {
      return "Los precios de nuestros productos varían. ¿Te interesa algún producto en particular? 💰";
    }

    if (lowerMessage.includes("envío") || lowerMessage.includes("entrega")) {
      return "Ofrecemos envío gratuito en compras mayores a $100. El tiempo de entrega es de 2-5 días hábiles. 📦";
    }

    if (
      lowerMessage.includes("producto") ||
      lowerMessage.includes("catálogo")
    ) {
      return "Tenemos una gran variedad de productos. Puedes ver nuestro catálogo completo en la página principal. 🛍️";
    }

    if (
      lowerMessage.includes("whatsapp") ||
      lowerMessage.includes("contacto")
    ) {
      return `¡Perfecto! Puedes contactarnos directamente por WhatsApp al ${whatsappNumber} para una atención más personalizada. 📱`;
    }

    return "Gracias por tu mensaje. Para una atención más personalizada, puedes contactarnos por WhatsApp. ¿Hay algo más en lo que pueda ayudarte? 😊";
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Hola, me gustaría obtener más información sobre sus productos."
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      <motion.button
        className="chat-toggle"
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-container"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="chat-header">
              <div className="chat-avatar">✨</div>
              <div className="chat-info">
                <h4>Asistente Virtual</h4>
                <span className="chat-status">En línea</span>
              </div>
              <button className="whatsapp-btn" onClick={openWhatsApp}>
                📱 WhatsApp
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`message ${message.isBot ? "bot" : "user"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-content">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button onClick={sendMessage} disabled={!inputMessage.trim()}>
                <Send size={18} /> ✔
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
