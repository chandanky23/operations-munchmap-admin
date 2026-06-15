import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, LogOut, RefreshCw } from 'lucide-react'

export const Layout = () => {
  const { adminUser, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">
                  MunchMap Operations
                </span>
              </div>

              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/refunds" active={isActive('/refunds')}>
                  <RefreshCw className="w-4 h-4" />
                  Refunds
                </NavLink>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {adminUser && (
                <>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{adminUser.name}</div>
                    <div className="text-gray-500 text-xs">{adminUser.role}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

const NavLink = ({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: React.ReactNode
}) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? 'bg-purple-100 text-purple-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </Link>
)
