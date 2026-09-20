import { useNavigate } from 'react-router-dom'
import { AuthForm } from '@/components/AuthForm'
import { useAuth } from '@/context/AuthContext'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthForm
      title="Sign in"
      description="Your appointments, only yours."
      submitLabel="Sign in"
      onSubmit={async (email, password) => {
        await signIn(email, password)
        navigate('/', { replace: true })
      }}
      footer={{ prompt: 'No account yet?', linkLabel: 'Create one', to: '/register' }}
    />
  )
}
