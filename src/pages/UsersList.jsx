import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import { Search, X } from 'lucide-react'

const EMPTY_FILTERS = {
  verified: '',
  admin: '',
  hasDevices: '',
  platform: '',
  dateFrom: '',
  dateTo: '',
}

export default function UsersList() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      if (debouncedSearch.trim()) {
        const res = await adminApi.searchUsers(debouncedSearch)
        setUsers(res.data)
        setPagination({ page: 1, pages: 1, total: res.data.length })
      } else {
        const res = await adminApi.listUsers(page, 20, filters)
        setUsers(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters])

  useEffect(() => {
    load(1)
  }, [load])

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
  }

  const columns = [
    { key: 'email', label: 'Email' },
    {
      key: 'displayName',
      label: 'Name',
      render: (r) => r.displayName || <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'authProvider',
      label: 'Auth',
      render: (r) => {
        const p = r.authProvider || 'email'
        const variant = p === 'apple' ? 'secondary' : p === 'google' ? 'outline' : 'default'
        return <Badge variant={variant}>{p}</Badge>
      },
    },
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
    {
      key: 'platform',
      label: 'Platform',
      render: (r) => r.platform || '-',
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

  const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters{hasActiveFilters ? ' *' : ''}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-md border p-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Verified</label>
            <select className={selectClass} value={filters.verified} onChange={(e) => updateFilter('verified', e.target.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Admin</label>
            <select className={selectClass} value={filters.admin} onChange={(e) => updateFilter('admin', e.target.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Has Devices</label>
            <select className={selectClass} value={filters.hasDevices} onChange={(e) => updateFilter('hasDevices', e.target.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Platform</label>
            <select className={selectClass} value={filters.platform} onChange={(e) => updateFilter('platform', e.target.value)}>
              <option value="">All</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Registered From</label>
            <input type="date" className={selectClass} value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Registered To</label>
            <input type="date" className={selectClass} value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
          </div>
        </div>
      )}

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
