import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

const INITIAL_CHAT_LIST: { id: string; label: string }[] = [];

function getInitialMessagesByChat(): Record<string, Message[]> {
  return INITIAL_CHAT_LIST.reduce<Record<string, Message[]>>((acc, { id }) => {
    acc[id] = [];
    return acc;
  }, {});
}

const QUESTIONNAIRE_QUESTIONS: { id: string; question: string; options: string[] }[] = [
  { id: 'q1', question: 'What brings you here today?', options: ['Learning', 'Productivity', 'Creative projects', 'Just exploring'] },
  { id: 'q3', question: 'What do you want to focus on first?', options: ['Goals & planning', 'Habits & routine', 'Ideas & brainstorming', 'Not sure yet'] },
];

const PREFERRED_COACH_QUESTION = {
  id: 'preferredCoach',
  question: 'Do you have a specific coach you\'d like to talk to?',
  placeholder: 'e.g. productivity coach, fitness coach (optional)',
};

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

// RevenueCat entitlement required to create more than one chat (must match your RevenueCat project)
const REVENUECAT_ENTITLEMENT_ID = 'pro';

function buildQuestionnaireContext(answers: Record<string, string>): string {
  const lines = QUESTIONNAIRE_QUESTIONS.map(
    (q) => `- ${q.question}: ${answers[q.id] ?? '(not answered)'}`,
  ).filter((line) => !line.endsWith('(not answered)'));
  const preferred = (answers[PREFERRED_COACH_QUESTION.id] ?? '').trim();
  if (preferred.length > 0) {
    lines.push(`- ${PREFERRED_COACH_QUESTION.question}: ${preferred}`);
  }
  if (lines.length === 0) return '';
  return `User context from onboarding:\n${lines.join('\n')}`;
}

export default function App() {
  const [showNewChatQuestionnaire, setShowNewChatQuestionnaire] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [chatList, setChatList] = useState<{ id: string; label: string }[]>(INITIAL_CHAT_LIST);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>(getInitialMessagesByChat);
  const [contextByChat, setContextByChat] = useState<Record<string, Record<string, string>>>({});
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const openRenameModal = (chatId: string) => {
    const chat = chatList.find((c) => c.id === chatId);
    setRenameChatId(chatId);
    setRenameValue(chat?.label ?? '');
  };

  const closeRenameModal = () => {
    setRenameChatId(null);
    setRenameValue('');
  };

  const saveRename = () => {
    const trimmed = renameValue.trim();
    if (renameChatId && trimmed.length > 0) {
      setChatList((prev) =>
        prev.map((c) => (c.id === renameChatId ? { ...c, label: trimmed } : c)),
      );
    }
    closeRenameModal();
  };

  const startNewChat = async () => {
    // First chat is free; second+ requires subscription
    if (chatList.length >= 1) {
      try {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
          displayCloseButton: true,
        });
        const canProceed =
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED ||
          result === PAYWALL_RESULT.NOT_PRESENTED; // already had entitlement
        // In production, block if they didn't purchase; in __DEV__ (e.g. Expo Go Preview API), allow so you can test the flow
        if (!canProceed && !__DEV__) return;
      } catch (e) {
        // In production, block on error; in __DEV__, allow so Expo Go / Preview API doesn't block creating a second chat
        if (!__DEV__) return;
      }
    }
    setQuestionnaireAnswers({});
    setShowNewChatQuestionnaire(true);
  };

  const createChatFromQuestionnaire = () => {
    if (!allQuestionsAnswered) return;
    const nextNum = chatList.length + 1;
    const newId = `chat${nextNum}`;
    const newLabel = `Chat ${nextNum}`;
    setChatList((prev) => [...prev, { id: newId, label: newLabel }]);
    setMessagesByChat((prev) => ({ ...prev, [newId]: [] }));
    setContextByChat((prev) => ({ ...prev, [newId]: { ...questionnaireAnswers } }));
    setSelectedChat(newId);
    setShowNewChatQuestionnaire(false);
    setQuestionnaireAnswers({});
  };
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const allQuestionsAnswered =
    QUESTIONNAIRE_QUESTIONS.every((q) => questionnaireAnswers[q.id] != null && questionnaireAnswers[q.id].length > 0);

  const extra = Constants.expoConfig?.extra || {};
  const apiUrl = (extra.API_URL as string)?.trim().replace(/\/$/, '') || '';
  const apiKey = (extra.OPENAI_API_KEY as string)?.trim() || '';
  const useBackend = apiUrl.length > 0;
  const revenueCatAppleKey = (extra.REVENUECAT_APPLE_API_KEY as string)?.trim() || '';
  const revenueCatGoogleKey = (extra.REVENUECAT_GOOGLE_API_KEY as string)?.trim() || '';

  // Initialize RevenueCat SDK (uses Preview API in Expo Go when native modules unavailable)
  useEffect(() => {
    const key = Platform.OS === 'ios' ? revenueCatAppleKey : revenueCatGoogleKey;
    if (key.length > 0) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      Purchases.configure({ apiKey: key });
    }
  }, [revenueCatAppleKey, revenueCatGoogleKey]);

  const messages = selectedChat ? (messagesByChat[selectedChat] ?? []) : [];

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !selectedChat) return;

    if (!useBackend && !apiKey) {
      setError('Add OPENAI_API_KEY to frontend/.env.local for development (no backend).');
      return;
    }

    setInput('');
    setError(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChat]: [...prev[selectedChat], userMessage],
    }));
    setLoading(true);

    const conversationMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    const chatContext = selectedChat ? (contextByChat[selectedChat] ?? {}) : {};
    const questionnaireContext = buildQuestionnaireContext(chatContext);
    const chatMessages =
      questionnaireContext.length > 0
        ? [{ role: 'system' as const, content: questionnaireContext }, ...conversationMessages]
        : conversationMessages;

    try {
      let assistantContent: string;

      if (useBackend) {
        const response = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatMessages, max_tokens: 1024 }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
        assistantContent = data?.content?.trim() || 'No response.';
      } else {
        const response = await fetch(OPENAI_CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: chatMessages,
            max_tokens: 1024,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error?.message || data?.error || `HTTP ${response.status}`);
        assistantContent = data?.choices?.[0]?.message?.content?.trim() || 'No response.';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
      };
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChat]: [...prev[selectedChat], assistantMessage],
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Request failed';
      setError(message);
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChat]: [...prev[selectedChat], { id: `err-${Date.now()}`, role: 'assistant', content: `Error: ${message}` }],
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      <Text style={[styles.bubbleRole, item.role === 'user' ? styles.userRole : styles.assistantRole]}>
        {item.role === 'user' ? 'You' : 'Assistant'}
      </Text>
      <Text style={[styles.bubbleText, item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
        {item.content}
      </Text>
    </View>
  );

  // New chat questionnaire (shown when user taps "+ New chat")
  if (showNewChatQuestionnaire) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <StatusBar style="auto" />
        <View style={styles.questionnaireHeader}>
          <View style={styles.preferencesHeaderRow}>
            <Pressable style={styles.backButton} onPress={() => setShowNewChatQuestionnaire(false)}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <Text style={styles.questionnaireTitle}>New chat</Text>
          </View>
          <Text style={styles.questionnaireSubtitle}>Answer a few questions to set the context for this chat</Text>
        </View>
        <ScrollView
          style={styles.questionnaireScroll}
          contentContainerStyle={styles.questionnaireContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {QUESTIONNAIRE_QUESTIONS.map(({ id, question, options }) => (
            <View key={id} style={styles.questionBlock}>
              <Text style={styles.questionText}>{question}</Text>
              <View style={styles.optionsRow}>
                {options.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionChip,
                      questionnaireAnswers[id] === option && styles.optionChipSelected,
                    ]}
                    onPress={() => setQuestionnaireAnswers((prev) => ({ ...prev, [id]: option }))}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        questionnaireAnswers[id] === option && styles.optionChipTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <View style={styles.questionBlock}>
            <Text style={styles.questionText}>{PREFERRED_COACH_QUESTION.question} <Text style={styles.optionalLabel}>(optional)</Text></Text>
            <TextInput
              style={styles.questionnaireTextInput}
              placeholder={PREFERRED_COACH_QUESTION.placeholder}
              placeholderTextColor="#999"
              value={questionnaireAnswers[PREFERRED_COACH_QUESTION.id] ?? ''}
              onChangeText={(text) => setQuestionnaireAnswers((prev) => ({ ...prev, [PREFERRED_COACH_QUESTION.id]: text }))}
            />
          </View>
          <Pressable
            style={[styles.getStartedButton, !allQuestionsAnswered && styles.getStartedButtonDisabled]}
            onPress={createChatFromQuestionnaire}
            disabled={!allQuestionsAnswered}
          >
            <Text style={styles.getStartedButtonText}>Start chat</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Chat list screen
  if (selectedChat === null) {
    return (
      <>
        <View style={styles.listScreenTopWrap}>
          <StatusBar style="light" />
          <SafeAreaView style={styles.container}>
            <View style={styles.listScreenHeader}>
            <Text style={styles.listScreenTitle}>Welcome to HackCoach</Text>
            <Text style={styles.subtitle}>
              {chatList.length === 0 ? 'Create a chat to get started' : 'Choose a chat'}
            </Text>
          </View>
          <View style={styles.chatList}>
            {chatList.map(({ id, label }) => (
              <Pressable
                key={id}
                style={({ pressed }) => [styles.chatOption, pressed && styles.chatOptionPressed]}
                onPress={() => setSelectedChat(id)}
                onLongPress={() => openRenameModal(id)}
              >
                <Text style={styles.chatOptionText}>{label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.newChatButton, pressed && styles.newChatButtonPressed]}
              onPress={startNewChat}
            >
              <Text style={styles.newChatButtonText}>+ New chat</Text>
            </Pressable>
          </View>
          </SafeAreaView>
        </View>
        <Modal visible={renameChatId != null} transparent animationType="fade">
          <Pressable style={styles.renameModalOverlay} onPress={closeRenameModal}>
            <Pressable style={styles.renameModalBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.renameModalTitle}>Name this chat</Text>
              <TextInput
                style={styles.renameModalInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Chat name"
                placeholderTextColor="#999"
                autoFocus
                maxLength={80}
              />
              <View style={styles.renameModalButtons}>
                <Pressable style={styles.renameModalButton} onPress={closeRenameModal}>
                  <Text style={styles.renameModalButtonTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.renameModalButton, styles.renameModalButtonPrimary]} onPress={saveRename}>
                  <Text style={styles.renameModalButtonText}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Chat screen
  const chatLabel = chatList.find((c) => c.id === selectedChat)?.label ?? selectedChat ?? 'Chat';

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <StatusBar style="auto" />

        <View style={styles.chatScreenHeader}>
          <Pressable style={styles.chatBackButton} onPress={() => setSelectedChat(null)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Pressable style={styles.chatNameButton} onPress={() => selectedChat && openRenameModal(selectedChat)}>
            <Text style={styles.chatNameButtonText} numberOfLines={1}>{chatLabel}</Text>
            <Text style={styles.chatNameHint}>tap to rename</Text>
          </Pressable>
        </View>

        {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Send a message to start the conversation.</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          editable={!loading}
          multiline
          maxLength={4000}
        />
        <Pressable
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>
      <Modal visible={renameChatId != null} transparent animationType="fade">
        <Pressable style={styles.renameModalOverlay} onPress={closeRenameModal}>
          <Pressable style={styles.renameModalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.renameModalTitle}>Name this chat</Text>
            <TextInput
              style={styles.renameModalInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Chat name"
              placeholderTextColor="#999"
              autoFocus
              maxLength={80}
            />
            <View style={styles.renameModalButtons}>
              <Pressable style={styles.renameModalButton} onPress={closeRenameModal}>
                <Text style={styles.renameModalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.renameModalButton, styles.renameModalButtonPrimary]} onPress={saveRename}>
                <Text style={styles.renameModalButtonText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  listScreenTopWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  questionnaireHeader: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferencesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  questionnaireTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  questionnaireSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  questionnaireScroll: {
    flex: 1,
  },
  questionnaireContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  questionBlock: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionalLabel: {
    fontWeight: '400',
    color: '#999',
  },
  questionnaireTextInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionChipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f4ff',
  },
  optionChipText: {
    fontSize: 15,
    color: '#333',
  },
  optionChipTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  getStartedButton: {
    marginTop: 32,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedButtonDisabled: {
    opacity: 0.5,
  },
  getStartedButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  listScreenHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listScreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chatList: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  chatOption: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chatOptionPressed: {
    opacity: 0.8,
    backgroundColor: '#f8f8f8',
  },
  chatOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  newChatButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#e8f4ff',
  },
  newChatButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  errorBar: {
    backgroundColor: '#fee',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 100,
    paddingBottom: 24,
    flexGrow: 1,
  },
  chatScreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  chatBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chatNameButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  chatNameButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chatNameHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameModalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  renameModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  renameModalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  renameModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  renameModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  renameModalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  renameModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  renameModalButtonTextCancel: {
    fontSize: 16,
    color: '#666',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  userRole: {
    color: 'rgba(255,255,255,0.9)',
  },
  assistantRole: {
    color: '#666',
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAssistant: {
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: 'center',
    minWidth: 72,
    minHeight: 44,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
