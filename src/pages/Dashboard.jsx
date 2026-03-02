import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import DataTable from '../components/DataTable'
import { Users, Smartphone, UserPlus, HardDrive } from 'lucide-react'

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
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

      {/* Device type breakdown */}
      {stats?.deviceTypes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.deviceTypes.map((dt) => (
                <div key={dt.type} className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                  <span className="font-medium">{dt.type || 'Unknown'}</span>
                  <span className="text-muted-foreground">{dt.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
