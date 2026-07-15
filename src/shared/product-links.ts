import { PRODUCT_IDENTITY } from './product-identity'

export const PRODUCT_REPOSITORY_SLUG = `${PRODUCT_IDENTITY.repository.owner}/${PRODUCT_IDENTITY.repository.name}`
export const PRODUCT_REPOSITORY_URL = `https://github.com/${PRODUCT_REPOSITORY_SLUG}`
export const PRODUCT_RELEASES_URL = `${PRODUCT_REPOSITORY_URL}/releases`
export const PRODUCT_ISSUES_URL = `${PRODUCT_REPOSITORY_URL}/issues`
export const PRODUCT_NEW_ISSUE_URL = `${PRODUCT_ISSUES_URL}/new`
export const PRODUCT_STARGAZERS_URL = `${PRODUCT_REPOSITORY_URL}/stargazers`
export const PRODUCT_DOCS_URL = `${PRODUCT_REPOSITORY_URL}/tree/${PRODUCT_IDENTITY.repository.defaultBranch}/docs`
export const PRODUCT_CHANGELOG_URL = PRODUCT_RELEASES_URL
export const PRODUCT_PRIVACY_URL = `${PRODUCT_REPOSITORY_URL}/blob/${PRODUCT_IDENTITY.repository.defaultBranch}/docs/PRIVACY.md`
export const PRODUCT_RELEASES_ATOM_URL = `${PRODUCT_RELEASES_URL}.atom`
export const PRODUCT_RELEASE_DOWNLOAD_BASE_URL = `${PRODUCT_RELEASES_URL}/download`
export const PRODUCT_LATEST_RELEASE_DOWNLOAD_URL = `${PRODUCT_RELEASES_URL}/latest/download`

export const UPSTREAM_REPOSITORY_SLUG = `${PRODUCT_IDENTITY.upstreamRepository.owner}/${PRODUCT_IDENTITY.upstreamRepository.name}`
export const UPSTREAM_REPOSITORY_URL = `https://github.com/${UPSTREAM_REPOSITORY_SLUG}`

export function getProductReleaseTagUrl(versionOrTag: string): string {
  const tag = versionOrTag.startsWith('v') ? versionOrTag : `v${versionOrTag}`
  return `${PRODUCT_RELEASES_URL}/tag/${encodeURIComponent(tag)}`
}

export function getProductReleaseDownloadUrl(tag: string): string {
  return `${PRODUCT_RELEASE_DOWNLOAD_BASE_URL}/${encodeURIComponent(tag)}`
}

export function getProductReleaseAssetUrl(tag: string, assetName: string): string {
  return `${getProductReleaseDownloadUrl(tag)}/${encodeURIComponent(assetName)}`
}
