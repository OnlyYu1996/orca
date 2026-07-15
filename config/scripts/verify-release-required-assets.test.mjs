import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  extractManifestAssetNames,
  getRequiredReleaseAssetNames,
  verifyRequiredReleaseAssets
} from './verify-release-required-assets.mjs'

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(async () => body),
    text: vi.fn(async () => (typeof body === 'string' ? body : JSON.stringify(body)))
  }
}

function releaseWithAssets(tag, assetNames) {
  return {
    tag_name: tag,
    draft: true,
    prerelease: false,
    assets: assetNames.map((name, index) => ({
      id: index + 1,
      name,
      state: 'uploaded',
      size: 123
    }))
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getRequiredReleaseAssetNames', () => {
  it('includes both mac updater ZIP names for the tag version', () => {
    expect(getRequiredReleaseAssetNames('v1.4.27')).toEqual(
      expect.arrayContaining([
        'sbbgt-1.4.27-x64.zip',
        'sbbgt-1.4.27-x64.zip.blockmap',
        'sbbgt-1.4.27-arm64.zip',
        'sbbgt-1.4.27-arm64.zip.blockmap'
      ])
    )
  })

  it('includes x64 and arm64 Linux assets', () => {
    expect(getRequiredReleaseAssetNames('v1.4.27')).toEqual(
      expect.arrayContaining([
        'latest-linux-arm64.yml',
        'sbbgt-linux.AppImage',
        'sbbgt-linux-arm64.AppImage',
        'sbbgt_1.4.27_amd64.deb',
        'sbbgt_1.4.27_arm64.deb',
        'sbbgt-1.4.27.x86_64.rpm',
        'sbbgt-1.4.27.aarch64.rpm'
      ])
    )
  })
})

describe('extractManifestAssetNames', () => {
  it('extracts relative and absolute manifest asset names', () => {
    expect(
      extractManifestAssetNames(
        [
          'files:',
          '  - url: sbbgt-1.4.27-arm64.zip',
          '  - url: https://example.com/downloads/sbbgt-windows-setup.exe',
          'path: sbbgt-linux.AppImage'
        ].join('\n')
      )
    ).toEqual(['sbbgt-1.4.27-arm64.zip', 'sbbgt-windows-setup.exe', 'sbbgt-linux.AppImage'])
  })
})

describe('verifyRequiredReleaseAssets', () => {
  it('fails when a manifest-referenced asset has not been uploaded', async () => {
    const tag = 'v1.4.27'
    const required = getRequiredReleaseAssetNames(tag)
    const assets = required.filter((name) => name !== 'sbbgt-1.4.27-arm64.zip')
    const release = releaseWithAssets(tag, assets)
    const latestMacAsset = release.assets.find((asset) => asset.name === 'latest-mac.yml')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([release]))
      .mockResolvedValueOnce(
        jsonResponse(
          [
            'version: 1.4.27',
            'files:',
            '  - url: sbbgt-1.4.27-arm64.zip',
            '    sha512: test',
            'path: sbbgt-1.4.27-arm64.zip'
          ].join('\n')
        )
      )
      .mockResolvedValue(jsonResponse('version: 1.4.27\n'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      verifyRequiredReleaseAssets({ repo: 'stablyai/orca', tag, token: 'token' })
    ).rejects.toThrow('Missing: sbbgt-1.4.27-arm64.zip')
    expect(latestMacAsset).toBeTruthy()
  })

  it('checks assets referenced by the Linux arm64 updater manifest', async () => {
    const tag = 'v1.4.27'
    const required = getRequiredReleaseAssetNames(tag)
    const release = releaseWithAssets(tag, required)
    const arm64Manifest = release.assets.find((asset) => asset.name === 'latest-linux-arm64.yml')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([release]))
      .mockResolvedValueOnce(jsonResponse('version: 1.4.27\n'))
      .mockResolvedValueOnce(
        jsonResponse(
          [
            'version: 1.4.27',
            'files:',
            '  - url: sbbgt-linux-arm64.AppImage.blockmap',
            'path: sbbgt-linux-arm64.AppImage'
          ].join('\n')
        )
      )
      .mockResolvedValue(jsonResponse('version: 1.4.27\n'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      verifyRequiredReleaseAssets({ repo: 'stablyai/orca', tag, token: 'token' })
    ).rejects.toThrow('Missing: sbbgt-linux-arm64.AppImage.blockmap')
    expect(arm64Manifest).toBeTruthy()
  })
})
