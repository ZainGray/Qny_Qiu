<template>
  <div class="chat-container">
    <!-- 顶部角色信息栏 -->
    <el-header class="chat-header">
      <div class="character-info">
        <el-avatar :size="50" :src="currentCharacter?.avatar" />
        <div class="character-details">
          <h2 class="character-name">{{ currentCharacter?.name }}</h2>
          <p class="character-status">在线</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="goBack" circle>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <el-button @click="clearChat" circle>
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </el-header>

    <!-- 聊天消息区域 -->
    <el-main class="chat-messages" ref="messagesContainer">
      <div class="message-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ 'user-message': message.sender === 'user', 'ai-message': message.sender === 'ai' }"
        >
          <div class="message-avatar">
            <el-avatar 
              :size="40" 
              :src="message.sender === 'user' ? 'https://avatar-static.segmentfault.com/134/593/1345938108-60c052cb988fb_huge256' : currentCharacter?.avatar"
            />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p>{{ message.content }}</p>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>
        
        <!-- AI正在思考状态 -->
        <div v-if="isAIThinking" class="message-item ai-message">
          <div class="message-avatar">
            <el-avatar :size="40" :src="currentCharacter?.avatar" />
          </div>
          <div class="message-content">
            <div class="message-bubble thinking">
              <div class="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-main>

    <!-- AI技能按钮区域 -->
    <div class="skills-section">
      <div class="skills-container">
        <h3 class="skills-title">{{ currentCharacter?.name }} 的专属技能</h3>
        <div class="skills-buttons">
          <el-button
            v-for="skill in characterSkills"
            :key="skill.id"
            :type="skill.type"
            @click="useSkill(skill)"
            class="skill-button"
            size="large"
          >
            <el-icon class="skill-icon"><component :is="getSkillIcon(skill.icon)" /></el-icon>
            {{ skill.name }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部输入栏 -->
    <el-footer class="chat-input-area">
      <div class="input-container">
        <el-input
          v-model="currentMessage"
          placeholder="输入消息..."
          type="textarea"
          :rows="1"
          resize="none"
          @keydown.enter.prevent="sendMessage"
          class="message-input"
        />
        <div class="input-actions">
          <el-button 
            :type="isRecording ? 'danger' : 'primary'"
            @click="toggleRecording"
            circle
            size="large"
          >
            <el-icon>
              <VideoPause v-if="isRecording" />
              <Microphone v-else />
            </el-icon>
          </el-button>
          <el-button 
            @click="sendMessage"
            type="primary"
            circle
            size="large"
            :disabled="!currentMessage.trim()"
          >
            <el-icon><Position /></el-icon>
          </el-button>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Avatar, Reading, ChatDotRound, Medal, EditPen, 
  ChatLineRound, Notebook, Sunny, DataAnalysis, Search,
  View, DataBoard, Compass, ZoomIn, Document,
  MagicStick, Lightning, StarFilled, Operation, Monitor,
  Microphone, VideoPlay, School, ArrowLeft, Delete,
  VideoPause, Position
} from '@element-plus/icons-vue'
import { aiService, type ChatMessage } from '../services/aiService'
import { voiceService } from '../services/voiceService'
import { useCharacterStore } from '@/stores/character'

const route = useRoute()
const router = useRouter()
const characterStore = useCharacterStore()

// 获取当前角色ID
const characterId = computed(() => route.params.characterId as string)

// 使用store中的角色数据
const currentCharacter = computed(() => characterStore.getCharacterById(characterId.value))

// 聊天相关状态
const messages = ref<Array<{
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: Date
}>>([])

const currentMessage = ref('')
const isAIThinking = ref(false)
const isRecording = ref(false)
const messagesContainer = ref<HTMLElement>()

// 消息历史（用于AI API）
const chatHistory = ref<ChatMessage[]>([])

// 角色技能配置
const characterSkillsConfig = {
  'harry-potter': [
    { id: 'roleplay', name: '角色扮演', type: 'primary', icon: 'Avatar', prompt: '请以哈利·波特的身份，用第一人称分享一个在霍格沃茨的有趣经历。' },
    { id: 'knowledge', name: '魔法知识', type: 'success', icon: 'Reading', prompt: '请教我一些关于魔法世界的知识，比如咒语、魔法生物或者霍格沃茨的历史。' },
    { id: 'emotion', name: '情感支持', type: 'warning', icon: 'ChatDotRound', prompt: '我最近遇到了一些困难，能像朋友一样给我一些鼓励和建议吗？' },
    { id: 'teaching', name: '勇气指导', type: 'info', icon: 'Medal', prompt: '请教我如何在面对困难时保持勇气，就像你面对伏地魔时那样。' },
    { id: 'creative', name: '冒险创作', type: 'danger', icon: 'EditPen', prompt: '让我们一起创造一个新的魔法冒险故事吧！' }
  ],
  'socrates': [
    { id: 'roleplay', name: '哲学对话', type: 'primary', icon: 'ChatLineRound', prompt: '请用苏格拉底式问答法，引导我思考一个哲学问题。' },
    { id: 'knowledge', name: '智慧启发', type: 'success', icon: 'Notebook', prompt: '请分享一些古希腊的哲学智慧，帮助我理解生活的意义。' },
    { id: 'emotion', name: '心灵疏导', type: 'warning', icon: 'Sunny', prompt: '我对人生感到困惑，请像一位智者一样开导我。' },
    { id: 'teaching', name: '思辨训练', type: 'info', icon: 'DataAnalysis', prompt: '请教我如何进行理性思考和逻辑推理。' },
    { id: 'creative', name: '问题探索', type: 'danger', icon: 'Search', prompt: '让我们一起探索一个深刻的哲学命题吧！' }
  ],
  'sherlock': [
    { id: 'roleplay', name: '侦探推理', type: 'primary', icon: 'View', prompt: '请展示你的推理能力，分析一个有趣的案例或者谜题。' },
    { id: 'knowledge', name: '逻辑分析', type: 'success', icon: 'DataBoard', prompt: '请教我如何进行逻辑推理和证据分析的方法。' },
    { id: 'emotion', name: '理性建议', type: 'warning', icon: 'Compass', prompt: '我需要一些理性客观的建议来解决我的问题。' },
    { id: 'teaching', name: '观察训练', type: 'info', icon: 'ZoomIn', prompt: '请教我如何提高观察力和注意细节的能力。' },
    { id: 'creative', name: '案例创作', type: 'danger', icon: 'Document', prompt: '让我们一起设计一个需要推理解决的神秘案例吧！' }
  ],
  'einstein': [
    { id: 'roleplay', name: '科学思维', type: 'primary', icon: 'MagicStick', prompt: '请用科学家的思维方式，帮我理解一个复杂的科学概念或现象。' },
    { id: 'knowledge', name: '物理启蒙', type: 'success', icon: 'Lightning', prompt: '请用简单易懂的方式，给我解释一些有趣的物理学原理。' },
    { id: 'emotion', name: '创新鼓励', type: 'warning', icon: 'StarFilled', prompt: '我在学习或工作中遇到了困难，请像一位导师一样鼓励和指导我。' },
    { id: 'teaching', name: '思维训练', type: 'info', icon: 'Operation', prompt: '请教我如何培养科学思维和创新能力。' },
    { id: 'creative', name: '想象探索', type: 'danger', icon: 'Monitor', prompt: '让我们一起进行一次思维实验，探索宇宙的奥秘吧！' }
  ],
  'shakespeare': [
    { id: 'roleplay', name: '诗意表达', type: 'primary', icon: 'Microphone', prompt: '请用莎士比亚式的优美语言，为我创作一段诗意的表达。' },
    { id: 'knowledge', name: '文学鉴赏', type: 'success', icon: 'Reading', prompt: '请教我如何欣赏文学作品，理解其中的深层含义。' },
    { id: 'emotion', name: '人性洞察', type: 'warning', icon: 'View', prompt: '请用你对人性的深刻洞察，帮我理解复杂的人际关系。' },
    { id: 'teaching', name: '写作指导', type: 'info', icon: 'EditPen', prompt: '请教我如何提高写作技巧，创作出更有感染力的文字。' },
    { id: 'creative', name: '戏剧创作', type: 'danger', icon: 'VideoPlay', prompt: '让我们一起创作一个小的戏剧场景或对话吧！' }
  ],
  'confucius': [
    { id: 'roleplay', name: '道德修养', type: 'primary', icon: 'Medal', prompt: '请以孔子的身份，给我一些关于品德修养和人生智慧的指导。' },
    { id: 'knowledge', name: '儒学智慧', type: 'success', icon: 'Reading', prompt: '请用《论语》中的智慧，帮我理解做人做事的道理。' },
    { id: 'emotion', name: '心灵慰藉', type: 'warning', icon: 'Sunny', prompt: '我在人生中感到迷茫，请像一位长者一样给我温暖的指引。' },
    { id: 'teaching', name: '教育方法', type: 'info', icon: 'School', prompt: '请教我如何更好地学习和教育他人，分享你的教育理念。' },
    { id: 'creative', name: '人生哲理', type: 'danger', icon: 'Compass', prompt: '让我们一起探讨人生的意义和价值，分享生活的智慧吧！' }
  ]
}

const characterSkills = computed(() => {
  return characterSkillsConfig[characterId.value as keyof typeof characterSkillsConfig] || []
})

onMounted(() => {
  // 设置当前角色到store
  characterStore.setCurrentCharacterById(characterId.value)
  
  // 确保角色有会话ID（如果没有会自动生成）
  const sessionId = aiService.getSessionId(characterId.value)
  console.log(`🎭 进入角色 "${characterId.value}" 聊天，会话ID: ${sessionId}`)
  
  // 发送欢迎消息
  sendWelcomeMessage()
})

const sendWelcomeMessage = () => {
  const welcomeMessages = {
    'harry-potter': '你好！我是哈利·波特。很高兴认识你！你想聊什么呢？',
    'socrates': '欢迎，年轻的朋友。我是苏格拉底。让我们一起探索智慧的奥秘吧。你有什么问题想要思考吗？',
    'sherlock': '啊，一个新的访客。我是夏洛克·福尔摩斯。从你的行为模式，我已经能推断出一些有趣的信息了。有什么案件需要我帮助吗？',
    'einstein': '你好！我是阿尔伯特·爱因斯坦。想象力比知识更重要，让我们一起探索这个奇妙的宇宙吧！',
    'shakespeare': '美好的一天，尊贵的朋友！我是威廉·莎士比亚。人生如戏，戏如人生。让我们用美丽的语言编织思想的华章吧！',
    'confucius': '博学之，审问之，慎思之，明辨之，笃行之。我是孔子。很高兴与你相遇，让我们一起探讨人生的智慧和品德的修养吧。'
  }
  
  const welcomeMessage = welcomeMessages[characterId.value as keyof typeof welcomeMessages] || '你好！很高兴与你对话。'
  
  addMessage('ai', welcomeMessage)
}

const addMessage = (sender: 'user' | 'ai', content: string) => {
  const message = {
    id: Date.now().toString(),
    sender,
    content,
    timestamp: new Date()
  }
  
  messages.value.push(message)
  
  // 滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
  
  // 如果是AI消息，使用TTS播放
  if (sender === 'ai') {
    playTTS(content)
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim()) return
  
  const userMessage = currentMessage.value.trim()
  addMessage('user', userMessage)
  
  // 添加到聊天历史
  chatHistory.value.push({ role: 'user', content: userMessage })
  
  currentMessage.value = ''
  
  // 显示AI思考状态
  isAIThinking.value = true
  
  try {
    // 调用AI服务
    const aiResponse = await aiService.chat(characterId.value, chatHistory.value)
    isAIThinking.value = false
    
    // 添加到聊天历史
    chatHistory.value.push({ role: 'assistant', content: aiResponse })
    
    addMessage('ai', aiResponse)
  } catch (error) {
    isAIThinking.value = false
    console.error('AI响应错误:', error)
    ElMessage.error('AI响应失败，请稍后重试')
  }
}

const toggleRecording = async () => {
  if (!voiceService.isRecognitionEnabled()) {
    ElMessage.error('您的浏览器不支持语音识别')
    return
  }
  
  if (isRecording.value) {
    voiceService.stopRecognition()
    isRecording.value = false
  } else {
    try {
      isRecording.value = true
      const transcript = await voiceService.startRecognition()
      currentMessage.value = transcript
      isRecording.value = false
    } catch (error) {
      isRecording.value = false
      ElMessage.error('语音识别失败')
    }
  }
}

const playTTS = async (text: string) => {
  if (!voiceService.isSynthesisEnabled()) return
  
  try {
    // 使用新的增强语音API，传入角色ID以获得角色专属语音
    await voiceService.speak(text, characterId.value)
    console.log(`🔊 为角色 "${characterId.value}" 播放语音: ${text.substring(0, 50)}...`)
  } catch (error) {
    console.error('语音播放失败:', error)
    // ElMessage.warning('语音播放失败，请检查浏览器设置')
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const goBack = () => {
  router.push('/')
}

const clearChat = () => {
  // 清除前端显示的消息
  messages.value = []
  chatHistory.value = []
  
  // 清除后端会话，生成新的会话ID
  const newSessionId = aiService.clearCharacterSession(characterId.value)
  console.log(`🔄 已为角色 "${characterId.value}" 重置会话，新ID: ${newSessionId}`)
  
  // 显示提示信息
  ElMessage.success(`已清除聊天记录，开始新的对话会话`)
  
  // 发送欢迎消息
  sendWelcomeMessage()
}

const useSkill = async (skill: any) => {
  // 将技能提示词作为用户消息发送
  currentMessage.value = skill.prompt
  await sendMessage()
}

const getSkillIcon = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'Avatar': Avatar,
    'Reading': Reading,
    'ChatDotRound': ChatDotRound,
    'Medal': Medal,
    'EditPen': EditPen,
    'ChatLineRound': ChatLineRound,
    'Notebook': Notebook,
    'Sunny': Sunny,
    'DataAnalysis': DataAnalysis,
    'Search': Search,
    'View': View,
    'DataBoard': DataBoard,
    'Compass': Compass,
    'ZoomIn': ZoomIn,
    'Document': Document,
    'MagicStick': MagicStick,
    'Lightning': Lightning,
    'StarFilled': StarFilled,
    'Operation': Operation,
    'Monitor': Monitor,
    'Microphone': Microphone,
    'VideoPlay': VideoPlay,
    'School': School,
    'ArrowLeft': ArrowLeft,
    'Delete': Delete,
    'VideoPause': VideoPause,
    'Position': Position
  }
  return iconMap[iconName] || Avatar
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.character-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.character-details {
  color: white;
}

.character-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.character-status {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
}

.message-list {
  max-width: 800px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
  gap: 10px;
}

.user-message {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 70%;
  padding: 15px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.message-bubble p {
  margin: 0;
  line-height: 1.5;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 5px;
  text-align: right;
}

.thinking {
  padding: 20px;
}

.thinking-dots {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: thinking 1.4s infinite;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

.skills-section {
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.skills-container {
  max-width: 800px;
  margin: 0 auto;
}

.skills-title {
  color: white;
  font-size: 1rem;
  margin: 0 0 15px 0;
  text-align: center;
  opacity: 0.9;
  font-weight: 500;
}

.skills-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.skill-button {
  border-radius: 20px;
  min-width: 120px;
  height: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-icon {
  font-size: 16px;
}

.skill-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.skill-button.el-button--primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.skill-button.el-button--success {
  background: linear-gradient(135deg, #56ab2f, #a8e6cf);
  color: white;
}

.skill-button.el-button--warning {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.skill-button.el-button--info {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.skill-button.el-button--danger {
  background: linear-gradient(135deg, #fa709a, #fee140);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .skills-buttons {
    gap: 8px;
  }
  
  .skill-button {
    min-width: 100px;
    height: 36px;
    font-size: 0.8rem;
  }
}

.chat-input-area {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 15px;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 25px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  resize: none;
  min-height: 40px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.input-actions {
  display: flex;
  gap: 10px;
}

.input-actions .el-button {
  width: 45px;
  height: 45px;
}
</style>