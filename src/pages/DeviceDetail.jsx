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
import { ArrowLeft, Eye, EyeOff, Trash2, ArrowRightLeft, XCircle, Battery, Zap, Thermometer, ShieldAlert } from 'lucide-react'

function SocColor({ soc }) {
  if (soc > 50) return 'text-green-600'
  if (soc > 20) return 'text-amber-600'
  return 'text-red-600'
}

function TempColor(temp) {
  if (temp > 55) return 'text-red-600'
  if (temp > 40) return 'text-amber-600'
  return 'text-green-600'
}

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

  // Telemetry history
  const [telemetryHistory, setTelemetryHistory] = useState([])
  const [historyDays, setHistoryDays] = useState(7)

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

  const loadHistory = async () => {
    try {
      const res = await adminApi.getDeviceTelemetryHistory(deviceId, historyDays)
      setTelemetryHistory(res.data || [])
    } catch (err) {
      console.error('Failed to load telemetry history', err)
    }
  }

  useEffect(() => { load() }, [deviceId])
  useEffect(() => { loadHistory() }, [deviceId, historyDays])

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

  const t = device.lastTelemetry

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Device Detail</h1>
      </div>

      {/* Header info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{device.customName || 'Unnamed Device'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
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
              <p className="text-muted-foreground">Bluetooth MAC</p>
              <p className="font-mono">{device.bluetoothMac || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Firmware</p>
              <p>{device.firmwareVersion || '-'}</p>
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
              <p className="text-muted-foreground">Platform</p>
              <p>{device.owner?.platform || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(device.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Connected</p>
              <p>{device.lastConnected ? new Date(device.lastConnected).toLocaleString() : 'Never'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alert Threshold</p>
              <p>{device.alertLowBattery != null ? `${device.alertLowBattery}%` : 'Not set'}</p>
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

      {/* Telemetry Dashboard */}
      {t && (
        <>
          {/* Protection alerts */}
          {t.activeProtections?.length > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                <ShieldAlert className="h-5 w-5" />
                Active Protection Faults
              </div>
              <div className="flex flex-wrap gap-2">
                {t.activeProtections.map((p, i) => (
                  <Badge key={i} variant="destructive">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">SOC</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${SocColor({ soc: t.soc })}`}>
                  {t.soc != null ? `${t.soc}%` : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Voltage</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.voltage != null ? `${t.voltage}V` : '-'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {t.current != null ? `${t.current}A` : '-'}
                </p>
                {t.current != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.current < 0 ? 'Charging' : t.current > 0 ? 'Discharging' : 'Idle'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Power</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.power != null ? `${t.power}W` : '-'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cycles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.cycleCount != null ? t.cycleCount : '-'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {t.residualCapacity != null && t.nominalCapacity != null
                    ? `${t.residualCapacity} / ${t.nominalCapacity} Ah`
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cell voltages */}
          {t.cellVoltages?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cell Voltages</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const min = Math.min(...t.cellVoltages)
                  const max = Math.max(...t.cellVoltages)
                  const delta = ((max - min) * 1000).toFixed(0)
                  return (
                    <>
                      <div className="mb-3 flex gap-4 text-sm">
                        <span>Min: <strong className="text-red-600">{min.toFixed(3)}V</strong></span>
                        <span>Max: <strong className="text-green-600">{max.toFixed(3)}V</strong></span>
                        <span>Delta: <strong className={parseInt(delta) > 50 ? 'text-red-600' : parseInt(delta) > 20 ? 'text-amber-600' : 'text-green-600'}>{delta}mV</strong></span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {t.cellVoltages.map((v, i) => {
                          let bg = 'bg-muted'
                          if (v === min) bg = 'bg-red-100 border-red-300'
                          else if (v === max) bg = 'bg-green-100 border-green-300'
                          return (
                            <div key={i} className={`rounded-md border p-2 text-center ${bg}`}>
                              <p className="text-xs text-muted-foreground">C{i + 1}</p>
                              <p className="font-mono text-sm font-semibold">{(v * 1000).toFixed(0)}</p>
                              <p className="text-xs text-muted-foreground">mV</p>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Temperatures + MOS status */}
          <div className="grid gap-4 sm:grid-cols-2">
            {t.temperatures?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Thermometer className="h-4 w-4" /> Temperatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {t.temperatures.map((temp, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-muted-foreground">Sensor {i + 1}</p>
                        <p className={`text-2xl font-bold ${TempColor(temp)}`}>{temp}°C</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">MOS Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${t.chargingEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Charge {t.chargingEnabled ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${t.dischargingEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Discharge {t.dischargingEnabled ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
                {t.protectionFlags != null && t.protectionFlags > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Protection flags: 0x{t.protectionFlags.toString(16).toUpperCase().padStart(4, '0')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {device.telemetryUpdatedAt && (
            <p className="text-xs text-muted-foreground">
              Telemetry updated: {new Date(device.telemetryUpdatedAt).toLocaleString()}
            </p>
          )}
        </>
      )}

      {!t && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No telemetry data received yet
          </CardContent>
        </Card>
      )}

      {/* SOC History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">SOC History</CardTitle>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={historyDays === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {telemetryHistory.length > 0 ? (
            <div className="space-y-2">
              {/* Simple text-based SOC timeline — replace with a chart library if desired */}
              <div className="h-48 flex items-end gap-px overflow-hidden rounded-md bg-muted p-1">
                {telemetryHistory
                  .filter((e) => e.soc != null)
                  .slice(-200) // show last 200 data points
                  .map((e, i) => (
                    <div
                      key={i}
                      className="flex-1 min-w-[2px] rounded-t-sm"
                      style={{
                        height: `${e.soc}%`,
                        backgroundColor: e.soc > 50 ? '#16a34a' : e.soc > 20 ? '#d97706' : '#dc2626',
                      }}
                      title={`${e.soc}% — ${new Date(e.recordedAt).toLocaleString()}`}
                    />
                  ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{telemetryHistory.length > 0 ? new Date(telemetryHistory[0].recordedAt).toLocaleDateString() : ''}</span>
                <span>{telemetryHistory.length > 0 ? new Date(telemetryHistory[telemetryHistory.length - 1].recordedAt).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-xs text-muted-foreground">{telemetryHistory.length} readings over {historyDays} days</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">No telemetry history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
