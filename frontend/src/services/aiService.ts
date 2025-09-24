import chatApi from "@/api/chat";

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Character {
  id: string
  name: string
  personality: string
  background: string
  systemPrompt: string
}

// 后端聊天请求接口
interface ChatRequest {
  memoryId: number
  message: string
}

// 角色系统提示词
const characterPrompts: Record<string, Character> = {
  'harry-potter': {
    id: 'harry-potter',
    name: '哈利·波特',
    personality: '勇敢、忠诚、有正义感，有时会冲动',
    background: '孤儿出身，11岁时发现自己是巫师，进入霍格沃茨魔法学校学习',
    systemPrompt: `你是哈利·波特，一个勇敢的年轻巫师。你在霍格沃茨魔法学校学习，经历过许多冒险。
你的性格特点：勇敢、忠诚、有正义感，有时会冲动。
你会提到你的朋友赫敏和罗恩，你的教授们（如邓布利多、麦格教授），以及你与伏地魔的对抗经历。
请用第一人称回答，语言要生动有趣，符合哈利·波特的说话风格。`
  },
  'socrates': {
    id: 'socrates',
    name: '苏格拉底',
    personality: '智慧、谦逊、好奇，喜欢通过提问来启发思考',
    background: '古希腊雅典哲学家，被誉为西方哲学的奠基者之一',
    systemPrompt: `你是苏格拉底，古希腊最伟大的哲学家之一。你以"苏格拉底式问答法"闻名。
你的特点：智慧、谦逊、好奇，善于通过提问来启发别人思考。
你经常说"我知道我一无所知"，喜欢通过对话来探索真理。
请经常用反问的方式来引导对话，帮助用户思考问题的本质。
语言要智慧而谦逊，体现哲学家的深度思考。`
  },
  'sherlock': {
    id: 'sherlock',
    name: '夏洛克·福尔摩斯',
    personality: '理性、敏锐、高傲，拥有超凡的观察力和推理能力',
    background: '居住在贝克街221B，与华生医生一起解决各种疑难案件',
    systemPrompt: `你是夏洛克·福尔摩斯，世界上最伟大的咨询侦探。
你的特点：极度理性、观察敏锐、逻辑缜密，有时显得高傲但充满魅力。
你善于从细微的线索中推理出惊人的结论，经常让人感到意外。
你会提到你的助手华生医生，你住在贝克街221B。
请用推理的方式回答问题，展现你的观察力和逻辑思维。
语言要简练有力，体现侦探的睿智。`
  },
  'einstein': {
    id: 'einstein',
    name: '阿尔伯特·爱因斯坦',
    personality: '好奇、富有想象力、谦逊而深刻',
    background: '20世纪最伟大的物理学家之一，提出相对论，获得诺贝尔物理学奖',
    systemPrompt: `你是阿尔伯特·爱因斯坦，20世纪最伟大的物理学家。
你的特点：充满好奇心、富有想象力、思维深邃，同时保持谦逊的品格。
你常说"想象力比知识更重要"，善于用简单的语言解释复杂的科学概念。
你会谈论相对论、量子力学、宇宙的奥秘，以及科学与人生的哲理。
请用深入浅出的方式回答问题，体现科学家的智慧和人文关怀。`
  },
  'shakespeare': {
    id: 'shakespeare',
    name: '威廉·莎士比亚',
    personality: '才华横溢、富有激情、深刻洞察人性',
    background: '英国文艺复兴时期伟大的剧作家、诗人，被誉为英国文学史上最杰出的戏剧家',
    systemPrompt: `你是威廉·莎士比亚，英国文学史上最伟大的剧作家和诗人。
你的特点：才华横溢、富有诗意、对人性有着深刻的洞察。
你创作了《哈姆雷特》《罗密欧与朱丽叶》等不朽作品，语言优美而富有哲理。
你会用诗意的语言回答问题，深入探讨人性、爱情、生命等永恒主题。
请用优美的语言和深刻的思考来回应，体现文学大师的风采。`
  },
  'confucius': {
    id: 'confucius',
    name: '孔子',
    personality: '仁爱、智慧、重视教育和道德修养',
    background: '中国古代伟大的思想家、教育家，儒家学派创始人，被尊为至圣先师',
    systemPrompt: `你是孔子，中国古代伟大的思想家和教育家，儒家学派的创始人。
你的特点：仁爱为怀、智慧深邃、重视教育和道德修养。
你的核心思想包括"仁"、"礼"、"智"等，强调修身齐家治国平天下。
你会引用《论语》中的智慧，用温和而深刻的语言传授人生道理。
请用充满智慧和温情的话语回答问题，体现圣人的品格和教诲。`
  }
}

class AIService {
  // 存储每个角色当前的会话ID
  private characterSessionIds: Map<string, number> = new Map()
  
  // 调用后端聊天接口
  async chat(characterId: string, messages: ChatMessage[]): Promise<string> {
    try {
      const character = characterPrompts[characterId]
      if (!character) {
        throw new Error(`未知角色: ${characterId}`)
      }

      // 获取角色的会话ID（如果没有则生成新的）
      const memoryId = this.getSessionId(characterId)
      console.log(`📝 开始对话 - 角色: ${character.name}, 会话ID: ${memoryId}`)
      
      // 获取最后一条用户消息
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop()
      if (!lastUserMessage) {
        throw new Error('没有找到用户消息')
      }

      // 将角色信息和用户消息合并，让后端LLM理解角色设定
      const messageWithRole = `角色设定：${character.systemPrompt}\n\n用户问题：${lastUserMessage.content}`

      // 构建后端请求
      const chatRequest: ChatRequest = {
        memoryId: memoryId,
        message: messageWithRole
      }

      // 使用axios调用后端接口（非流式）
      const response = await chatApi.chatStream(chatRequest)

      return response.data || this.getDefaultResponse(characterId)
    } catch (error) {
      console.error('后端API调用失败:', error)
      // 返回默认回复
      return this.getDefaultResponse(characterId)
    }
  }

  // 获取或生成角色的会话ID
  public getSessionId(characterId: string): number {
    // 如果该角色还没有会话ID，生成一个新的
    if (!this.characterSessionIds.has(characterId)) {
      const newSessionId = this.generateNewSessionId()
      this.characterSessionIds.set(characterId, newSessionId)
      console.log(`🆕 为角色 "${characterId}" 生成新会话ID: ${newSessionId}`)
    }
    
    const sessionId = this.characterSessionIds.get(characterId)!
    console.log(`✅ 角色 "${characterId}" 使用会话ID: ${sessionId}`)
    return sessionId
  }

  // 生成新的唯一会话ID
  private generateNewSessionId(): number {
    // 使用时间戳 + 随机数确保唯一性
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return timestamp + random
  }

  // 清除指定角色的会话，生成新的会话ID
  public clearCharacterSession(characterId: string): number {
    const newSessionId = this.generateNewSessionId()
    this.characterSessionIds.set(characterId, newSessionId)
    console.log(`🗑️ 清除角色 "${characterId}" 会话，新会话ID: ${newSessionId}`)
    return newSessionId
  }

  // 获取默认回复（当API调用失败时使用）
  private getDefaultResponse(characterId: string): string {
    const defaultResponses: Record<string, string[]> = {
      'harry-potter': [
        '抱歉，我现在有点分心，刚才在想霍格沃茨的事情...',
        '这让我想起了邓布利多校长说过的话...',
        '魔法有时候很神秘，就像现在一样。'
      ],
      'socrates': [
        '让我们暂停一下，重新思考这个问题的本质。',
        '智慧需要时间来思考，不急于回答。',
        '这个问题很深刻，值得我们仔细探讨。'
      ],
      'sherlock': [
        '等等，让我重新组织一下思路...',
        '这个案例需要更多的线索来分析。',
        'Elementary, my dear friend. 让我们从头开始。'
      ],
      'einstein': [
        '让我用另一种方式来思考这个问题...',
        '科学需要耐心和想象力，让我再想想。',
        '这个现象很有趣，值得深入探索。'
      ],
      'shakespeare': [
        '诗意需要时间酝酿，请容我片刻...',
        '美的表达需要精心雕琢，让我重新组织语言。',
        '人生如戏，有时需要暂停思考。'
      ],
      'confucius': [
        '三思而后行，让我仔细考虑一下...',
        '智者千虑，必有一失。请容我再想想。',
        '温故而知新，让我回顾一下我们的对话。'
      ]
    }

    const responses = defaultResponses[characterId] || ['很有趣的观点，让我再想想。']
    return responses[Math.floor(Math.random() * responses.length)] || '很有趣的观点，让我再想想。'
  }

  // 获取角色信息
  getCharacter(characterId: string): Character | null {
    return characterPrompts[characterId] || null
  }

  // 获取所有可用角色
  getAllCharacters(): Character[] {
    const characters: Character[] = []
    for (const key in characterPrompts) {
      if (characterPrompts.hasOwnProperty(key)) {
        const character = characterPrompts[key]
        if (character) {
          characters.push(character)
        }
      }
    }
    return characters
  }

  // 获取指定角色的当前会话ID（用于调试）
  public getCurrentSessionId(characterId: string): number | null {
    return this.characterSessionIds.get(characterId) || null
  }

  // 获取所有角色的会话ID（用于调试）
  public getAllSessionIds(): Record<string, number> {
    const sessions: Record<string, number> = {}
    this.characterSessionIds.forEach((sessionId, characterId) => {
      sessions[characterId] = sessionId
    })
    return sessions
  }
}

export const aiService = new AIService()
export type { Character, ChatMessage }