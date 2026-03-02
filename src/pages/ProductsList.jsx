import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import { Search } from 'lucide-react'

export default function ProductsList() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const navigate = useNavigate()

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      if (debouncedSearch.trim()) {
        const res = await adminApi.searchProducts(debouncedSearch)
        setProducts(res.data)
        setPagination({ page: 1, pages: 1, total: res.data.length })
      } else {
        const res = await adminApi.listProducts(page)
        setProducts(res.data)
        setPagination(res.pagination)
      }
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    load(1)
  }, [load])

  const columns = [
    { key: 'productName', label: 'Product Name', render: (r) => r.productName || r.name || '-' },
    { key: 'name', label: 'Internal Name', render: (r) => r.name || '-' },
    {
      key: 'isActive',
      label: 'Active',
      render: (r) => (
        <Badge variant={r.isActive ? 'default' : 'secondary'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'hasSpecs',
      label: 'Specs',
      render: (r) => (
        <Badge variant={r.hasSpecs ? 'default' : 'secondary'}>
          {r.hasSpecs ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'hasManual',
      label: 'Manual',
      render: (r) => (
        <Badge variant={r.hasManual ? 'default' : 'secondary'}>
          {r.hasManual ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(r) => navigate(`/products/${r.id}`)}
        emptyMessage="No products found"
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
