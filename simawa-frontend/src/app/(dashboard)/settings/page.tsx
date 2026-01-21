'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, Database, HardDrive, Server } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { fetchHealth } from '@/lib/apis/health'
import { RoleGuideCard } from './_components/role-guide-card'
import { RoleManagementCard, UserCreateCard } from './_components/user-management-card'
import { ChangePasswordCard } from './_components/change-password-card'

export default function SettingsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/settings', children: 'Pengaturan' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Pengaturan Sistem
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola preferensi, manajemen pengguna, dan pantau status sistem.
            </p>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">Pengguna</TabsTrigger>
              <TabsTrigger value="roles">Panduan Role</TabsTrigger>
              <TabsTrigger value="system">Status Sistem</TabsTrigger>
            </TabsList>

            <TabsContent
              value="users"
              className="space-y-6 animate-in fade-in-50 duration-300"
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <UserCreateCard />
                <ChangePasswordCard />
              </div>
              <div className="grid gap-6">
                <RoleManagementCard />
              </div>
            </TabsContent>

            <TabsContent value="roles" className="animate-in fade-in-50 duration-300">
              <RoleGuideCard />
            </TabsContent>

            <TabsContent
              value="system"
              className="space-y-6 animate-in fade-in-50 duration-300"
            >
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-brand-600" />
                    Status Sistem
                  </CardTitle>
                  <CardDescription>Kondisi layanan infrastruktur SIMAWA.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading && (
                    <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
                      Memeriksa kesehatan sistem...
                    </div>
                  )}
                  {isError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                      Gagal memuat status sistem. Pastikan backend berjalan.
                    </div>
                  )}
                  {!isLoading && !isError && data && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                        <span className="text-sm font-medium text-neutral-700">
                          System Status
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          {data.status}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <ServiceStatus
                          label="Database"
                          status={data.db_ok}
                          icon={Database}
                        />
                        <ServiceStatus
                          label="Redis Cache"
                          status={data.redis_ok}
                          icon={Server}
                        />
                        <ServiceStatus
                          label="Object Storage"
                          status={data.minio_ok}
                          icon={HardDrive}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 text-center">
                        Uptime: {Math.floor(data.uptime_seconds)} seconds
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}

function ServiceStatus({
  label,
  status,
  icon: Icon,
}: {
  label: string
  status: boolean
  icon: any
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-all ${
        status
          ? 'border-green-100 bg-green-50/50 text-green-700'
          : 'border-red-100 bg-red-50/50 text-red-700'
      }`}
    >
      <div className={`rounded-full p-2 ${status ? 'bg-green-100' : 'bg-red-100'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] font-medium opacity-80">
          {status ? 'Operational' : 'Down'}
        </p>
      </div>
    </div>
  )
}
