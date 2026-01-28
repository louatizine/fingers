import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-light flex flex-col justify-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <p className="mt-4 text-3xl font-semibold text-neutral-charcoal">Page not found</p>
        <p className="mt-2 text-base text-neutral-dark">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-sm text-white bg-primary hover:bg-primary-hover transition-colors"
          >
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
