import { useAuth } from '../auth/useAuth'
import { ROLE_DESCRIPTIONS } from '../auth/roles'

function Home() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <section>
      <h1>Olá, {user.nome.split(' ')[0]}!</h1>
      <p>{ROLE_DESCRIPTIONS[user.role]}</p>
    </section>
  )
}

export default Home
