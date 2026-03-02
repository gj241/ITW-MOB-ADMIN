import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import { Search } from 'lucide-react'

export default function DevicesList() {
  const [devices, setDevices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      if (debouncedSearch.trim()) {
        const res = await adminApi.searchDevices(debouncedSearch)
        setDevices(res.data)
        setPagination({ page: 1, pages: 1, total: res.data.length })
      } else {
        const res = await adminApi.listDevices(page)
        setDevices(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Failed to load devices', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    load(1)
  }, [load])

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
    { key: 'ownerEmail', label: 'Owner', render: (r) => r.ownerEmail || '-' },
    {
      key: 'lastConnected',
      label: 'Last Connected',
      render: (r) => (r.lastConnected ? new Date(r.lastConnected).toLocaleDateString() : 'Never'),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Devices</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
