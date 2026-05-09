import { LoginForm } from '@/components/organisms/LoginForm'
import { DocumentIcon } from '@/components/atoms/icons'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <DocumentIcon className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your workspace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
