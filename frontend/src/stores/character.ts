import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Character {
  id: string
  name: string
  description: string
  avatar: string
  personality: string
  background: string
  tags: string[]
}

export const useCharacterStore = defineStore('character', () => {
  // 角色数据 - 以Chat.vue中的为准
  const characters = ref<Record<string, Character>>({
    'harry-potter': {
      id: 'harry-potter',
      name: '哈利·波特',
      description: '勇敢的霍格沃茨学生，拥有神奇的魔法力量',
      avatar: 'https://hips.hearstapps.com/hmg-prod/images/5b9220e397989d525f94f407a870d54f-1609387367.jpg?crop=1.00xw:0.367xh;0,0.160xh&resize=1200:*',
      personality: '勇敢、忠诚、有正义感，有时会冲动',
      background: '孤儿出身，11岁时发现自己是巫师，进入霍格沃茨魔法学校学习',
      tags: ['魔法', '冒险', '友谊']
    },
    'socrates': {
      id: 'socrates',
      name: '苏格拉底',
      description: '古希腊哲学家，以苏格拉底式问答法闻名',
      avatar: 'https://philomedium.com/sites/default/files/portrait/image/Socrates_2.png',
      personality: '智慧、谦逊、好奇，喜欢通过提问来启发思考',
      background: '古希腊雅典哲学家，被誉为西方哲学的奠基者之一',
      tags: ['哲学', '智慧', '思辨']
    },
    'sherlock': {
      id: 'sherlock',
      name: '夏洛克·福尔摩斯',
      description: '世界著名的私人咨询侦探',
      avatar: 'https://w9.talentsays.com/upload/famousphoto/Famous20326.png',
      personality: '理性、敏锐、高傲，拥有超凡的观察力和推理能力',
      background: '居住在贝克街221B，与华生医生一起解决各种疑难案件',
      tags: ['推理', '侦探', '逻辑']
    },
    'einstein': {
      id: 'einstein',
      name: '阿尔伯特·爱因斯坦',
      description: '理论物理学家，相对论的提出者',
      avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/500px-Albert_Einstein_Head.jpg',
      personality: '好奇、富有想象力、谦逊而深刻',
      background: '20世纪最伟大的物理学家之一，提出相对论，获得诺贝尔物理学奖',
      tags: ['科学', '物理', '创新']
    },
    'shakespeare': {
      id: 'shakespeare',
      name: '威廉·莎士比亚',
      description: '英国文学史上最杰出的戏剧家',
      avatar: 'https://d1qrzs23hpns6w.cloudfront.net/filters:format(webp)/f/84976/450x450/2acf9d5ea4/global-shakespeare-translating-iambic-pentameter-index.jpg',
      personality: '才华横溢、富有激情、深刻洞察人性',
      background: '英国文艺复兴时期伟大的剧作家、诗人，被誉为英国文学史上最杰出的戏剧家',
      tags: ['文学', '戏剧', '诗歌']
    },
    'confucius': {
      id: 'confucius',
      name: '孔子',
      description: '中国古代思想家、教育家',
      avatar: 'https://i.imgur.com/517BOnS.jpg',
      personality: '仁爱、智慧、重视教育和道德修养',
      background: '中国古代伟大的思想家、教育家，儒家学派创始人，被尊为至圣先师',
      tags: ['儒学', '教育', '道德']
    }
  })

  const currentCharacter = ref<Character | null>(null)

  // 计算属性：获取所有角色列表
  const allCharacters = computed(() => {
    return Object.values(characters.value)
  })

  // 根据ID获取角色
  const getCharacterById = (id: string): Character | null => {
    return characters.value[id] || null
  }

  // 设置当前角色
  const setCurrentCharacter = (character: Character) => {
    currentCharacter.value = character
  }

  // 根据ID设置当前角色
  const setCurrentCharacterById = (id: string) => {
    const character = getCharacterById(id)
    if (character) {
      currentCharacter.value = character
    }
  }

  // 清除当前角色
  const clearCurrentCharacter = () => {
    currentCharacter.value = null
  }

  // 搜索角色
  const searchCharacters = (query: string): Character[] => {
    if (!query.trim()) return allCharacters.value
    
    const lowercaseQuery = query.toLowerCase()
    return allCharacters.value.filter(character => 
      character.name.toLowerCase().includes(lowercaseQuery) ||
      character.description.toLowerCase().includes(lowercaseQuery) ||
      character.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    characters,
    currentCharacter,
    allCharacters,
    getCharacterById,
    setCurrentCharacter,
    setCurrentCharacterById,
    clearCurrentCharacter,
    searchCharacters
  }
})