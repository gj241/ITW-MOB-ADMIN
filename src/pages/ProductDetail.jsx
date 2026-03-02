import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
import { ArrowLeft, Plus, Trash2, Upload, FileText, X } from 'lucide-react'

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Specs editing state
  const [specsOpen, setSpecsOpen] = useState(false)
  const [editSpecs, setEditSpecs] = useState([])

  // Manual state
  const [deleteManualOpen, setDeleteManualOpen] = useState(false)
  const fileInputRef = useRef(null)

  const load = async () => {
    try {
      const res = await adminApi.getProduct(productId)
      setProduct(res.data)
    } catch (err) {
      console.error('Failed to load product', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [productId])

  // --- Specs editing helpers ---
  const openSpecsEditor = () => {
    setEditSpecs(
      (product.specifications || []).map((s) => ({
        section: s.section,
        rows: s.rows.map((r) => ({ label: r.label, value: r.value })),
      }))
    )
    setSpecsOpen(true)
  }

  const addSection = () => {
    setEditSpecs([...editSpecs, { section: '', rows: [{ label: '', value: '' }] }])
  }

  const removeSection = (si) => {
    setEditSpecs(editSpecs.filter((_, i) => i !== si))
  }

  const updateSectionName = (si, name) => {
    const copy = [...editSpecs]
    copy[si] = { ...copy[si], section: name }
    setEditSpecs(copy)
  }

  const addRow = (si) => {
    const copy = [...editSpecs]
    copy[si] = { ...copy[si], rows: [...copy[si].rows, { label: '', value: '' }] }
    setEditSpecs(copy)
  }

  const removeRow = (si, ri) => {
    const copy = [...editSpecs]
    copy[si] = { ...copy[si], rows: copy[si].rows.filter((_, i) => i !== ri) }
    setEditSpecs(copy)
  }

  const updateRow = (si, ri, field, val) => {
    const copy = [...editSpecs]
    const rows = [...copy[si].rows]
    rows[ri] = { ...rows[ri], [field]: val }
    copy[si] = { ...copy[si], rows }
    setEditSpecs(copy)
  }

  const saveSpecs = async () => {
    // Filter out empty sections/rows
    const cleaned = editSpecs
      .filter((s) => s.section.trim())
      .map((s) => ({
        section: s.section.trim(),
        rows: s.rows.filter((r) => r.label.trim() && r.value.trim()),
      }))
      .filter((s) => s.rows.length > 0)

    setActionLoading(true)
    try {
      await adminApi.updateProductSpecs(productId, cleaned)
      setSpecsOpen(false)
      await load()
    } catch (err) {
      console.error('Failed to save specs', err)
    } finally {
      setActionLoading(false)
    }
  }

  // --- Manual handlers ---
  const handleManualUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setActionLoading(true)
    try {
      await adminApi.uploadProductManual(productId, file)
      await load()
    } catch (err) {
      console.error('Failed to upload manual', err)
    } finally {
      setActionLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteManual = async () => {
    setActionLoading(true)
    try {
      await adminApi.deleteProductManual(productId)
      setDeleteManualOpen(false)
      await load()
    } catch (err) {
      console.error('Failed to delete manual', err)
    } finally {
      setActionLoading(false)
    }
  }

  const manualFullUrl = product?.manualUrl
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${product.manualUrl}`
    : null

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!product) {
    return <p className="text-muted-foreground">Product not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Product Detail</h1>
      </div>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{product.productName || product.name || 'Unknown Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">ID</p>
              <p className="font-mono text-xs break-all">{product.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Supplier ID</p>
              <p className="font-mono text-xs">{product.supplierId || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">BLE UUID</p>
              <p className="font-mono text-xs">{product.bleUuid || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Internal Name</p>
              <p>{product.name || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Brand ID</p>
              <p>{product.brandId || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Specifications</CardTitle>
          <Button variant="outline" size="sm" onClick={openSpecsEditor}>
            Edit Specifications
          </Button>
        </CardHeader>
        <CardContent>
          {product.specifications && product.specifications.length > 0 ? (
            <div className="space-y-4">
              {product.specifications.map((section, si) => (
                <div key={si}>
                  <h3 className="font-medium text-sm mb-2">{section.section}</h3>
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <tbody>
                        {section.rows.map((row, ri) => (
                          <tr key={ri} className={ri > 0 ? 'border-t' : ''}>
                            <td className="px-3 py-2 text-muted-foreground w-1/3">{row.label}</td>
                            <td className="px-3 py-2">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specifications added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Specs Editor Dialog */}
      <Dialog open={specsOpen} onOpenChange={setSpecsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Specifications</DialogTitle>
            <DialogDescription>
              Add sections and key-value rows for product specifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {editSpecs.map((section, si) => (
              <div key={si} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={section.section}
                    onChange={(e) => updateSectionName(si, e.target.value)}
                    placeholder="Section name (e.g. General)"
                    className="font-medium"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeSection(si)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {section.rows.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-2 pl-2">
                    <Input
                      value={row.label}
                      onChange={(e) => updateRow(si, ri, 'label', e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={row.value}
                      onChange={(e) => updateRow(si, ri, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeRow(si, ri)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addRow(si)} className="ml-2">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Row
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addSection}>
              <Plus className="mr-1 h-4 w-4" />
              Add Section
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSpecs} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Specifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Manual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">User Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {product.manualUrl ? (
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <a
                href={manualFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {product.manualFilename}
              </a>
              <Dialog open={deleteManualOpen} onOpenChange={setDeleteManualOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Manual</DialogTitle>
                    <DialogDescription>
                      This will permanently delete the uploaded PDF manual.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteManualOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteManual} disabled={actionLoading}>
                      {actionLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No manual uploaded.</p>
          )}
          <div>
            <Label htmlFor="manual-upload" className="text-sm">
              {product.manualUrl ? 'Replace Manual' : 'Upload Manual'}
            </Label>
            <Input
              id="manual-upload"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleManualUpload}
              disabled={actionLoading}
              className="mt-1 max-w-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">PDF only, max 50MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
