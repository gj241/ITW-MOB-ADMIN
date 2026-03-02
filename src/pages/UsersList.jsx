import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import { Search } from 'lucide-react'

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      if (debouncedSearch.trim()) {
        const res = await adminApi.searchUsers(debouncedSearch)
        setUsers(res.data)
        setPagination({ page: 1, pages: 1, total: res.data.length })
      } else {
        const res = await adminApi.listUsers(page)
        setUsers(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    load(1)
  }, [load])

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
    {
      key: 'verified',
      label: 'Verified',
      render: (r) => (
        <Badge variant={r.verified ? 'default' : 'secondary'}>
          {r.verified ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (r) =>
        r.admin ? <Badge variant="destructive">Admin</Badge> : null,
    },
    { key: 'deviceCount', label: 'Devices' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (r) => (r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : 'Never'),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={(r) => navigate(`/users/${r.id}`)}
        emptyMessage="No users found"
      />

      {!debouncedSearch.trim() && (
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={load}
        />
      )}
    </div>
  )
}
