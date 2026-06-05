import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import DataTable from '../components/DataTable'
import { Users, Smartphone, UserPlus, HardDrive, UserX } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, recentRes] = await Promise.all([
          adminApi.dashboard(),
          adminApi.recentRegistrations(7, 10),
        ])
        setStats(statsRes.data)
        setRecent(recentRes.data)
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users },
        { label: 'Total Devices', value: stats.totalDevices, icon: Smartphone },
        { label: '7-Day Signups', value: stats.recentSignups, icon: UserPlus },
        { label: '7-Day Devices', value: stats.recentDevices, icon: HardDrive },
        { label: 'Guest Users', value: stats.guestAnalytics?.activeGuests ?? 0, icon: UserX },
      ]
    : []

  const recentColumns = [
    { key: 'email', label: 'Email' },
    { key: 'verified', label: 'Verified', render: (r) => (r.verified ? 'Yes' : 'No') },
    { key: 'deviceCount', label: 'Devices' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((s) => (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Platform split */}
        {stats?.platforms?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.platforms.map((p) => {
                  const pct = stats.totalUsers > 0 ? Math.round((p.count / stats.totalUsers) * 100) : 0
                  return (
                    <div key={p.platform} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{p.platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${p.platform === 'ios' ? 'bg-blue-500' : p.platform === 'android' ? 'bg-green-500' : 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">{p.count} ({pct}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auth provider split */}
        {stats?.authProviders?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auth Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.authProviders.map((a) => {
                  const pct = stats.totalUsers > 0 ? Math.round((a.count / stats.totalUsers) * 100) : 0
                  return (
                    <div key={a.provider} className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{a.provider}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${a.provider === 'apple' ? 'bg-gray-800' : a.provider === 'google' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">{a.count} ({pct}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guest analytics */}
        {stats?.guestAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Guest Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total Guests</span>
                  <span className="text-muted-foreground">{stats.guestAnalytics.totalGuests}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Active (not converted)</span>
                  <span className="text-muted-foreground">{stats.guestAnalytics.activeGuests}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Converted</span>
                  <span className="text-muted-foreground">{stats.guestAnalytics.converted}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                  <span className="font-medium">Conversion Rate</span>
                  <span className="font-semibold text-green-600">{stats.guestAnalytics.conversionPct}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device types */}
        {stats?.deviceTypes?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.deviceTypes.map((dt) => (
                  <div key={dt.type} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dt.type || 'Unknown'}</span>
                    <span className="text-muted-foreground">{dt.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent registrations */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Registrations (7 days)</h2>
        <DataTable
          columns={recentColumns}
          data={recent}
          loading={loading}
          onRowClick={(r) => navigate(`/users/${r.id}`)}
          emptyMessage="No recent registrations"
        />
      </div>
    </div>
  )
}
