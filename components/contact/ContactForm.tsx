'use client'

import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

interface FormValues {
  name: string
  email: string
  subject: string
  message: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactForm() {
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>()

  // Pre-fill subject from query param (e.g. from photography print inquiry)
  useEffect(() => {
    const sub = params.get('subject')
    if (sub) setValue('subject', sub)
  }, [params, setValue])

  const onSubmit = async (data: FormValues) => {
    setStatus('sending')
    try {
      // Replace this block with your preferred email service (EmailJS, Resend, Formspree, etc.)
      // For now, opens the default mail client as a graceful fallback.
      const mailtoBody = encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
      )
      window.location.href = `mailto:cmqcalloway7@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${mailtoBody}`
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm font-medium bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 ${
      hasError
        ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/30'
        : 'border-zinc-200 dark:border-zinc-700 focus:border-brand focus:ring-2 focus:ring-brand/20'
    }`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Name <span className="text-brand">*</span>
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            placeholder="Christian Calloway"
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <FiAlertCircle size={11} /> {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email <span className="text-brand">*</span>
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
            placeholder="you@example.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <FiAlertCircle size={11} /> {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Subject <span className="text-brand">*</span>
        </label>
        <input
          {...register('subject', { required: 'Subject is required' })}
          placeholder="What&apos;s this about?"
          className={inputClass(!!errors.subject)}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <FiAlertCircle size={11} /> {errors.subject.message}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Message <span className="text-brand">*</span>
        </label>
        <textarea
          {...register('message', { required: 'Message is required', minLength: { value: 10, message: 'Message must be at least 10 characters' } })}
          rows={6}
          placeholder="Tell me what&apos;s on your mind..."
          className={`${inputClass(!!errors.message)} resize-none`}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <FiAlertCircle size={11} /> {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <FiSend size={16} />
              Send Message
            </>
          )}
        </button>

        {status === 'success' && (
          <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
            <FiCheckCircle size={16} />
            Message sent! I&apos;ll be in touch.
          </p>
        )}
        {status === 'error' && (
          <p className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
            <FiAlertCircle size={16} />
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </form>
  )
}
