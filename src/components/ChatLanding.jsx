import React from 'react';
import { Monitor, Smartphone, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatLanding = () => {
  return (
    <div className="chat-landing">
      <div className="chat-landing__content">
        <motion.div 
          className="chat-landing__illustration"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="chat-landing__icons">
            <Monitor size={80} className="icon-monitor" />
            <Smartphone size={40} className="icon-phone" />
          </div>
        </motion.div>

        <motion.h1 
          className="chat-landing__title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Chat on Desktop
        </motion.h1>

        <motion.p 
          className="chat-landing__subtitle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Send and receive messages without keeping your phone online.<br />
          Use Chat on up to 4 linked devices and 1 phone at the same time.
        </motion.p>
      </div>

      <motion.div 
        className="chat-landing__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <Lock size={12} />
        <span>Your personal messages are end-to-end encrypted</span>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-landing {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          background: var(--app-background);
          color: var(--text-primary);
          text-align: center;
          padding: 40px;
          position: relative;
        }

        .chat-landing__content {
          max-width: 480px;
          margin-bottom: 60px;
        }

        .chat-landing__icons {
          position: relative;
          display: inline-block;
          margin-bottom: 40px;
          color: var(--text-muted);
          opacity: 0.4;
        }

        .icon-phone {
          position: absolute;
          bottom: -10px;
          right: -20px;
          color: var(--accent);
          background: var(--app-background);
          border-radius: 8px;
          padding: 4px;
        }

        .chat-landing__title {
          font-size: 32px;
          font-weight: 300;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .chat-landing__subtitle {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .chat-landing__footer {
          position: absolute;
          bottom: 40px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}} />
    </div>
  );
};

export default ChatLanding;
