<template>
  <div class="add-article">
    <div class="card">
      <h2 class="section-title">Share an Article</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="url">Article URL *</label>
          <input 
            id="url"
            v-model="form.url"
            type="url"
            class="form-input"
            placeholder="https://example.com/article"
            required
          />
          <p class="form-hint">Paste the link to the article you want to share</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="title">Title (optional)</label>
          <input 
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="Give it a title or leave blank"
          />
        </div>

        <button type="submit" class="btn btn-success btn-full" :disabled="saving">
          {{ saving ? 'Sharing...' : '📤 Share Article' }}
        </button>
      </form>
    </div>

    <div v-if="showSuccess" class="success-message">
      <div class="card" style="background: #ecfdf5; border-color: #10b981;">
        <p style="color: #065f46; text-align: center;">
          ✅ Article shared with your family!
        </p>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      <div class="card" style="background: #fef2f2; border-color: #ef4444;">
        <p style="color: #991b1b; text-align: center;">
          ❌ {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '../stores/user'
import { addArticle } from '../stores/articles'

const router = useRouter()
const { currentUser } = useUser()

const showSuccess = ref(false)
const errorMessage = ref('')
const saving = ref(false)

const form = reactive({
  url: '',
  title: ''
})

async function handleSubmit() {
  saving.value = true
  errorMessage.value = ''

  const result = await addArticle({
    url: form.url,
    title: form.title,
    userId: currentUser.value.id
  })

  saving.value = false

  if (result.error) {
    errorMessage.value = result.error.message
    return
  }

  // Success - show message and redirect
  showSuccess.value = true
  form.url = ''
  form.title = ''

  setTimeout(() => {
    showSuccess.value = false
    router.push('/')
  }, 1500)
}
</script>

<style scoped>
.form-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
}

.success-message,
.error-message {
  margin-top: 1rem;
}
</style>
