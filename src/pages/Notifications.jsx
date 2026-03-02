import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { Send, Bell, Smartphone, X } from 'lucide-react'

export default function Notifications() {
  // Stats
  const [stats, setStats] = useState({ totalSent: 0, lastSevenDays: 0, registeredDevices: 0 })

  // Compose form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('broadcast')
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendResult, setSendResult] = useState(null)

  // History
  const [history, setHistory] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      const res = await adminApi.getNotificationStats()
      setStats(res.data)
    } catch (err) {
      console.error('Failed to load notification stats', err)
    }
  }, [])

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true)
    try {
      const res = await adminApi.getNotificationHistory(page)
      setHistory(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error('Failed to load notification history', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadHistory(1)
  }, [loadStats, loadHistory])

  // User search for targeted mode
  useEffect(() => {
    if (type !== 'targeted' || userSearch.length < 2) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await adminApi.searchUsers(userSearch, 10)
        const filtered = res.data.filter(
          (u) => !selectedUsers.some((s) => s.id === u.id)
        )
        setSearchResults(filtered)
      } catch (err) {
        console.error('User search failed', err)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [userSearch, type, selectedUsers])

  const addUser = (user) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
    setUserSearch('')
  }

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const canSend = title.trim() && body.trim() && (type === 'broadcast' || selectedUsers.length > 0)

  const handleSend = async () => {
    setConfirmOpen(false)
    setSending(true)
    setSendResult(null)
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        type,
        ...(type === 'targeted' && { userIds: selectedUsers.map((u) => u.id) }),
      }
      const res = await adminApi.sendNotification(payload)
      setSendResult(res.data)
      // Reset form
      setTitle('')
      setBody('')
      setSelectedUsers([])
      // Refresh data
      loadStats()
      loadHistory(1)
    } catch (err) {
      console.error('Failed to send notification', err)
      setSendResult({ error: err.response?.data?.message || 'Failed to send notification' })
    } finally {
      setSending(false)
    }
  }

  const historyColumns = [
    {
      key: 'createdAt',
      label: 'Time',
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    { key: 'adminEmail', label: 'Admin', render: (r) => r.adminEmail || '-' },
    { key: 'title', label: 'Title' },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <Badge variant={r.type === 'broadcast' ? 'default' : 'secondary'}>
          {r.type}
        </Badge>
      ),
    },
    { key: 'recipientsCount', label: 'Recipients' },
    {
      key: 'delivery',
      label: 'Delivery',
      render: (r) => (
        <span>
          <span className="text-green-600">{r.successCount}</span>
          {' / '}
          <span className="text-red-600">{r.failureCount}</span>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastSevenDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredDevices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Compose form */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Notification message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'broadcast' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setType('broadcast'); setSelectedUsers([]) }}
              >
                Broadcast (All Users)
              </Button>
              <Button
                type="button"
                variant={type === 'targeted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('targeted')}
              >
                Targeted
              </Button>
            </div>
          </div>

          {type === 'targeted' && (
            <div className="space-y-2">
              <Label>Target Users</Label>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} variant="secondary" className="flex items-center gap-1 py-1">
                      {u.email}
                      <button onClick={() => removeUser(u.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Input
                  placeholder="Search users by email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {(searchResults.length > 0 || searching) && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {searching ? (
                      <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                    ) : (
                      searchResults.map((u) => (
                        <button
                          key={u.id}
                          className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent text-left"
                          onClick={() => addUser(u)}
                        >
                          {u.email}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {sendResult && !sendResult.error && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              Sent to {sendResult.recipientsCount} device(s): {sendResult.successCount} delivered, {sendResult.failureCount} failed
            </div>
          )}
          {sendResult?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {sendResult.error}
            </div>
          )}

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canSend || sending}
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              {type === 'broadcast'
                ? 'This will send a push notification to ALL registered devices.'
                : `This will send a push notification to ${selectedUsers.length} selected user(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Title:</strong> {title}</p>
            <p><strong>Body:</strong> {body}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleSend}>Confirm Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">History</h2>
        <DataTable columns={historyColumns} data={history} loading={historyLoading} emptyMessage="No notifications sent yet" />
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={loadHistory}
        />
      </div>
    </div>
  )
}
