import { createConnection } from 'node:net'
import { randomUUID } from 'node:crypto'
import { findTransport, type RuntimeMetadata } from '../../shared/runtime-bootstrap'
import { isKeepaliveFrame, RuntimeRpcEnvelopeSchema } from './envelope-schema'
import { RuntimeClientError, type RuntimeRpcResponse } from './types'

export async function sendRequest<TResult>(
  metadata: RuntimeMetadata,
  method: string,
  params: unknown,
  timeoutMs: number
): Promise<RuntimeRpcResponse<TResult>> {
  return await new Promise((resolve, reject) => {
    const transport = findTransport(metadata, 'unix', 'named-pipe')
    if (!transport) {
      reject(
        new RuntimeClientError(
          'runtime_unavailable',
          '赛博包工头运行时元数据中没有可用的兼容传输方式。'
        )
      )
      return
    }
    const socket = createConnection(transport.endpoint)
    let buffer = ''
    let settled = false
    const requestId = randomUUID()

    const timeout = setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      socket.destroy()
      reject(new RuntimeClientError('runtime_timeout', '等待赛博包工头运行时响应超时。'))
    }, timeoutMs)

    const finish = (
      result: { ok: true; response: RuntimeRpcResponse<TResult> } | { ok: false; error: Error }
    ): void => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      socket.end()
      if (result.ok === false) {
        reject(result.error)
      } else {
        resolve(result.response)
      }
    }

    socket.setEncoding('utf8')
    socket.once('error', () => {
      finish({
        ok: false,
        error: new RuntimeClientError(
          'runtime_unavailable',
          '无法连接到正在运行的赛博包工头。请重启应用后重试。'
        )
      })
    })
    // Why: a clean peer close (FIN, no 'error') before a terminal frame never
    // settles the promise, so the call would otherwise hang until the full
    // timeout fires. Reject promptly. finish() guards double-settle, so this
    // no-ops on the normal success/error paths that already called socket.end().
    socket.once('close', () => {
      finish({
        ok: false,
        error: new RuntimeClientError(
          'runtime_unavailable',
          '赛博包工头运行时在响应前关闭了连接。请重启应用后重试。'
        )
      })
    })
    socket.on('data', (chunk) => {
      buffer += chunk
      // Why: the server may interleave `{"_keepalive":true}\n` frames with the
      // final success/failure frame to keep both idle timers alive during a
      // long-poll (see design doc §3.1). Read frames in a loop until we see a
      // terminal frame. Each keepalive refreshes the client-side timer so a
      // 10 min wait doesn't trip the 60 s default ceiling.
      let newlineIndex = buffer.indexOf('\n')
      while (newlineIndex !== -1 && !settled) {
        const line = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 1)
        if (line.trim().length === 0) {
          newlineIndex = buffer.indexOf('\n')
          continue
        }

        let raw: unknown
        try {
          raw = JSON.parse(line)
        } catch {
          finish({
            ok: false,
            error: new RuntimeClientError(
              'invalid_runtime_response',
              '赛博包工头运行时返回了无效响应帧。'
            )
          })
          return
        }

        // Fast-path: ignore keepalives without running the full schema.
        // setTimeout().refresh() is stable since Node 10 (Orca ships on
        // Node 20+ via Electron and the standalone CLI targets the same
        // major). See §7 risk #9.
        if (isKeepaliveFrame(raw)) {
          timeout.refresh()
          newlineIndex = buffer.indexOf('\n')
          continue
        }

        // Why: validate the envelope shape (id, ok, result/error, _meta) at
        // the decode boundary so version skew between the CLI and the Orca
        // main runtime surfaces as a single invalid_runtime_response instead
        // of a downstream mis-typed field access. `result` is left as
        // unknown — the TResult generic is the caller's responsibility.
        const parsed = RuntimeRpcEnvelopeSchema.safeParse(raw)
        if (!parsed.success) {
          finish({
            ok: false,
            error: new RuntimeClientError(
              'invalid_runtime_response',
              '赛博包工头运行时返回了无效响应帧。'
            )
          })
          return
        }

        // Narrow out keepalive (already filtered above) so TS can see a
        // Success|Failure shape here.
        const frame = parsed.data
        if ('_keepalive' in frame) {
          timeout.refresh()
          newlineIndex = buffer.indexOf('\n')
          continue
        }

        const response = frame as RuntimeRpcResponse<TResult>
        if (response.id !== requestId) {
          finish({
            ok: false,
            error: new RuntimeClientError(
              'invalid_runtime_response',
              '赛博包工头运行时返回了不匹配的响应 ID。'
            )
          })
          return
        }
        if (response._meta?.runtimeId && response._meta.runtimeId !== metadata.runtimeId) {
          finish({
            ok: false,
            error: new RuntimeClientError(
              'runtime_unavailable',
              '请求处理期间赛博包工头运行时已发生变化，请重试该命令。'
            )
          })
          return
        }
        finish({ ok: true, response })
        return
      }
    })
    socket.on('connect', () => {
      socket.write(
        `${JSON.stringify({
          id: requestId,
          authToken: metadata.authToken,
          method,
          params
        })}\n`
      )
    })
  })
}
