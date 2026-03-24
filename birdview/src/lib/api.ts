export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: 'Request failed' }))
    throw new Error(errorBody.message ?? 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
