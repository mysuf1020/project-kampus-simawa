import { ResourceAction } from '@/lib/models/authentication'

export class AppRole {
  roleId: string
  roleName: string
  permissions: AppResource[]

  constructor(roleId: string, roleName: string, permissions: AppResource[]) {
    this.roleId = roleId
    this.roleName = roleName
    this.permissions = permissions
  }
}

type AppResourceLookup = (name: string) => AppResource | undefined

export class AppResource {
  name: string
  actions: ResourceAction[]

  constructor(name: string, actions: ResourceAction[]) {
    this.name = name
    this.actions = actions
  }

  public canCreate = (): boolean =>
    this.actions.find((action) => action === 'create') !== undefined

  public canRead = (): boolean =>
    this.actions.find((action) => action === 'read') !== undefined

  public canUpdate = (): boolean =>
    this.actions.find((action) => action === 'update') !== undefined

  public canDelete = (): boolean =>
    this.actions.find((action) => action === 'delete') !== undefined

  public can = (actionName: string): boolean =>
    this.actions.find((action) => action === actionName) !== undefined

  public canReview = (): boolean =>
    this.actions.find((action) => action === 'review') !== undefined
}

interface RBACState {
  haveRole: (roleName: string) => boolean
  haveResource: (resourceName: string) => boolean
  roles: AppRole[] | null
  resources: AppResource[] | null
  resource: AppResourceLookup
  role: (name: string) => AppRole | undefined
  // accept multiple resource name as a string, every resource name provided in param has 'create' provided
  canCreate: (resourceNames: string[]) => boolean
  // accept multiple resource name as a string, every resource name provided in param has 'read' provided
  canRead: (resourceNames: string[]) => boolean
  // accept multiple resource name as a string, every resource name provided in param has 'update' provided
  canUpdate: (resourceNames: string[]) => boolean
  // accept multiple resource name as a string, every resource name provided in param has 'delete' provided
  canDelete: (resourceNames: string[]) => boolean
  // accept multiple resource name as a string, every resource name provided in param has 'review' provided
  canReview: (resourceNames: string[]) => boolean
}

type RoutingRuleHandler = ((lookupFn: AppResourceLookup) => boolean) | string[]
type RoutingRules = Map<string | RegExp, RoutingRuleHandler>

export type { RBACState, RoutingRules, RoutingRuleHandler, AppResourceLookup }
