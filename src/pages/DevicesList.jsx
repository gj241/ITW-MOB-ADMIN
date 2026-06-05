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
  deviceType: '',
  pinSet: '',
  hasOwner: '',
  lastConnectedDays: '',
  dateFrom: '',
  dateTo: '',
}

export default function DevicesList() {
  const [devices, setDevices] = useState([])
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
        const res = await adminApi.searchDevices(debouncedSearch)
        setDevices(res.data)
        setPagination({ page: 1, pages: 1, total: res.data.length })
      } else {
        const res = await adminApi.listDevices(page, 20, filters)
        setDevices(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Failed to load devices', err)
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
    { key: 'customName', label: 'Name', render: (r) => r.customName || 'Unnamed' },
    { key: 'deviceType', label: 'Type', render: (r) => r.deviceType || '-' },
    { key: 'macAddress', label: 'MAC', render: (r) => r.macAddress || '-' },
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
      key: 'soc',
      label: 'SOC',
      render: (r) => r.soc != null ? (
        <span className={r.soc > 50 ? 'text-green-600' : r.soc > 20 ? 'text-amber-600' : 'text-red-600'}>
          {r.soc}%
        </span>
      ) : '-',
    },
    { key: 'ownerEmail', label: 'Owner', render: (r) => r.ownerEmail || '-' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'lastConnected',
      label: 'Last Connected',
      render: (r) => (r.lastConnected ? new Date(r.lastConnected).toLocaleDateString() : 'Never'),
    },
  ]

  const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Devices</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
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
            <label className="mb-1 block text-xs text-muted-foreground">Device Type</label>
            <Input
              placeholder="e.g. battery"
              className="h-9 w-36"
              value={filters.deviceType}
              onChange={(e) => updateFilter('deviceType', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">PIN Set</label>
            <select className={selectClass} value={filters.pinSet} onChange={(e) => updateFilter('pinSet', e.target.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Has Owner</label>
            <select className={selectClass} value={filters.hasOwner} onChange={(e) => updateFilter('hasOwner', e.target.value)}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">Orphaned</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Active Within</label>
            <select className={selectClass} value={filters.lastConnectedDays} onChange={(e) => updateFilter('lastConnectedDays', e.target.value)}>
              <option value="">All time</option>
              <option value="1">Last 24h</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
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
        data={devices}
        loading={loading}
        onRowClick={(r) => navigate(`/devices/${r.id}`)}
        emptyMessage="No devices found"
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
