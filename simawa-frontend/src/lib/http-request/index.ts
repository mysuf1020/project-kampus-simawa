import { getAuthToken } from './get-auth-token'

/**
 * An extended fetch wrapper for Next.js applications that never throws.
 *
 * This helper function enhances the native `fetch` API with features tailored for modern web applications,
 * especially for use in Next.js Server Actions where throwing errors can crash the application.
 *
 * 1.  **Safe Return Tuple**: Instead of throwing, it always returns a tuple `[data, error]`.
 * 2.  **Conditional Authentication**: If `useAuth: true` is passed, it gets a token from Auth.js and adds an `x-authorization` header.
 * 3.  **Automatic JSON Parsing**: It automatically parses the JSON response.
 * 4.  **Detailed Errors**: On an HTTP error, the returned error is an `HttpError` instance.
 * 5.  **Type Safety**: It's generic, allowing you to specify the expected response type.
 * 6.  **Body Serialization**: It automatically stringifies a `body` object to JSON.
 *
 * @template T The expected type of the JSON response data.
 * @param url The URL to fetch.
 * @param options Optional `FetchHelperOptions` options, including `useAuth`.
 * @returns A promise that resolves to a tuple: `[T | null, HttpError | Error | null]`.
 * @example
 * // Example 1: Fetching public data (no authentication)
 * async function getPublicPosts() {
 * const [posts, error] = await fetchHelper<Post[]>('https://api.example.com/posts');
 * if (error) {
 * console.error('Could not fetch posts:', error);
 * return;
 * }
 * // Do something with posts
 * }
 *
 * // Example 2: Fetching protected data using authentication
 * async function getUserProfile() {
 * const [profile, error] = await fetchHelper<UserProfile>('/api/user/profile', { useAuth: true });
 * if (error) {
 * // Handle authentication or network error
 * return;
 * }
 * // Do something with user profile
 * }
 * * // Example 3: Sending data with a POST request
 * async function createPost(title: string, content: string) {
 * const [newPost, error] = await fetchHelper<Post>('/api/posts', {
 * method: 'POST',
 * body: { title, content },
 * useAuth: true
 * });
 * if (error) {
 * // Handle error
 * }
 * }
 */

interface FetchHelperOptions extends Omit<RequestInit, 'body'> {
  body?: object | string // Allow body to be an object or a string
  useAuth?: boolean
  queryParams?: Record<string, unknown>
  baseURL?: string
}

export type BaseResponse<TData, TError = Error> = {
  data: TData | null
  error: TError | null
}

export type ErrorResponse = {
  status?: number
  response?: {
    error?: {
      code?: string
      message?: string
    }
  }
  code?: number
}

export async function httpRequest<T = unknown>(
  url: string | URL | Request,
  options: FetchHelperOptions = {},
  logRequest: boolean = false,
  signal?: AbortSignal,
): Promise<[T | null, Error | ErrorResponse | null]> {
  const { useAuth, queryParams, baseURL, ...fetchOptions } = options
  const fetchUrl = `${baseURL || process.env.NEXT_PUBLIC_BASE_API_URL}${url}`
  const headers = new Headers(fetchOptions.headers || {})

  const headerContentType = headers.get('Content-Type')
  // if no content-type, and not a form data, set automatically to application json
  if (!headerContentType && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (useAuth) {
    const token = await getAuthToken()
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    } else {
      // You might want to return an error here if a token is required but not found.
      // For now, it just warns in the console.
      console.warn(
        'useAuth was true, but no authentication token was found from Auth.js session.',
      )
    }
  }

  let finalBody: BodyInit | null | undefined = undefined

  if (fetchOptions.body instanceof FormData) {
    finalBody = fetchOptions.body
  } else if (typeof fetchOptions.body === 'object') {
    finalBody = JSON.stringify(fetchOptions.body)
  } else {
    finalBody = fetchOptions.body
  }

  const mergedOptions: RequestInit = {
    ...fetchOptions,
    body: finalBody,
    headers,
    signal,
  }

  if (
    mergedOptions.body &&
    typeof mergedOptions.body === 'object' &&
    !(fetchOptions.body instanceof FormData)
  ) {
    mergedOptions.body = JSON.stringify(mergedOptions.body)
  }

  // Handle query parameters
  const finalUrl = new URL(fetchUrl.toString())
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((val) => {
            finalUrl.searchParams.append(`${key}`, val)
          })
        } else {
          finalUrl.searchParams.append(key, String(value))
        }
      }
    })
  }

  try {
    if (logRequest) {
      console.warn('[httpRequest] Request:', {
        ...mergedOptions,
        url: finalUrl.href,
      })
    }

    const response = await fetch(finalUrl.href, mergedOptions)
    // Handle non-successful responses
    if (!response.ok) {
      try {
        const responseJson = await response.json()
        return [
          null,
          {
            status: response.status,
            response: responseJson,
          },
        ]
      } catch {
        return [
          null,
          {
            status: response.status,
            response: {
              error: {
                code: String(response.status),
                message: response.statusText,
              },
            },
          },
        ]
      }
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return [null as T, null]
    }

    let parsedResponse: T = {} as T
    const contentType = response.headers.get('Content-type')
    if (contentType?.includes('application/json')) {
      parsedResponse = await response.json()
    } else if (contentType?.includes('text/csv')) {
      parsedResponse = { data: await response.blob() } as T
    } else if (
      contentType?.includes(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
    ) {
      parsedResponse = { data: await response.blob() } as T
    } else {
      parsedResponse = { data: await response.text() } as T
    }

    const data: T = parsedResponse

    if (logRequest) {
      console.warn('[httpRequest] Response:', {
        ...data,
        url: finalUrl.href,
      })
    }
    return [data, null]
  } catch (error) {
    // This will catch network errors (e.g., DNS failure) or JSON parsing errors.
    console.error('Fetch helper caught an unexpected error:', error)
    if (error instanceof Error) {
      return [null, error]
    }
    // Handle cases where the caught object is not an Error instance
    return [null, new Error('An unexpected error occurred during the fetch operation.')]
  }
}
