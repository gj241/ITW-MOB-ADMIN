import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'
import { Badge } from '../components/ui/badge'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'

const actionColors = {
  VIEW_PIN: 'secondary',
  CLEAR_PIN: 'default',
  TRANSFER: 'default',
  DELETE: 'destructive',
  DELETE_USER: 'destructive',
  UPDATE_USER: 'default',
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.getAuditLog(page)
      setLogs(res.data)
      setPagination(res.pagination)
    } catch (err) {
      console.error('Failed to load audit log', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const columns = [
    {
      key: 'createdAt',
      label: 'Time',
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    { key: 'adminEmail', label: 'Admin', render: (r) => r.adminEmail || '-' },
    {
      key: 'action',
      label: 'Action',
      render: (r) => (
        <Badge variant={actionColors[r.action] || 'secondary'}>
          {r.action}
        </Badge>
      ),
    },
    {
      key: 'deviceId',
      label: 'Device ID',
      render: (r) => r.deviceId ? (
        <span className="font-mono text-xs">{r.deviceId.substring(0, 8)}...</span>
      ) : '-',
    },
    {
      key: 'targetUser',
      label: 'Target User',
      render: (r) => r.targetUser ? (
        <span className="font-mono text-xs">{r.targetUser.substring(0, 8)}...</span>
      ) : '-',
    },
    { key: 'notes', label: 'Notes', render: (r) => r.notes || '-' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit entries" />
      <Pagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        onPageChange={load}
      />
    </div>
  )
}
