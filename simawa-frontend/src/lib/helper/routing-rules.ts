import type {
  RoutingRules,
  AppResourceLookup,
  RoutingRuleHandler,
} from '../providers/rbac-providers'
export const hasAdministrator = (resource: AppResourceLookup) =>
  resource('user') !== undefined

export const mustHaveOnboarding = (resource: AppResourceLookup) => {
  return resource('onboarding') !== undefined
}
export const hasMerchant = (resource: AppResourceLookup) => {
  return resource('merchant') !== undefined
}

export const mustHaveChecker = (resource: AppResourceLookup) => {
  const onboardingResource = resource('onboarding')

  if (!onboardingResource) {
    return false
  }

  return onboardingResource.can('approve')
}

export const mustHaveMaker = (resource: AppResourceLookup) => {
  const onboardingResource = resource('onboarding')

  if (!onboardingResource) {
    return false
  }

  return onboardingResource.can('review')
}

export const hasManualRegistration = (resource: AppResourceLookup) =>
  resource('manual-registration') !== undefined

export const mustBeManualMaker = (resource: AppResourceLookup) => {
  const manualRegisterer = resource('manual-registration')

  if (!manualRegisterer) {
    return false
  }

  return manualRegisterer.canCreate()
}

export const hasTransaction = (resource: AppResourceLookup) =>
  resource('transaction') !== undefined

export const hasSettlement = (resource: AppResourceLookup) =>
  resource('settlement') !== undefined

export const hasSettlementMaker = (resource: AppResourceLookup) => {
  const settlementResource = resource('settlement')

  if (!settlementResource) {
    return false
  }

  return settlementResource.canUpdate()
}

export const hasSettlementManager = (resource: AppResourceLookup) => {
  const settlementResource = resource('settlement')

  if (!settlementResource) {
    return false
  }

  return settlementResource.can('review')
}

export const hasReconciliation = (resource: AppResourceLookup) =>
  resource('reconciliation') !== undefined

export const mustBeReconManager = (resource: AppResourceLookup) => {
  const reconResource = resource('reconciliation')

  if (!reconResource) {
    return false
  }

  return reconResource.canUpdate()
}

export const hasPTEN = (resource: AppResourceLookup) => resource('pten') !== undefined

export const hasBankPartners = (resource: AppResourceLookup) =>
  resource('bank-partners') !== undefined

const routingRules = (): RoutingRules => {
  const rules: RoutingRules = new Map<string | RegExp, RoutingRuleHandler>()

  // KYC & Onboarding Routing Rules
  rules.set(
    /^\/merchant-onboarding\/[0-9a-fA-F-]+\/review$/,
    (resource) => hasAdministrator(resource) || mustHaveMaker(resource),
  )
  rules.set(
    /^\/merchant-onboarding\/[0-9a-fA-F-]+\/approval$/,
    (resource) => hasAdministrator(resource) || mustHaveChecker(resource),
  )

  rules.set(
    /^\/merchant-onboarding([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || mustHaveOnboarding(resource),
  )

  // Manual Onboarding Routing Rules
  rules.set(
    '/manual-onboarding/register',
    (resource) => hasAdministrator(resource) || mustBeManualMaker(resource),
  )
  rules.set(
    /^\/manual-onboarding(\/[0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasManualRegistration(resource),
  )

  rules.set('/manual-onboarding', (resource) => hasManualRegistration(resource))

  // PTEN Submission Routing Rules
  rules.set(
    /^\/pten-registration([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasPTEN(resource),
  )

  // Merchant Routing Rules
  rules.set(
    /^\/stores([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasMerchant(resource),
  )
  rules.set(
    /^\/entities([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasMerchant(resource),
  )
  rules.set(
    /^\/brands([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasMerchant(resource),
  )

  // Payment Acceptance Routing Rules
  rules.set(
    /^\/payment-acceptance([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasTransaction(resource),
  )

  // Batch Settlement Routing Rules
  rules.set(
    /^\/batch-settlement\/([0-9a-fA-F-])+\/update-status$/,
    (resource) => hasAdministrator(resource) || hasSettlementMaker(resource),
  )

  rules.set(
    /^\/batch-settlement\/([0-9a-fA-F-])+\/review$/,
    (resource) => hasAdministrator(resource) || hasSettlementManager(resource),
  )

  rules.set(
    /^\/batch-settlement\/([0-9a-fA-F-])+\/remove-entity$/,
    (resource) => hasAdministrator(resource) || hasSettlement(resource),
  )

  rules.set(
    /^\/batch-settlement([\\/0-9a-fA-F-])*$/,
    (resource) => hasAdministrator(resource) || hasSettlement(resource),
  )

  // Reconcile / Status Transaction Handling Routing Rules
  rules.set(
    '/status-transaction-handling/update-or-add',
    (resource) => hasAdministrator(resource) || mustBeReconManager(resource),
  )

  rules.set(
    /^\/status-transaction-handling([\\/0-9a-fA-F-])*/,
    (resource) => hasAdministrator(resource) || hasReconciliation(resource),
  )

  // Bank Partners Routing Rules
  rules.set(
    '/bank-partners',
    (resource) => hasAdministrator(resource) || hasBankPartners(resource),
  )

  return rules
}

export { routingRules, type RoutingRules }
