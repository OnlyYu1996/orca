#!/usr/bin/env node

process.env.SBBGT_LEGACY_CLI = 'orca-dev'
await import('./sbbgt-dev.mjs')
