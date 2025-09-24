<template>
  <div class="home">
    <!-- 顶部标题栏 -->
    <el-header class="app-header">
      <h1 class="title">AI 角色扮演助手</h1>
      <p class="subtitle">与您喜爱的角色进行智能对话</p>
    </el-header>

    <!-- 搜索栏 -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索您感兴趣的角色，如哈利波特、苏格拉底..."
        size="large"
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 角色列表 -->
    <div class="characters-section">
      <h2 class="section-title">热门角色</h2>
      <div class="character-grid-container">
        <el-card 
          v-for="character in filteredCharacters" 
          :key="character.id"
          class="character-card" 
          :class="{ 'single-character': filteredCharacters.length === 1 }"
          :body-style="{ padding: '20px' }"
          @click="selectCharacter(character)"
          shadow="hover"
        >
          <div class="character-avatar">
            <img :src="character.avatar" :alt="character.name" />
          </div>
          <div class="character-info">
            <h3 class="character-name">{{ character.name }}</h3>
            <p class="character-description">{{ character.description }}</p>
            <div class="character-tags">
              <el-tag 
                v-for="tag in character.tags" 
                :key="tag" 
                size="small" 
                class="character-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useCharacterStore, type Character } from '@/stores/character'

const router = useRouter()
const searchQuery = ref('')
const characterStore = useCharacterStore()

// 使用store中的角色数据
const characters = computed(() => characterStore.allCharacters)

// 搜索过滤
const filteredCharacters = computed(() => {
  return characterStore.searchCharacters(searchQuery.value)
})

const handleSearch = () => {
  // 搜索逻辑已通过store的searchCharacters方法实现
}

const selectCharacter = (character: Character) => {
  // 设置当前角色到store
  characterStore.setCurrentCharacter(character)
  router.push(`/chat/${character.id}`)
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  text-align: center;
  padding: 40px 0;
  color: white;
}

.title {
  margin: 0 0 10px 0;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.search-section {
  padding: 60px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  font-size: 16px;
}

.search-input :deep(.el-input__inner) {
  border-radius: 25px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.characters-section {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  color: white;
  font-size: 2rem;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.character-grid {
  margin-top: 20px;
}

.character-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  border-radius: 15px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.character-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.character-avatar {
  text-align: center;
  margin-bottom: 15px;
}

.character-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #667eea;
}

.character-info {
  text-align: center;
}

.character-name {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
}

.character-description {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.character-tag {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
}
</style>