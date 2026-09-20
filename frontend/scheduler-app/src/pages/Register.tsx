import { useNavigate } from 'react-router-dom'
import { AuthForm } from '@/components/AuthForm'
import { useAuth } from '@/context/AuthContext'

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Create an account"
      description="Email and a password of at least 8 characters."
      submitLabel="Create account"
      onSubmit={async (email, password) => {
        await signUp(email, password)
        navigate('/calendar', { replace: true })
      }}
      footer={{ prompt: 'Already have an account?', linkLabel: 'Sign in', to: '/login' }}
    />
  )
}
