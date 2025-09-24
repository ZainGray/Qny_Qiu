// 语音识别和语音合成服务 - 支持多种TTS引擎
export class VoiceService {
  private recognition: any = null
  private synthesis: SpeechSynthesis
  private isRecognitionSupported: boolean
  private isSynthesisSupported: boolean
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying: boolean = false

  // TTS引擎配置
  private ttsConfig = {
    // 优先使用Edge-TTS (更自然的语音)
    useEdgeTTS: true,
    // 备用使用浏览器内置TTS
    fallbackToWebAPI: true,
    // 角色专属语音配置
    characterVoices: {
      'harry-potter': {
        edgeVoice: 'zh-CN-YunyeNeural',     
        webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)', // 男声
        rate: 2.3,
        pitch: 0.9
      },
      'socrates': {
        edgeVoice: 'zh-CN-YunjianNeural',    // 成熟男性，沉稳
        webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
        rate: 2.1,
        pitch: 0.9
      },
      'sherlock': {
        edgeVoice: 'zh-CN-YunxiNeural',      // 理性男性，清晰
        webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
        rate: 2.1,
        pitch: 0.95
      },
      'einstein': {
        edgeVoice: 'zh-CN-YunyangNeural',    // 智慧男性，温和
        webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
        rate: 2.1,
        pitch: 1.0
      },
      'shakespeare': {
        edgeVoice: 'zh-CN-YunjianNeural',     // 优雅女性，诗意
        webVoice: 'Microsoft Huihui - Chinese (Simplified, PRC)',
        rate: 2.1,
        pitch: 1.05
      },
      'confucius': {
        edgeVoice: 'zh-CN-YunjianNeural',    // 长者男性，庄重
        webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)',
        rate: 2.0,
        pitch: 0.85
      }
    }
  }

  constructor() {
    // 初始化语音识别
    this.isRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    if (this.isRecognitionSupported) {
      this.recognition = new ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)()
      this.setupRecognition()
    }

    // 初始化语音合成
    this.synthesis = window.speechSynthesis
    this.isSynthesisSupported = 'speechSynthesis' in window
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'zh-CN'
    this.recognition.maxAlternatives = 1
  }

  // 开始语音识别
  async startRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isRecognitionSupported || !this.recognition) {
        reject(new Error('浏览器不支持语音识别'))
        return
      }

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`语音识别错误: ${event.error}`))
      }

      this.recognition.onend = () => {
        // 识别结束，如果没有结果则触发错误
      }

      try {
        this.recognition.start()
      } catch (error) {
        reject(error)
      }
    })
  }

  // 停止语音识别
  stopRecognition() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  // 增强的语音合成 - 支持多种TTS引擎
  async speak(text: string, characterId: string = '', options: {
    rate?: number
    pitch?: number
    volume?: number
    voice?: string
    lang?: string
  } = {}): Promise<void> {
    console.log('🔊 开始语音合成:', { text: text.substring(0, 50) + '...', characterId, isSynthesisSupported: this.isSynthesisSupported })
    
    try {
      // 停止当前播放
      this.stopSpeaking()

      // 获取角色语音配置
      const voiceConfig = this.getCharacterVoiceSettings(characterId)
      console.log('🎭 角色语音配置:', voiceConfig)
      
      // 优先尝试使用Edge-TTS
      if (this.ttsConfig.useEdgeTTS) {
        try {
          await this.speakWithEdgeTTS(text, characterId, voiceConfig)
          return
        } catch (error) {
          console.log('Edge-TTS不可用，使用浏览器内置TTS:', error)
        }
      }

      // 备用：使用浏览器内置TTS
      if (this.ttsConfig.fallbackToWebAPI) {
        console.log('📢 切换到浏览器内置TTS')
        try {
          await this.speakWithWebAPI(text, voiceConfig, options)
          console.log('✅ 浏览器TTS执行成功')
        } catch (webApiError) {
          console.error('❌ 浏览器TTS也失败了:', webApiError)
          throw webApiError
        }
      } else {
        console.error('❌ 所有TTS引擎都不可用')
        throw new Error('没有可用的TTS引擎')
      }
    } catch (error) {
      console.error('语音合成失败:', error)
      throw error
    }
  }

  // Edge-TTS语音合成（更自然）- 暂时使用模拟实现
  private async speakWithEdgeTTS(_text: string, _characterId: string, _voiceConfig: any): Promise<void> {
    // 暂时抛出错误，让系统使用浏览器TTS
    // 未来可以集成真实的Edge-TTS服务
    throw new Error('Edge-TTS服务暂未部署，使用浏览器内置TTS')
    
    /* 
    // 真实的Edge-TTS实现（需要后端支持）
    return new Promise(async (resolve, reject) => {
      try {
        const voiceName = voiceConfig.edgeVoice || 'zh-CN-XiaoxiaoNeural'
        const rate = `${Math.round((voiceConfig.rate || 1.0) * 100)}%`
        const pitch = `${Math.round(((voiceConfig.pitch || 1.0) - 1) * 50)}Hz`

        // 构建SSML
        const ssml = `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
            <voice name="${voiceName}">
              <prosody rate="${rate}" pitch="${pitch}">
                ${this.escapeXml(text)}
              </prosody>
            </voice>
          </speak>
        `

        // 使用Edge-TTS API (通过代理服务)
        const response = await fetch('/api/tts/edge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ssml: ssml,
            voice: voiceName,
            format: 'audio-24khz-48kbitrate-mono-mp3'
          })
        })

        if (!response.ok) {
          throw new Error(`Edge-TTS API error: ${response.status}`)
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        this.currentAudio = new Audio(audioUrl)
        this.currentAudio.onended = () => {
          this.isPlaying = false
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        this.currentAudio.onerror = () => {
          this.isPlaying = false
          URL.revokeObjectURL(audioUrl)
          reject(new Error('音频播放失败'))
        }

        this.isPlaying = true
        await this.currentAudio.play()
        
      } catch (error) {
        reject(error)
      }
    })
    */
  }

  // 浏览器内置TTS（备用）
  private async speakWithWebAPI(text: string, voiceConfig: any, _options: any): Promise<void> {
    console.log('🌐 开始浏览器TTS合成，文本长度:', text.length)
    
    return new Promise((resolve, reject) => {
      if (!this.isSynthesisSupported) {
        console.error('❌ 浏览器不支持语音合成')
        reject(new Error('浏览器不支持语音合成'))
        return
      }

      // 简化实现：直接使用speechSynthesis，不等待voices加载
      console.log('🎵 创建语音合成任务')
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置基本参数
      utterance.rate = voiceConfig.rate || 0.9
      utterance.pitch = voiceConfig.pitch || 1.0
      utterance.volume = 0.9
      utterance.lang = 'zh-CN'
      
      console.log('� 语音参数:', { 
        rate: utterance.rate, 
        pitch: utterance.pitch, 
        volume: utterance.volume,
        lang: utterance.lang 
      })

      // 尝试选择中文语音
      const voices = this.synthesis.getVoices()
      console.log('🎤 总语音数量:', voices.length)
      
      if (voices.length > 0) {
        const chineseVoices = voices.filter(voice => 
          voice.lang.includes('zh') || 
          voice.name.includes('Chinese') ||
          voice.name.includes('中文')
        )
        
        console.log('🇨🇳 中文语音数量:', chineseVoices.length)
        console.log('🎵 中文语音列表:', chineseVoices.map(v => `${v.name} (${v.lang})`))
        
        if (chineseVoices.length > 0 && chineseVoices[0]) {
          utterance.voice = chineseVoices[0]
          console.log('✅ 选择语音:', chineseVoices[0].name)
        }
      }

      // 设置事件监听
      utterance.onstart = () => {
        console.log('▶️ 语音开始播放')
        this.isPlaying = true
      }

      utterance.onend = () => {
        console.log('⏹️ 语音播放完成')
        this.isPlaying = false
        resolve()
      }

      utterance.onerror = (event) => {
        // console.error('❌ 语音播放错误:', event.error, event)
        this.isPlaying = false
        reject(new Error(`语音合成错误: ${event.error}`))
      }

      utterance.onpause = () => {
        console.log('⏸️ 语音暂停')
      }

      utterance.onresume = () => {
        console.log('▶️ 语音恢复')
      }

      // 发送到语音合成
      console.log('📢 调用 speechSynthesis.speak()')
      try {
        this.synthesis.speak(utterance)
        console.log('✅ speechSynthesis.speak() 调用成功')
      } catch (error) {
        console.error('❌ speechSynthesis.speak() 调用失败:', error)
        reject(error)
      }
    })
  }

  // 分句处理文本
  private splitIntoSentences(text: string): string[] {
    // 简化的分句处理，按句号、感叹号、问号分句
    let sentences = text.split(/[。！？]+/).filter(s => s.trim().length > 0)
    
    // 如果没有分出句子，按逗号分句
    if (sentences.length <= 1) {
      sentences = text.split(/[，；\n]+/).filter(s => s.trim().length > 0)
    }
    
    // 如果还是只有一句，直接使用原文
    if (sentences.length <= 1) {
      sentences = [text]
    }
    
    console.log('📝 分句结果:', sentences)
    return sentences
  }

  // 逐句播放
  private speakSentencesSequentially(
    sentences: string[], 
    voiceConfig: any, 
    options: any, 
    resolve: () => void, 
    reject: (error: Error) => void,
    index: number = 0
  ): void {
    console.log(`🎯 播放第 ${index + 1}/${sentences.length} 句:`, sentences[index]?.substring(0, 30) + '...')
    
    if (!this.isPlaying || index >= sentences.length) {
      console.log('✅ 语音播放完成')
      this.isPlaying = false
      resolve()
      return
    }

    const sentence = sentences[index]?.trim() || ''
    if (!sentence) {
      // 跳过空句子
      this.speakSentencesSequentially(sentences, voiceConfig, options, resolve, reject, index + 1)
      return
    }

    const utterance = new SpeechSynthesisUtterance(sentence)
    
    // 优化语音参数
    utterance.rate = voiceConfig.rate || 1.2
    utterance.pitch = voiceConfig.pitch || 1.0
    utterance.volume = 0.9
    utterance.lang = 'zh-CN'

    // 选择最佳中文语音
    const voices = this.getChineseVoices()
    console.log('🎤 可用中文语音:', voices.map(v => v.name))
    
    if (voices.length > 0) {
      // 优先选择高质量语音
      let selectedVoice = voices.find(voice => 
        voice.name.includes('Kangkang') || 
        voice.name.includes('Xiaoxiao') ||
        voice.name.includes('Yunyang')
      )
      
      if (!selectedVoice) {
        selectedVoice = voices[0]
      }
      
      console.log('🎵 选择语音:', selectedVoice?.name)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    utterance.onstart = () => {
      console.log('▶️ 开始播放语音')
    }

    utterance.onend = () => {
      console.log('⏹️ 句子播放完成，准备下一句')
      
      // 添加短暂停顿后播放下一句
      setTimeout(() => {
        this.speakSentencesSequentially(sentences, voiceConfig, options, resolve, reject, index + 1)
      }, 200)
    }

    utterance.onerror = (event) => {
      // console.error('❌ 语音播放错误:', event.error)
      this.isPlaying = false
      reject(new Error(`语音合成错误: ${event.error}`))
    }

    if (index === 0) {
      this.isPlaying = true
      console.log('🎬 开始语音播放序列')
    }

    console.log('📢 发送语音到synthesis.speak')
    this.synthesis.speak(utterance)
  }

  // XML转义
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // 停止语音播放
  stopSpeaking() {
    this.isPlaying = false
    
    // 停止Edge-TTS音频
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    
    // 停止浏览器内置TTS
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  // 检查是否正在播放
  isCurrentlyPlaying(): boolean {
    return this.isPlaying
  }

  // 获取可用的语音列表
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported) return []
    return this.synthesis.getVoices()
  }

  // 获取中文语音列表
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => 
      voice.lang.startsWith('zh') || 
      voice.name.includes('Chinese') ||
      voice.name.includes('中文') ||
      voice.name.includes('Mandarin')
    )
  }

  // 检查支持状态
  isRecognitionEnabled(): boolean {
    return this.isRecognitionSupported
  }

  isSynthesisEnabled(): boolean {
    return this.isSynthesisSupported
  }

  // 获取适合角色的语音设置
  getCharacterVoiceSettings(characterId: string): {
    rate: number
    pitch: number
    edgeVoice?: string
    webVoice?: string
  } {
    const characterVoices = this.ttsConfig.characterVoices as any
    return characterVoices[characterId] || {
      rate: 0.9,
      pitch: 1.0,
      edgeVoice: 'zh-CN-YunjianNeural',
      webVoice: 'Microsoft Kangkang - Chinese (Simplified, PRC)'
    }
  }

  // 设置TTS引擎偏好
  setTTSPreference(useEdgeTTS: boolean, fallbackToWebAPI: boolean = true) {
    this.ttsConfig.useEdgeTTS = useEdgeTTS
    this.ttsConfig.fallbackToWebAPI = fallbackToWebAPI
  }

  // 获取可用的Edge语音列表
  getAvailableEdgeVoices(): string[] {
    return [
      'zh-CN-YunyeNeural',     // 男性，活泼
      'zh-CN-YunjianNeural',   // 男性，沉稳
      'zh-CN-YunxiNeural',     // 男性，清晰
      'zh-CN-YunyangNeural',   // 男性，温和
    ]
  }
}

export const voiceService = new VoiceService()