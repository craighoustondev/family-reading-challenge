<template>
  <div class="add-book">
    <div class="card">
      <h2 class="section-title">Add a Book</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="title">Book Title *</label>
          <input 
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="e.g. The Great Gatsby"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="author">Author (optional)</label>
          <input 
            id="author"
            v-model="form.author"
            type="text"
            class="form-input"
            placeholder="e.g. F. Scott Fitzgerald"
          />
        </div>

        <button type="submit" class="btn btn-success btn-full" :disabled="saving">
          {{ saving ? 'Adding...' : '📚 Add Book' }}
        </button>
      </form>
    </div>

    <div v-if="showSuccess" class="success-message">
      <div class="card" style="background: #ecfdf5; border-color: #10b981;">
        <p style="color: #065f46; text-align: center;">
          ✅ Book added! Start logging your reading progress.
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
import { addBook } from '../stores/books'

const router = useRouter()
const { currentUser } = useUser()

const showSuccess = ref(false)
const errorMessage = ref('')
const saving = ref(false)

const form = reactive({
  title: '',
  author: ''
})

async function handleSubmit() {
  saving.value = true
  errorMessage.value = ''

  const result = await addBook({
    title: form.title,
    author: form.author,
    userId: currentUser.value.id
  })

  saving.value = false

  if (result.error) {
    errorMessage.value = result.error.message
    return
  }

  // Success - show message and redirect to the book detail
  showSuccess.value = true
  form.title = ''
  form.author = ''

  setTimeout(() => {
    showSuccess.value = false
    router.push(`/book/${result.data.id}`)
  }, 1500)
}
</script>

<style scoped>
.success-message,
.error-message {
  margin-top: 1rem;
}
</style>
