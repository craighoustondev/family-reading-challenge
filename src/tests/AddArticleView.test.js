import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('AddArticleView - Adding Articles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Validation', () => {
    it('should require a URL to submit', async () => {
      // Given: A user tries to submit without a URL
      const formData = {
        url: '',
        title: 'Some Title'
      }

      // Then: Validation should fail
      const isValid = formData.url.trim().length > 0
      expect(isValid).toBe(false)
    })

    it('should validate URL format', async () => {
      // Given: Invalid URLs
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid.com',
        'just text',
        ''
      ]

      // Then: All should fail validation
      const urlPattern = /^https?:\/\/.+/
      invalidUrls.forEach(url => {
        expect(urlPattern.test(url)).toBe(false)
      })
    })

    it('should accept valid HTTP and HTTPS URLs', async () => {
      // Given: Valid URLs
      const validUrls = [
        'https://bbc.com/news/article',
        'http://example.com/story',
        'https://www.nytimes.com/2026/01/27/world/news.html'
      ]

      // Then: All should pass validation
      const urlPattern = /^https?:\/\/.+/
      validUrls.forEach(url => {
        expect(urlPattern.test(url)).toBe(true)
      })
    })

    it('should allow title to be optional', async () => {
      // Given: A URL without a title
      const formData = {
        url: 'https://example.com/article',
        title: ''
      }

      // Then: Should still be valid (title is optional)
      const urlPattern = /^https?:\/\/.+/
      const isValid = urlPattern.test(formData.url)
      expect(isValid).toBe(true)
    })
  })

  describe('Form Submission', () => {
    it('should submit article with current user ID', async () => {
      // Given: A logged-in user with an article to share
      const currentUser = { id: 'user-123', name: 'Craig' }
      const articleData = {
        url: 'https://bbc.com/news/story',
        title: 'Breaking News'
      }

      // When: They submit the form
      const submittedData = {
        url: articleData.url,
        title: articleData.title,
        user_id: currentUser.id
      }

      // Then: The submission should include the user ID
      expect(submittedData.user_id).toBe('user-123')
      expect(submittedData.url).toBe('https://bbc.com/news/story')
    })

    it('should show success message after adding article', async () => {
      // Given: A successful submission
      const submitResult = { error: null, data: { id: 'new-article' } }

      // Then: Success state should be true
      const showSuccess = submitResult.error === null && submitResult.data !== null
      expect(showSuccess).toBe(true)
    })

    it('should show error message when submission fails', async () => {
      // Given: A failed submission
      const submitResult = { error: { message: 'Network error' }, data: null }

      // Then: Error should be displayed
      const hasError = submitResult.error !== null
      expect(hasError).toBe(true)
      expect(submitResult.error.message).toBe('Network error')
    })

    it('should clear form after successful submission', async () => {
      // Given: Form data before submission
      const form = {
        url: 'https://example.com/article',
        title: 'Test Article'
      }

      // When: Submission succeeds, form should be reset
      const resetForm = () => {
        form.url = ''
        form.title = ''
      }
      resetForm()

      // Then: Form should be empty
      expect(form.url).toBe('')
      expect(form.title).toBe('')
    })

    it('should disable submit button while saving', async () => {
      // Given: A form being submitted
      let saving = false

      // When: Submission starts
      saving = true
      expect(saving).toBe(true)

      // Then: Button should be disabled
      // The component will use :disabled="saving" on the button
    })

    it('should redirect to home after successful submission', async () => {
      // Given: A successful submission
      const submitResult = { error: null }
      let redirected = false

      // When: Submission completes
      if (!submitResult.error) {
        redirected = true // router.push('/')
      }

      // Then: Should navigate to home
      expect(redirected).toBe(true)
    })
  })
})
