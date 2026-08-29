import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section id="center">
      <div>
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    </section>
  )
}

export default NotFound
