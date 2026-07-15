import { describe, expect, it } from 'vitest'
import {
  PRODUCT_ISSUES_URL,
  PRODUCT_RELEASES_ATOM_URL,
  PRODUCT_REPOSITORY_SLUG,
  PRODUCT_REPOSITORY_URL,
  UPSTREAM_REPOSITORY_URL,
  getProductReleaseAssetUrl,
  getProductReleaseTagUrl
} from './product-links'

describe('product links', () => {
  it('所有产品链接指向当前 Fork', () => {
    expect(PRODUCT_REPOSITORY_SLUG).toBe('OnlyYu1996/orca')
    expect(PRODUCT_REPOSITORY_URL).toBe('https://github.com/OnlyYu1996/orca')
    expect(PRODUCT_ISSUES_URL).toBe('https://github.com/OnlyYu1996/orca/issues')
    expect(PRODUCT_RELEASES_ATOM_URL).toBe('https://github.com/OnlyYu1996/orca/releases.atom')
  })

  it('生成版本和发布资产链接', () => {
    expect(getProductReleaseTagUrl('1.2.3')).toBe(
      'https://github.com/OnlyYu1996/orca/releases/tag/v1.2.3'
    )
    expect(getProductReleaseAssetUrl('mobile-android-v1', 'app release.apk')).toBe(
      'https://github.com/OnlyYu1996/orca/releases/download/mobile-android-v1/app%20release.apk'
    )
  })

  it('官方上游只保留为源码同步地址', () => {
    expect(UPSTREAM_REPOSITORY_URL).toBe('https://github.com/stablyai/orca')
  })
})
