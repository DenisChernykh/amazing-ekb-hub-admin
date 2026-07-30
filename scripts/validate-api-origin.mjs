const isApiOrigin = (value) => {
  if (value === '/') {
    return true
  }

  if (typeof value !== 'string' || value === '' || value !== value.trim()) {
    return false
  }

  let url

  try {
    url = new URL(value)
  } catch {
    return false
  }

  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.username === '' &&
    url.password === '' &&
    url.pathname === '/' &&
    url.search === '' &&
    url.hash === ''
  )
}

if (!isApiOrigin(process.argv[2])) {
  process.stderr.write(
    'VITE_API_BASE_URL must be / or an absolute HTTP(S) origin without credentials, path, query, or hash.\n',
  )
  process.exitCode = 1
}
