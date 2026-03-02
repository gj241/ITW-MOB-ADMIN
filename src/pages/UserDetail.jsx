import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import DataTable from '../components/DataTable'
import { ArrowLeft, Shield, ShieldOff, CheckCircle, XCircle, Trash2 } from 'lucide-react'

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = async () => {
    try {
      const res = await adminApi.getUser(userId)
      setUser(res.data)
    } catch (err) {
      console.error('Failed to load user', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  const toggleAdmin = async () => {
    setActionLoading(true)
    try {
      await adminApi.updateUser(userId, { admin: !user.admin })
      await load()
    } catch (err) {
      console.error('Failed to update user', err)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleVerified = async () => {
    setActionLoading(true)
    try {
      await adminApi.updateUser(userId, { verified: !user.verified })
      await load()
    } catch (err) {
      console.error('Failed to update user', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await adminApi.deleteUser(userId)
      navigate('/users')
    } catch (err) {
      console.error('Failed to delete user', err)
      setActionLoading(false)
    }
  }

  const deviceColumns = [
    { key: 'customName', label: 'Name', render: (r) => r.customName || 'Unnamed' },
    { key: 'deviceType', label: 'Type', render: (r) => r.deviceType || '-' },
    { key: 'macAddress', label: 'MAC' },
    {
      key: 'pinSet',
      label: 'PIN',
      render: (r) => (
        <Badge variant={r.pinSet ? 'default' : 'secondary'}>
          {r.pinSet ? 'Set' : 'None'}
        </Badge>
      ),
    },
    {
      key: 'lastConnected',
      label: 'Last Connected',
      render: (r) => (r.lastConnected ? new Date(r.lastConnected).toLocaleDateString() : 'Never'),
    },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!user) {
    return <p className="text-muted-foreground">User not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">User Detail</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{user.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{user.phone || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Verified</p>
              <Badge variant={user.verified ? 'default' : 'secondary'}>
                {user.verified ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Admin</p>
              <Badge variant={user.admin ? 'destructive' : 'secondary'}>
                {user.admin ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Registered</p>
              <p>{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Login</p>
              <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Devices</p>
              <p>{user.devices?.length || 0}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAdmin}
              disabled={actionLoading}
            >
              {user.admin ? <ShieldOff className="mr-1 h-4 w-4" /> : <Shield className="mr-1 h-4 w-4" />}
              {user.admin ? 'Remove Admin' : 'Make Admin'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVerified}
              disabled={actionLoading}
            >
              {user.verified ? <XCircle className="mr-1 h-4 w-4" /> : <CheckCircle className="mr-1 h-4 w-4" />}
              {user.verified ? 'Unverify' : 'Verify'}
            </Button>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={user.admin}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete User</DialogTitle>
                  <DialogDescription>
                    This will permanently delete {user.email} and all their devices. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* User's devices */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Devices</h2>
        <DataTable
          columns={deviceColumns}
          data={user.devices || []}
          loading={false}
          onRowClick={(r) => navigate(`/devices/${r.id}`)}
          emptyMessage="No devices registered"
        />
      </div>
    </div>
  )
}
