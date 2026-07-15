import identity from './product-identity.json'

export type ProductIdentity = typeof identity

export const PRODUCT_IDENTITY: Readonly<ProductIdentity> = Object.freeze(identity)
export const PRODUCT_DISPLAY_NAME = PRODUCT_IDENTITY.displayName
export const PRODUCT_ENGLISH_NAME = PRODUCT_IDENTITY.englishName
export const PRODUCT_MACHINE_NAME = PRODUCT_IDENTITY.machineName
export const PRODUCT_DESKTOP_APP_ID = PRODUCT_IDENTITY.desktopAppId
export const PRODUCT_DESKTOP_DEV_APP_ID = PRODUCT_IDENTITY.desktopDevAppId
export const PRODUCT_MOBILE_APP_ID = PRODUCT_IDENTITY.mobileAppId
export const PRODUCT_CLI_COMMAND = PRODUCT_IDENTITY.cliCommand
export const PRODUCT_DEV_CLI_COMMAND = PRODUCT_IDENTITY.devCliCommand
export const PRODUCT_URL_SCHEME = PRODUCT_IDENTITY.urlScheme
export const PRODUCT_PROJECT_CONFIG_FILE = PRODUCT_IDENTITY.projectConfigFile
export const PRODUCT_PRIVATE_DIRECTORY = PRODUCT_IDENTITY.privateDirectory

export const LEGACY_PRODUCT_IDENTITY = PRODUCT_IDENTITY.legacy
