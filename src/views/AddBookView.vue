<template>
  <div class="add-book">
    <div class="card">
      <h2 class="section-title">Add a Book</h2>
      
      <form @submit.prevent="addBook">
        <div class="form-group">
          <label class="form-label" for="title">Book Title *</label>
          <input 
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="Enter book title"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="author">Author</label>
          <input 
            id="author"
            v-model="form.author"
            type="text"
            class="form-input"
            placeholder="Enter author name"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="pages">Number of Pages</label>
          <input 
            id="pages"
            v-model.number="form.pages"
            type="number"
            class="form-input"
            placeholder="Enter page count"
            min="1"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="dateFinished">Date Finished</label>
          <input 
            id="dateFinished"
            v-model="form.dateFinished"
            type="date"
            class="form-input"
          />
        </div>

        <button type="submit" class="btn btn-success btn-full" :disabled="saving">
          {{ saving ? 'Saving...' : '✓ Add Book' }}
        </button>
      </form>
    </div>

    <div v-if="showSuccess" class="success-message">
      <div class="card" style="background: #ecfdf5; border-color: #10b981;">
        <p style="color: #065f46; text-align: center;">
          ✅ Book added successfully!
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
import { supabase } from '../lib/supabase'
import { useUser } from '../stores/user'

const router = useRouter()
const { currentUser } = useUser()

const showSuccess = ref(false)
const errorMessage = ref('')
const saving = ref(false)

const form = reactive({
  title: '',
  author: '',
  pages: null,
  dateFinished: new Date().toISOString().split('T')[0]
})

async function addBook() {
  saving.value = true
  errorMessage.value = ''
  
  const { error } = await supabase
    .from('books')
    .insert({
      user_id: currentUser.value.id,
      title: form.title,
      author: form.author || null,
      pages: form.pages || 0,
      date_finished: form.dateFinished || null
    })
  
  saving.value = false
  
  if (error) {
    console.error('Error adding book:', error)
    errorMessage.value = 'Failed to add book. Please try again.'
    return
  }
  
  // Show success and reset form
  showSuccess.value = true
  form.title = ''
  form.author = ''
  form.pages = null
  form.dateFinished = new Date().toISOString().split('T')[0]
  
  setTimeout(() => {
    showSuccess.value = false
    router.push('/')
  }, 1500)
}
</script>
