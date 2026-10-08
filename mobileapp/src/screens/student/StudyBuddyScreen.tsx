import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import { Card, Button, Badge } from '../../components/common';
import { useAppStore } from '../../store/useAppStore';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const StudyBuddyScreen: React.FC = () => {
  const { isOffline } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Namaste! I'm your GyanVerse AI Study Buddy. Ask me anything about Mathematics, Computer Science, or Science concepts, or tap a quick topic below!",
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    'Explain Big-O with an example',
    'How do quadratic equations work?',
    "Explain Newton's 3rd law simply",
    'Summarize recursion',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Simulate AI response (handles offline vs online)
    setTimeout(() => {
      let botReply = '';
      if (isOffline) {
        botReply =
          '💡 [Offline Mode Knowledge Base] Here is a quick reference:\n\n' +
          (text.toLowerCase().includes('big-o')
            ? 'Big-O notation describes the limiting behavior of a function when the argument tends towards infinity. In computer science, it characterizes the execution time or space requirements of an algorithm.'
            : 'For complex real-time queries, connect to the internet. Meanwhile, all your downloaded lessons and offline quizzes remain fully accessible.');
      } else {
        botReply =
          'Great question! ' +
          (text.toLowerCase().includes('big-o')
            ? 'Big-O notation gives an upper bound on the time taken by an algorithm. For example, finding a name in an unsorted phonebook takes O(n) because you might have to check all n names.'
            : `Here is a clear breakdown of "${text}":\n\n1. First understand the fundamental equation or rule.\n2. Break the problem into sub-problems.\n3. Verify with edge cases and sample values.`);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Bot size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Study Buddy</Text>
              <Text style={styles.headerStatus}>
                {isOffline ? 'Offline Knowledge Engine' : 'Online & Ready'}
              </Text>
            </View>
          </View>
          <Badge
            label={isOffline ? 'Offline Mode' : 'AI Active'}
            variant={isOffline ? 'warning' : 'primary'}
            size="sm"
          />
        </View>

        {/* Chat History */}
        <ScrollView
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageWrapper,
                m.sender === 'user' ? styles.userWrapper : styles.botWrapper,
              ]}
            >
              {m.sender === 'bot' && (
                <View style={styles.botIconSmall}>
                  <Sparkles size={14} color={colors.primary.light} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  m.sender === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={styles.messageText}>{m.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Prompts Carousel */}
        <View style={styles.promptsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptsScroll}
          >
            {quickPrompts.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => handleSendMessage(p)}
                style={styles.promptPill}
              >
                <Lightbulb size={12} color={colors.warning.light} />
                <Text style={styles.promptText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Message Input Box */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Ask Study Buddy a question..."
            placeholderTextColor={colors.text.muted}
            value={inputMessage}
            onChangeText={setInputMessage}
            style={styles.input}
            onSubmitEditing={() => handleSendMessage()}
          />
          <Pressable
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            style={[
              styles.sendButton,
              !inputMessage.trim() && styles.sendButtonDisabled,
            ]}
          >
            <Send size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  messagesContainer: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  botIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#312E8140',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  userBubble: {
    backgroundColor: colors.primary.main,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  promptsWrapper: {
    paddingVertical: spacing.xs,
  },
  promptsScroll: {
    gap: spacing.xs + 2,
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  promptText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.input,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    height: 40,
    color: colors.text.primary,
    ...typography.bodyMedium,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.5,
  },
});
