import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
import { ArrowLeft, Eye, EyeOff, Trash2, ArrowRightLeft, XCircle } from 'lucide-react'

export default function DeviceDetail() {
  const { deviceId } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // PIN state
  const [pinVisible, setPinVisible] = useState(false)
  const [pinValue, setPinValue] = useState(null)
  const [pinLegacy, setPinLegacy] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  // Auto-clear PIN after 30 seconds
  const pinTimer = useRef(null)
  useEffect(() => {
    if (pinVisible && pinValue) {
      pinTimer.current = setTimeout(() => {
        setPinVisible(false)
        setPinValue(null)
      }, 30000)
    }
    return () => { if (pinTimer.current) clearTimeout(pinTimer.current) }
  }, [pinVisible, pinValue])

  // Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [newOwnerId, setNewOwnerId] = useState('')

  const load = async () => {
    try {
      const res = await adminApi.getDevice(deviceId)
      setDevice(res.data)
    } catch (err) {
      console.error('Failed to load device', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [deviceId])

  const revealPin = async () => {
    if (pinVisible) {
      setPinVisible(false)
      setPinValue(null)
      return
    }
    setPinLoading(true)
    try {
      const res = await adminApi.getDevicePin(deviceId)
      setPinValue(res.data.pin)
      setPinLegacy(res.data.legacy || false)
      setPinVisible(true)
    } catch (err) {
      console.error('Failed to get PIN', err)
    } finally {
      setPinLoading(false)
    }
  }

  const handleClearPin = async () => {
    setActionLoading(true)
    try {
      await adminApi.clearPin(deviceId)
      setPinVisible(false)
      setPinValue(null)
      await load()
    } catch (err) {
      console.error('Failed to clear PIN', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!newOwnerId.trim()) return
    setActionLoading(true)
    try {
      await adminApi.transferDevice(deviceId, newOwnerId.trim())
      setTransferOpen(false)
      setNewOwnerId('')
      await load()
    } catch (err) {
      console.error('Failed to transfer device', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await adminApi.deleteDevice(deviceId)
      navigate('/devices')
    } catch (err) {
      console.error('Failed to delete device', err)
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!device) {
    return <p className="text-muted-foreground">Device not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Device Detail</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{device.customName || 'Unnamed Device'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">ID</p>
              <p className="font-mono text-xs break-all">{device.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p>{device.deviceType || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">MAC Address</p>
              <p className="font-mono">{device.macAddress || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Owner</p>
              {device.owner ? (
                <Link
                  to={`/users/${device.owner.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {device.owner.email}
                </Link>
              ) : (
                <p>-</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(device.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Connected</p>
              <p>{device.lastConnected ? new Date(device.lastConnected).toLocaleString() : 'Never'}</p>
            </div>
          </div>

          {/* PIN section */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">PIN</p>
            <div className="flex items-center gap-3">
              <Badge variant={device.pinSet ? 'default' : 'secondary'}>
                {device.pinSet ? 'Set' : 'Not Set'}
              </Badge>
              {device.pinSet && (
                <>
                  <Button variant="outline" size="sm" onClick={revealPin} disabled={pinLoading}>
                    {pinVisible ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                    {pinLoading ? 'Loading...' : pinVisible ? 'Hide' : 'Reveal'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearPin} disabled={actionLoading}>
                    <XCircle className="mr-1 h-4 w-4" />
                    Clear PIN
                  </Button>
                </>
              )}
            </div>
            {pinVisible && (
              <div className="mt-2 rounded-md bg-muted p-2 font-mono text-lg">
                {pinLegacy ? (
                  <span className="text-sm text-muted-foreground">Legacy hash - cannot decrypt</span>
                ) : pinValue ? (
                  pinValue
                ) : (
                  <span className="text-sm text-muted-foreground">Unable to decrypt</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowRightLeft className="mr-1 h-4 w-4" />
                  Transfer Ownership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Device</DialogTitle>
                  <DialogDescription>
                    Enter the UUID of the new owner. The device PIN will be cleared on transfer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="newOwner">New Owner ID (UUID)</Label>
                  <Input
                    id="newOwner"
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTransferOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTransfer} disabled={actionLoading || !newOwnerId.trim()}>
                    {actionLoading ? 'Transferring...' : 'Transfer'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Device</DialogTitle>
                  <DialogDescription>
                    This will permanently delete this device. This action cannot be undone.
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
    </div>
  )
}
