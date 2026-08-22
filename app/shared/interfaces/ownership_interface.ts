namespace IOwnership {
  export interface OwnershipCheck {
    userId: number
    resource: string
    resourceId: number
    action: string
    context: string
  }

  export interface OwnershipRule {
    table: string
    ownerField: string
    transferable?: boolean
    customCheck?: (userId: number, resourceId: number) => Promise<boolean>
  }

  export enum OwnershipLevel {
    OWNER = 'owner',
  }

  export interface OwnershipConfig {
    [resource: string]: OwnershipRule
  }
}

export default IOwnership
